import { Motor, TICKS_PER_MM } from "../MotorSet/Motor"
import { Position, create as createPosition } from "./Position"
import { create as createOrientation, fromRadian, Orientation } from "./Orientation"
import ObservableFactory from "../lib/ObservableValue"
import SubjectFactory from "../lib/Subject"
import { waitFor } from "../lib/Trigger"
import { MPU } from "../Hardware/MPU6050"
import { ModuleLogger } from "../lib/Logger"

export const WIDTH_OF_AXIS = 270 // mm
export const AXIS_WIDTH_IN_TICKS = WIDTH_OF_AXIS * TICKS_PER_MM
export const MINIMAL_TURN_ANGLE = fromRadian(Math.PI / 180)
export const MINIMAL_DISTANCE = 20

export enum Direction {
  left = "left",
  right = "right",
}

type MotorBlocked = {
  motor: Motor
}
export type CarEvent = MotorBlocked

function otherDirection(direction: Direction): Direction {
  return direction === Direction.left ? Direction.right : Direction.left
}

function clamp(min: number, max: number) {
  return (value: number) => Math.min(max, Math.max(min, value))
}

const clampThrottle = clamp(40, 100)

export enum CarState {
  NORMAL = "NORMAL",
  BLOCKED = "BLOCKED",
}

type MotorThrottle = { left: number; right: number }

export type Car = ReturnType<typeof CarFactory>

const defaultLogger = ModuleLogger("car")

export default function CarFactory(motors: { left: Motor; right: Motor }, mpu: MPU, logger = defaultLogger) {
  motors.left.blocked.registerObserver(() => handleBlocking(motors.left))
  motors.right.blocked.registerObserver(() => handleBlocking(motors.right))

  function handleBlocking(motor: Motor): boolean {
    car.state.value = CarState.BLOCKED
    // @todo currentAction.cancel()
    motors.left.float()
    motors.right.float()
    car.events.notify({ motor } as MotorBlocked)
    const motorName = motors.left.no === motor.no ? "Left" : "Right"
    logger.debug(`${motorName} motor is blocked, stopped car`)
    return false
  }

  function getTurnThrottles() {
    const currentThrottle = car.getCurrentThrottle()
    if (Math.abs(currentThrottle) < 50) {
      return { lowerThrottle: -50, higherThrottle: 50 }
    } else {
      const higherThrottle = Math.min(currentThrottle + 25, 100)
      const lowerThrottle = Math.max(higherThrottle - 50, -100)
      return { lowerThrottle, higherThrottle }
    }
  }

  function getTurnDirection(angle: Orientation): Direction {
    return angle.angle > 0 ? Direction.right : Direction.left
  }

  const car = {
    motors,
    position: ObservableFactory("position", createPosition(0, 0)),
    orientation: ObservableFactory("orientation", createOrientation(0)),
    state: ObservableFactory("state", CarState.NORMAL),
    events: SubjectFactory<CarEvent>("events"),
    speed: ObservableFactory("speed", 0),
    mpuSpeed: ObservableFactory("newSpeed", 0),

    getCurrentThrottle() {
      return (car.motors.left.throttle + car.motors.right.throttle) / 2
    },

    /*
      Accelerate car to the given throttle.
      The throttle is specified as a percentage of the motor's max throttle.
      Throttle can also be negative, so that the car runs backwards.
    */
    async accelerate(throttle: number) {
      await Promise.all([motors.left.accelerate(throttle), motors.right.accelerate(throttle)])
    },

    async throttle({ left, right }: MotorThrottle) {
      await Promise.all([motors.left.accelerate(left), motors.right.accelerate(right)])
    },

    /*
      Stop the car by using the motor brake
    */
    async stop() {
      await Promise.all([motors.left.stop(), motors.right.stop()])
      car.speed.value = 0
    },

    /*
      Let the motors float, thus, no further acceleration, but no braking
    */
    async float() {
      await Promise.all([motors.left.float(), motors.right.float()])
      car.speed.value = 0
    },

    /*
      Move the car a given distance (measured in motor ticks) with the specified throttle.
      The throttle is a percentage, with 100% being the maximal capacity of the motors.
      After reaching the position, the car is switched to floating mode.
    */
    async go(distance: number, throttle: number): Promise<void> {
      if (Math.abs(distance) >= MINIMAL_DISTANCE) {
        await Promise.all([motors.left.go(distance, throttle), motors.right.go(distance, throttle)]).finally(car.float)
      }
    },

    /*
      Turn car in a given direction by moving the motors on the side of the requested
      direction a bit slower (or even backwards), while accelerating the motors on
      the other side the same amount. In case the car was standing, it turns on spot.
    */
    async turn(direction: Direction): Promise<void> {
      const { higherThrottle, lowerThrottle } = getTurnThrottles()
      // logger.debug(`Turn car ${direction}, throttle=(${higherThrottle}, ${lowerThrottle})`)
      await Promise.all([
        motors[direction].accelerate(lowerThrottle),
        motors[otherDirection(direction)].accelerate(higherThrottle),
      ])
    },

    /*
      Turn the car in the given direction to a given degree.
      After turning, the motors are switched to floating.
    */
    async turnRelative(angle: Orientation): Promise<void> {
      logger.debug(`Turn car ${angle}`)
      if (Math.abs(angle.angle) >= MINIMAL_TURN_ANGLE.angle) {
        const destination = car.orientation.value.add(angle)
        const trigger = waitFor(car.orientation, (orientation) =>
          orientation.isCloseTo(destination, MINIMAL_TURN_ANGLE),
        )
        await car.turn(getTurnDirection(angle))
        await trigger
        await car.float()
        logger.debug(`car.turn: arrived at ${this.position} ${this.orientation}`)
      } else {
        logger.debug(`car.turn: already at ${this.position} ${this.orientation}`)
      }
    },

    /*
      Turn car to the given destination angle.
    */
    async turnTo(destination: Orientation): Promise<void> {
      const diff = car.orientation.value.differenceTo(destination)
      await car.turnRelative(diff)
    },

    /*
      Move car to the given position.
      After reaching the position, the car is switched to floating mode.
    */
    async goto(position: Position): Promise<void> {
      const distance = car.position.value.distanceTo(position)
      if (distance > MINIMAL_DISTANCE) {
        logger.debug(`car.goto${position}, distance: ${distance}, currentPos=${this.position} ${this.orientation}`)

        const trigger = waitFor(car.position, (pos) => Math.abs(pos.distanceTo(position)) < MINIMAL_DISTANCE)
        const observer = (orientation: Orientation) => {
          const angle = orientation.differenceTo(createOrientation(car.position.value.angleTo(position)))
          // logger.debug(`should be ${angle.toString()}`)
          const distance = car.position.value.distanceTo(position)
          const throttle = clampThrottle(Math.sqrt(distance))
          if (Math.abs(angle.angle) > 1) {
            const direction = getTurnDirection(angle)
            const { higherThrottle, lowerThrottle } = getTurnThrottles()
            motors[direction].setThrottle(lowerThrottle)
            motors[otherDirection(direction)].setThrottle(higherThrottle)
          } else {
            car.motors.left.setThrottle(throttle + angle.angle * 40)
            car.motors.right.setThrottle(throttle - angle.angle * 40)
          }
        }
        car.orientation.registerObserver(observer)
        await trigger
        car.orientation.unregisterObserver(observer)
      }
      car.float()
      logger.debug(`car.goto: arrived at currentPos=${this.position} ${this.orientation}`)
    },

    async destruct(): Promise<void> {
      await car.stop()
      logger.debug("Car stopped")
      motors.left.destruct()
      motors.right.destruct()
    },
  }

  let oldLeftPos = motors.left.position.value
  let oldRightPos = motors.right.position.value

  function updatePosition() {
    const leftPos = motors.left.position.value
    const rightPos = motors.right.position.value
    const a = leftPos - oldLeftPos
    const b = rightPos - oldRightPos
    oldLeftPos = leftPos
    oldRightPos = rightPos

    if (a || b) {
      const theta = (a - b) / AXIS_WIDTH_IN_TICKS
      const radius = theta ? (AXIS_WIDTH_IN_TICKS * (a + b)) / (2 * (a - b)) : 0
      const dY = theta
        ? Math.sin(theta) * radius
        : Math.sign(a) === Math.sign(b)
          ? Math.sign(a) * Math.min(Math.abs(a), Math.abs(b))
          : a + b
      const dX = (1 - Math.cos(theta)) * radius

      const angle = car.orientation.value.angle
      const delta = Math.PI / 2 - angle
      car.position.value = car.position.value.add(
        dY * Math.cos(angle) + dX * Math.cos(delta),
        -dY * Math.sin(angle) + dX * Math.sin(delta),
      )
      car.orientation.value = fromRadian(angle + theta)
      car.speed.value =
        (((car.motors.left.speed.value + car.motors.right.speed.value) / 2 / TICKS_PER_MM / 1000) * 3600) / 1000
    }
  }

  motors.left.position.registerObserver(updatePosition)
  motors.right.position.registerObserver(updatePosition)

  return car
}
