import { Motor } from './Motor'

export enum Direction {
  left = 0,
  right = 1,
}

export default function (motor1: Motor, motor2: Motor) {
  return {
    /*
      Accelerate car to the given speed.
      The speed is specified as a percentage of the motor's max speed.
      Speed can also be negative, so that the car runs backwards.
      The car only accelerated in a way, that battery and controller health is preserved.
    */
    accelerate(speed = 100) {
      motor1.accelerate(speed)
      motor2.accelerate(speed)
    },

    stop() {
      motor1.stop()
      motor2.stop()
    },

    float() {
      motor1.float()
      motor2.float()
    },

    /*
      Turn the car in the given direction.
      The radius might be 0, which means that the car turns on its own axis.
      This is done be let one side go forward in the current speed and the
      other side go backwards in the same speed.
    */
    turn(radius: number, direction: Direction) {

    },
  }
}
