import { Motor } from './Motor'
import wait from './wait'

const WIDTH_OF_AXIS = 250 // mm

export enum Direction {
  left = 'left',
  right = 'right',
}

function otherDirection(direction: Direction): Direction {
  return direction === Direction.left ? Direction.right : Direction.left
}

const twoPi = 2 * Math.PI

function normalizeAngle(angle: number): number {
  return angle - twoPi * Math.floor(angle / twoPi)
}

export default function (motors: {left: Motor, right: Motor}) {
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
      const motor = motors[otherDirection(direction)]
      const other = motors[direction]
      if (onTheSpot) {
        await Promise.all([motor.accelerate(-speed), other.accelerate(speed)])
        const turningSpeed = (100 - speed) * .1 + 2.1
        await wait(turningSpeed * degrees)
      } else {
        await Promise.all([motor.float(), other.accelerate(speed)])
        const turningSpeed = (100 - speed) * -.296 + 3.7
        await wait(turningSpeed * degrees)
      }
      await Promise.all([motor.float(), other.float()])
    },
  }

  let oldLeftPos = motors.left.getPosition()
  let oldRightPos = motors.right.getPosition()

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
  }

  setInterval(updatePosition, 10)

  return car
}
