import { Motor, TICKS_PER_MM } from './MotorSet'
import { Position, create as createPosition } from './Position'
import { create as createOrientation, Orientation } from './Orientation'
import ListenerList, { Listener } from './ListenerList'
import { CancellableAsync } from './CancellableAsync'

export const WIDTH_OF_AXIS = 270 // mm
export const AXIS_WIDTH_IN_TICKS = WIDTH_OF_AXIS * TICKS_PER_MM
export const MINIMAL_TURN_ANGLE = Math.PI / 180
export const MINIMAL_DISTANCE = 20

const epsilon = 0.003

export enum Direction {
  left = 'left',
  right = 'right',
}

function otherDirection(direction: Direction): Direction {
  return direction === Direction.left ? Direction.right : Direction.left
}

function clamp(min: number, max: number) {
  return (value: number) => Math.min(max, Math.max(min, value))
}

const clampSpeed = clamp(50, 100)

export type Car = {
  motors: Record<Direction, Motor>,
  position: Position,
  orientation: Orientation,
  speed(): number,

  accelerate(speed: number): void,
  stop(): Promise<void>,
  float(): void,
  go(distance: number, speed: number): Promise<void>,
  turn(direction: Direction): Promise<void>,

  turnRelative(angle: Orientation): Promise<void>,
  turnRelative(angle: Orientation, onTheSpot): Promise<void>,

  turnTo(destination: Orientation): Promise<void>,
  goto(position: Position): Promise<void>,

  setPositionListener(listener: Listener): void,
  destruct(): Promise<void>,
}

async function setMotors(left: () => CancellableAsync, right: () => CancellableAsync) {
  const trigger = [ left(), right() ]
  await Promise.all(trigger.map(t => t.promise))
  trigger.forEach(t => t.cancel())
}

export default function (motors: {left: Motor, right: Motor}): Car {
  const listeners = ListenerList()

  function createTrigger(getDiff: (pos: Position, orientation: Orientation) => number) {
    let prevDiff: number
    return listeners.add((pos: Position, orientation: Orientation) => {
      const diff = Math.abs(getDiff(pos, orientation))
      const stop = diff < epsilon || (prevDiff && diff > prevDiff)
      prevDiff = diff
      return stop
    })
  }

  function getTurnSpeed(currentSpeed: number): { lowerSpeed: number, higherSpeed: number } {
    if (Math.abs(currentSpeed) < 50) {
      return { lowerSpeed: -50, higherSpeed: 50 }
    }

    const higherSpeed = Math.min(currentSpeed + 25, 100)
    const lowerSpeed = Math.max(higherSpeed - 50, -100)
    return { lowerSpeed, higherSpeed }
  }
  
  const car: Car = {
    motors,
    position: createPosition(0, 0),
    orientation: createOrientation(0),

    /*
      Returns the current throttle of the car
    */
    speed() {
      return (motors.left.throttle + motors.right.throttle) / 2
    },

    /*
      Accelerate car to the given speed.
      The speed is specified as a percentage of the motor's max speed.
      Speed can also be negative, so that the car runs backwards.
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
      await setMotors(() => motors.left.stop(), () => motors.right.stop())
    },

    /*
      Let the motors float, thus, no further acceleration, but no braking
    */
    async float(): Promise<void> {
      await setMotors(() => motors.left.float(), () => motors.right.float())
    },

    /*
      Move the car a given distance (measured in motor ticks) in the specified speed.
      The speed is a percentage, with 100% being the maximal capacity of the motors.
      After reaching the position, the car is switched to floating mode.
    */
    async go(distance: number, speed: number): Promise<void> {
      if (Math.abs(distance) >= MINIMAL_DISTANCE) {
        await setMotors(
          () => motors.left.go(distance, speed),
          () => motors.right.go(distance, speed)
        )
        this.float()
      }
    },

    /*
      Turn car in a given direction by moving the motors on the side of the requested
      direction a bit slower (or even backwards), while accelerating the motors on
      the other side the same amount. In case the car was standing, it turns on spot.
    */
    async turn(direction: Direction): Promise<void> {
      const { higherSpeed, lowerSpeed } = getTurnSpeed(car.speed())
      console.debug(`Turn car ${direction}, speed=(${higherSpeed}, ${lowerSpeed})`)
      await Promise.all([
        motors[direction].accelerate(lowerSpeed),
        motors[otherDirection(direction)].accelerate(higherSpeed)
      ])
    },

    /*
      Turn the car in the given direction to a given degree.
      If 'onTheSpot' is set true, the wheels will turn in different directions.
      After turning, the motors are switched to floating.
      Speed should always be positive when turning.
    */
    async turnRelative(angle: Orientation, onTheSpot = false): Promise<void> {
      console.debug(`Turn car ${angle}`)
      if (Math.abs(angle.angle) >= MINIMAL_TURN_ANGLE) {
        const direction = angle.angle > 0 ? Direction.right : Direction.left
        const motor = motors[direction]
        const other = motors[otherDirection(direction)]
        const speed = Math.abs(angle.angle) > 1 ? 100 : 75
        const distance = WIDTH_OF_AXIS / (onTheSpot ? 2 : 1) * Math.abs(angle.angle) * TICKS_PER_MM
        console.debug(`car.turn: dist=${distance}, dir=${direction}, speed=${speed}, onTheSpot=${onTheSpot}`)
        if (onTheSpot) {
          await setMotors(
            () => motor.go(distance, -speed),
            () => other.go(distance, speed)
          )
        } else {
          motor.float()
          await other.go(distance, speed).promise
        }
        car.float()
        console.debug(`car.turn: arrived at ${this.position} ${this.orientation}`)
      } else {
        console.debug(`car.turn: already at ${this.position} ${this.orientation}`)
      }
    },

    /*
      Turn car to the given destination angle.
    */
    async turnTo(destination: Orientation): Promise<void> {
      function adaptSpeed(orientation: Orientation) {
        const diff = orientation.differenceTo(destination)
        console.debug(`diff=${createOrientation(diff)}`)
        if (Math.abs(diff) > MINIMAL_TURN_ANGLE) {
          car.turn(diff > 0 ? Direction.right : Direction.left)
        }
        return diff
      }

      console.log(`turnTo=${destination}`)
      if (Math.abs(car.orientation.differenceTo(destination)) >= MINIMAL_TURN_ANGLE) {
        const trigger = createTrigger((pos: Position, ori: Orientation) => adaptSpeed(ori))
        adaptSpeed(car.orientation)
        await trigger.promise
        car.float()
        console.debug(`Turning completed at ${car.orientation}`)
      }
    },

    /*
      Move car to the given position with the specified speed.
      After reaching the position, the car is switched to floating mode.
    */
    async goto(position: Position): Promise<void> {
      const distance = this.position.distanceTo(position)
      if (distance > MINIMAL_DISTANCE) {
        console.debug(`car.goto${position}, distance: ${distance}, currentPos=${this.position} ${this.orientation}`)

        const direction = createOrientation(this.position.angleTo(position))
        const angle = direction.differenceTo(car.orientation)
        await this.turnRelative(createOrientation(angle), true)

        const newDistance = this.position.distanceTo(position)
        const speed = clampSpeed(newDistance / 16)
        await car.go(newDistance, speed)
        car.float()
      }
      console.debug(`car.goto: arrived at currentPos=${this.position} ${this.orientation}`)
    },

    setPositionListener(listener: Listener): void {
      listeners.add(listener)
    },

    async destruct(): Promise<void> {
      await car.stop()
      motors.left.destruct()
      motors.right.destruct()
      interval && clearInterval(interval)
    }
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

    if (a || b) {
      const theta = (a - b) / AXIS_WIDTH_IN_TICKS
      const radius = theta ? AXIS_WIDTH_IN_TICKS * (a + b) / (2 * (a - b)) : 0
      const dY = theta ? (Math.sin(theta) * radius) : (Math.sign(a) === Math.sign(b) ? Math.sign(a) * Math.min(Math.abs(a), Math.abs(b)) : (a + b))
      const dX = (1 - Math.cos(theta)) * radius

      const delta = Math.PI / 2 - car.orientation.angle
      car.position.x += dY * Math.cos(car.orientation.angle) + dX * Math.cos(delta)
      car.position.y += dY * Math.sin(car.orientation.angle) + dX * Math.sin(delta)
      car.orientation = createOrientation(car.orientation.angle + theta)

      console.debug(`leftPos=${leftPos}, rightPos=${rightPos}, a=${a}, b=${b}, dX=${dX}, dY=${dY}, current position: ${car.position.x}, ${car.position.y}, ${car.orientation.degreeAngle()}°`)
      if (dX || dY || theta) {
        // console.log('Current orientation: ' + car.orientation)
        listeners.call(car.position, car.orientation)
      }
    }
  }

  const interval = setInterval(updatePosition, 20)

  return car
}
