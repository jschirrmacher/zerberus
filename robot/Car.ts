import { Motor, TICKS_PER_MM } from "./MotorSet"
import { Position, create as createPosition } from "./Position"
import { create as createOrientation, fromRadian, Orientation } from "./Orientation"
import ObservableValueFactory, { ObservableValue } from "./ObservableValue"
import SubjectFactory, { Subject } from "./Subject"
import { waitFor } from "./Trigger"

export const WIDTH_OF_AXIS = 270 // mm
export const AXIS_WIDTH_IN_TICKS = WIDTH_OF_AXIS * TICKS_PER_MM
export const MINIMAL_TURN_ANGLE = fromRadian(Math.PI / 180)
export const MINIMAL_DISTANCE = 20

const epsilon = 0.003

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

const clampSpeed = clamp(40, 100)

enum CarState {
  NORMAL = "NORMAL",
  BLOCKED = "BLOCKED",
}

export type Car = {
  motors: Record<Direction, Motor>
  position: ObservableValue<Position>
  orientation: ObservableValue<Orientation>
  speed(): number
  state: ObservableValue<CarState>
  events: Subject<CarEvent>

  accelerate(speed: number): Promise<void>
  stop(): Promise<void>
  float(): Promise<void>
  go(distance: number, speed: number): Promise<void>
  turn(direction: Direction): Promise<void>

  turnRelative(angle: Orientation): Promise<void>
  turnRelative(angle: Orientation, onTheSpot: boolean): Promise<void>

  turnTo(destination: Orientation): Promise<void>
  goto(position: Position): Promise<void>

  destruct(): Promise<void>
}

const debug = process.env.DEBUG && process.env.DEBUG.split(",").includes("car") ? console.debug : () => undefined

export default function (motors: { left: Motor; right: Motor }, logger = { debug }): Car {
  motors.left.blocked.registerObserver(() => handleBlocking(motors.left))
  motors.right.blocked.registerObserver(() => handleBlocking(motors.right))

  function handleBlocking(motor: Motor): boolean {
    car.state.set(CarState.BLOCKED)
    // @todo currentAction.cancel()
    motors.left.float()
    motors.right.float()
    car.events.notify({ motor } as MotorBlocked)
    const motorName = motors.left.no === motor.no ? "Left" : "Right"
    logger.debug(`${motorName} motor is blocked, stopped car`)
    return false
  }

  function getTurnSpeeds() {
    const currentSpeed = car.speed()
    if (Math.abs(currentSpeed) < 50) {
      return { lowerSpeed: -50, higherSpeed: 50 }
    } else {
      const higherSpeed = Math.min(currentSpeed + 25, 100)
      const lowerSpeed = Math.max(higherSpeed - 50, -100)
      return { lowerSpeed, higherSpeed }
    }
  }

  function getTurnDirection(angle: Orientation): Direction {
    return angle.angle > 0 ? Direction.right : Direction.left
  }

  const car: Car = {
    motors,
    position: ObservableValueFactory("position", createPosition(0, 0)),
    orientation: ObservableValueFactory("orientation", createOrientation(0)),
    state: ObservableValueFactory<CarState>("state", CarState.NORMAL),
    events: SubjectFactory<CarEvent>("events"),

    /*
      Returns the current throttle of the car
    */
    speed() {
      return (motors.left.throttle + motors.right.throttle) / 2
    },

    /*
      Accelerate car to the given throttle.
      The throttle is specified as a percentage of the motor's max throttle.
      Throttle can also be negative, so that the car runs backwards.
    */
    async accelerate(throttle: number) {
      await Promise.all([motors.left.accelerate(throttle), motors.right.accelerate(throttle)])
    },

    /*
      Stop the car by using the motor brake
    */
    async stop() {
      await Promise.all([motors.left.stop(), motors.right.stop()])
    },

    /*
      Let the motors float, thus, no further acceleration, but no braking
    */
    async float() {
      await Promise.all([motors.left.float(), motors.right.float()])
    },

    /*
      Move the car a given distance (measured in motor ticks) in the specified speed.
      The speed is a percentage, with 100% being the maximal capacity of the motors.
      After reaching the position, the car is switched to floating mode.
    */
    async go(distance: number, speed: number): Promise<void> {
      if (Math.abs(distance) >= MINIMAL_DISTANCE) {
        await Promise.all([motors.left.go(distance, speed), motors.right.go(distance, speed)]).finally(car.float)
      }
    },

    /*
      Turn car in a given direction by moving the motors on the side of the requested
      direction a bit slower (or even backwards), while accelerating the motors on
      the other side the same amount. In case the car was standing, it turns on spot.
    */
    async turn(direction: Direction): Promise<void> {
      const { higherSpeed, lowerSpeed } = getTurnSpeeds()
      // logger.debug(`Turn car ${direction}, speed=(${higherSpeed}, ${lowerSpeed})`)
      await Promise.all([
        motors[direction].accelerate(lowerSpeed),
        motors[otherDirection(direction)].accelerate(higherSpeed),
      ])
    },

    /*
      Turn the car in the given direction to a given degree.
      After turning, the motors are switched to floating.
    */
    async turnRelative(angle: Orientation): Promise<void> {
      logger.debug(`Turn car ${angle}`)
      if (Math.abs(angle.angle) >= MINIMAL_TURN_ANGLE.angle) {
        const destination = car.orientation.get().add(angle)
        const trigger = waitFor(car.orientation, (orientation) =>
          orientation.isCloseTo(destination, MINIMAL_TURN_ANGLE)
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
      const diff = car.orientation.get().differenceTo(destination)
      await car.turnRelative(diff)
    },

    /*
      Move car to the given position with the specified speed.
      After reaching the position, the car is switched to floating mode.
    */
    async goto(position: Position): Promise<void> {
      const distance = car.position.get().distanceTo(position)
      if (distance > MINIMAL_DISTANCE) {
        logger.debug(
          `car.goto${position}, distance: ${distance}, currentPos=${this.position
            .get()
            .toString()} ${this.orientation.get().toString()}`
        )

        const trigger = waitFor(car.position, (pos) => Math.abs(pos.distanceTo(position)) < MINIMAL_DISTANCE)
        const observer = (orientation: Orientation) => {
          const angle = orientation.differenceTo(createOrientation(car.position.get().angleTo(position)))
          // console.log(`should be ${angle.toString()}`)
          const distance = car.position.get().distanceTo(position)
          const speed = clampSpeed(Math.sqrt(distance))
          if (Math.abs(angle.angle) > 1) {
            console.log("angle > 1")
            const direction = getTurnDirection(angle)
            const { higherSpeed, lowerSpeed } = getTurnSpeeds()
            motors[direction].setThrottle(lowerSpeed)
            motors[otherDirection(direction)].setThrottle(higherSpeed)
          } else {
            car.motors.left.setThrottle(speed + angle.angle * 40)
            car.motors.right.setThrottle(speed - angle.angle * 40)
          }
        }
        car.orientation.registerObserver(observer)
        await trigger
        car.orientation.unregisterObserver(observer)

        car.float()
      }
      logger.debug(`car.goto: arrived at currentPos=${this.position.get()} ${this.orientation.get()}`)
    },

    async destruct(): Promise<void> {
      await car.stop()
      motors.left.destruct()
      motors.right.destruct()
    },
  }

  let oldLeftPos = motors.left.position.get()
  let oldRightPos = motors.right.position.get()

  function updatePosition() {
    const leftPos = motors.left.position.get()
    const rightPos = motors.right.position.get()
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

      const delta = Math.PI / 2 - car.orientation.get().angle
      const position = car.position.get()
      const orientation = car.orientation.get()
      // console.log("actual: " + orientation.toString())
      const pos = createPosition(
        position.x + dY * Math.cos(orientation.angle) + dX * Math.cos(delta),
        position.y - dY * Math.sin(orientation.angle) + dX * Math.sin(delta)
      )
      car.position.set(pos)
      car.orientation.set(createOrientation(car.orientation.get().angle + theta))
    }
  }

  motors.left.position.registerObserver(updatePosition)
  motors.right.position.registerObserver(updatePosition)

  return car
}
