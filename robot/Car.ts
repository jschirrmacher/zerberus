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
    const diffLeft = Math.abs(oldLeftPos - leftPos)
    const diffRight = Math.abs(oldRightPos - rightPos)
    const dirLeft = Math.sign(oldLeftPos - leftPos)
    const dirRight = Math.sign(oldRightPos - rightPos)
    const forwardWay = (oldLeftPos - leftPos + oldRightPos - rightPos) / 2

    if (diffLeft > diffRight && dirLeft === 1 && dirRight === 1) {
      
    }
    oldLeftPos = leftPos
    oldRightPos = rightPos
  }

  setInterval(updatePosition, 10)

  return car
}
