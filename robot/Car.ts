import { Motor } from './Motor'

export enum Direction {
  left = 'left',
  right = 'right',
}

export default function (motors: {left: Motor, right: Motor}) {
  return {
    /*
      Accelerate car to the given speed.
      The speed is specified as a percentage of the motor's max speed.
      Speed can also be negative, so that the car runs backwards.
      The car only accelerated in a way, that battery and controller health is preserved.
    */
    accelerate(speed = 100) {
      motors.left.accelerate(speed)
      motors.right.accelerate(speed)
    },

    stop() {
      motors.left.stop()
      motors.right.stop()
    },

    float() {
      motors.left.float()
      motors.right.float()
    },

    /*
      Turn the car in the given direction.
      The radius is given as a percentage of the speed of the inner motor
      in comparison to the outer motor. So, 0 means the inner motor doesn't
      turn at all, while 100 lets both motors run at the same speed, and so
      keeps the car going straight forward.
      To turn in place, specify -100 as percentage.
    */
    turn(radius: number, direction: Direction) {
      const currentSpeed = motors[direction].speed
      motors[direction].accelerate(currentSpeed * radius / 100)
    },
  }
}
