import { Motor } from './Motor'
const Gpio = require('../gpio')

const WIDTH_OF_AXIS = 250 // mm
const epsilon = 0.1
const twoPi = 2 * Math.PI

export enum Direction {
  left = 'left',
  right = 'right',
}

function otherDirection(direction: Direction): Direction {
  return direction === Direction.left ? Direction.right : Direction.left
}

function normalizeAngle(angle: number): number {
  return angle - twoPi * Math.floor(angle / twoPi)
}

export default function (motors: {left: Motor, right: Motor}) {
  let interval: NodeJS.Timer

  const car = {
    // positions in ticks. A tick is the minimal measurable unit of the motors
    positionX: 0 as number,
    positionY: 0 as number,

    // Orientation of the car in degree
    orientation: 0 as number,

    /*
      Accelerate car to the given speed.
      The speed is specified as a percentage of the motor's max speed.
      Speed can also be negative, so that the car runs backwards.
      The car only accelerated in a way, that battery and controller health is preserved.
    */
    async accelerate(speed: number): Promise<void> {
      await Promise.all([
        motors.left.accelerate(speed),
        motors.right.accelerate(speed)
      ])
    },

    /*
      Stop the car by using the motor brake
    */
    async stop(): Promise<void> {
      await Promise.all([
        motors.left.stop(),
        motors.right.stop()
      ])
      car.float()
    },

    /*
      Let the motors float, thus, no further acceleration, but no braking
    */
    float(): void {
      motors.left.float()
      motors.right.float()
    },

    /*
      Turn the car in the given direction to a given degree in a given speed.
      If 'onTheSpot' is set true, the wheels will turn in different directions.
      After turning, the motors are switched to floating.
      Speed should always be positive when turning.
    */
    async turn(degrees: number, direction: Direction, speed: number, onTheSpot = false): Promise<void> {
      if (speed <= 0 || speed > 100) {
        throw Error('Speed should be between 1 and 100')
      }
      console.debug(`Turn car to the ${direction} ${degrees}° in ${speed}% speed`)
      const motor = motors[otherDirection(direction)]
      const other = motors[direction]
      const angle = normalizeAngle(degrees / 180 * Math.PI - this.orientation)
      if (onTheSpot) {
        const distance = WIDTH_OF_AXIS / 2 * angle
        await Promise.all([motor.go(distance, -speed), other.go(distance, speed)])
      } else {
        const distance = WIDTH_OF_AXIS * angle
        await Promise.all([motor.float(), other.go(distance, speed)])
      }
      await Promise.all([motor.float(), other.float()])
    },

    async go(distance: number, speed: number): Promise<void> {
      await Promise.all([
        motors.left.go(distance, speed),
        motors.right.go(distance, speed)
      ])
      await this.float()
    },

    async goto(posX: number, posY: number, speed: number): Promise<void> {
      const dX = posX - this.positionX
      const dY = posY - this.positionY
      const direction = Math.atan(dY / dX) + (dX < 0 && dY < 0 ? Math.PI : 0)
      const distance = Math.sqrt(dX * dX + dY * dY)
      await this.turn((direction - this.orientation) * (180 / Math.PI), Direction.left, speed, true)
      await this.go(distance, speed)
    },

    async destruct() {
      await car.stop()
      motors.left.destruct()
      motors.right.destruct()
      interval && clearInterval(interval)
    }
  }

  let oldLeftPos = motors.left.getPosition()
  let oldRightPos = motors.right.getPosition()
  const gpio = new Gpio()

  function updatePosition() {
    const leftPos = motors.left.getPosition()
    const rightPos = motors.right.getPosition()
    const a = leftPos - oldLeftPos
    const b = rightPos - oldRightPos
    oldLeftPos = leftPos
    oldRightPos = rightPos

    const theta = (a - b) / WIDTH_OF_AXIS
    const radius = theta ? WIDTH_OF_AXIS * (a + b) / (2 * (a - b)) : 0
    const dY = Math.sin(theta) * radius
    const dX = (1 - Math.cos(theta)) * radius
    const delta = Math.PI / 2 - car.orientation
    car.positionX += dY * Math.cos(car.orientation) + dX * Math.cos(delta)
    car.positionY += dY * Math.sin(car.orientation) - dX * Math.sin(delta)
    car.orientation = normalizeAngle(car.orientation + theta)

    if (gpio.setCarPosition && (Math.abs(a) > epsilon || Math.abs(b) > epsilon || Math.abs(theta) > epsilon)) {
      gpio.setCarPosition(car.positionX, car.positionY, car.orientation)
    }
  }

  interval = setInterval(updatePosition, 50)

  return car
}
