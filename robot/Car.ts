import { Motor } from './Motor'
import wait from './wait'

export enum Direction {
  left = 'left',
  right = 'right',
}

function otherDirection(direction: Direction): Direction {
  return direction === Direction.left ? Direction.right : Direction.left
}

export default function (motors: {left: Motor, right: Motor}) {
  const car = {
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

    async stop(): Promise<void> {
      await Promise.all([
        motors.left.stop(),
        motors.right.stop()
      ])
      car.float()
    },

    float(): void {
      motors.left.float()
      motors.right.float()
    },

    /*
      Turn the car in the given direction to a given degree in a given speed.
      If 'onTheSpot' is set true, the wheels will turn in different directions.
      After turning, the motors are switched to floating.
    */
    async turn(degrees: number, direction: Direction, speed: number, onTheSpot = false): Promise<void> {
      const motor = motors[otherDirection(direction)]
      const other = motors[direction]
      if (onTheSpot) {
        await Promise.all([motor.accelerate(-speed), other.accelerate(speed)])
        await wait(2.16 * degrees)
      } else {
        await Promise.all([motor.float(), other.accelerate(speed)])
        await wait(18.5 * degrees)
      }
      await Promise.all([motor.float(), other.float()])
    },
  }

  return car
}
