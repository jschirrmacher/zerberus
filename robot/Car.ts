import { Motor, TICKS_PER_MM } from './Motor'
import { Position, create as createPosition } from './Position'
import { create as createOrientation, DegreeAngle, Orientation } from './Orientation'
import ListenerList, { emptyTrigger, Listener, Trigger } from './ListenerList'

export const WIDTH_OF_AXIS = 270 // mm
const AXIS_WIDTH_IN_TICKS = WIDTH_OF_AXIS * TICKS_PER_MM

const epsilon = 0.03
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

function assertValidSpeed(speed: number): void {
  if (speed <= 0 || speed > 100) {
    throw Error('Speed should be between 1 and 100')
  }
}

function clamp(min: number, max: number) {
  return (value: number) => Math.min(max, Math.max(min, value))
}

const clampSpeed = clamp(50, 100)

export type Car = {
  position: Position,
  orientation: Orientation,
  accelerate(speed: number): Promise<void>,
  stop(): Promise<void>,
  float(): void,
  turn(degrees: DegreeAngle, direction: Direction, speed: number): Promise<void>,
  turn(degrees: DegreeAngle, direction: Direction, speed: number, onTheSpot: boolean): Promise<void>,
  go(distance: number, speed: number): Promise<void>,
  turnTo(destination: Orientation): Promise<void>,
  goto(position: Position): Promise<void>,
  setPositionListener(listener: Listener): void,
  destruct(): Promise<void>,
}

async function setMotors(left: () => Trigger, right: () => Trigger) {
  const trigger = [ left(), right() ]
  await Promise.race(trigger.map(t => t.promise))
  trigger.forEach(t => t.cancel())
}

export default function (motors: {left: Motor, right: Motor}): Car {
  let interval: NodeJS.Timer
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
  
  const car: Car = {
    position: createPosition(0, 0),
    orientation: createOrientation(0),

    /*
      Accelerate car to the given speed.
      The speed is specified as a percentage of the motor's max speed.
      Speed can also be negative, so that the car runs backwards.
      The car only accelerated in a way, that battery and controller health is preserved.
    */
    async accelerate(speed: number): Promise<void> {
      await setMotors(
        () => motors.left.accelerate(speed),
        () => motors.right.accelerate(speed)
      )
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
      Turn the car in the given direction to a given degree in a given speed.
      If 'onTheSpot' is set true, the wheels will turn in different directions.
      After turning, the motors are switched to floating.
      Speed should always be positive when turning.
    */
    async turn(degrees: DegreeAngle, direction: Direction, speed: number, onTheSpot = false): Promise<void> {
      assertValidSpeed(speed)
      console.debug(`Turn car to the ${direction} ${degrees}° in ${speed}% speed`)
      const motor = motors[otherDirection(direction)]
      const other = motors[direction]
      const angle = normalizeAngle(degrees / 180 * Math.PI)
      if (onTheSpot) {
        const distance = WIDTH_OF_AXIS / 2 * angle * TICKS_PER_MM
        await setMotors(() => motor.go(distance, -speed), () => other.go(distance, speed))
      } else {
        const distance = WIDTH_OF_AXIS * angle * TICKS_PER_MM
        await setMotors(() => motor.float(), () => other.go(distance, speed))
      }
      car.float()
    },

    /*
      Move the car a given distance (measured in motor ticks) in the specified speed.
      The speed is a percentage, with 100% being the maximal capacity of the motors.
      After reaching the position, the car is switched to floating mode.
    */
    async go(distance: number, speed: number): Promise<void> {
      await setMotors(
        () => motors.left.go(distance, speed),
        () => motors.right.go(distance, speed)
      )
      this.stop()
    },

    /*
      Turn car to the given destination angle.
    */
    async turnTo(destination: Orientation): Promise<void> {
      console.log(`turn to ${destination}`)
      const turnAngle = car.orientation.differenceTo(destination)
      if (Math.abs(turnAngle) > epsilon) {
        const direction = turnAngle < 0 ? Direction.left : Direction.right
        const trigger = createTrigger((pos: Position, orientation: Orientation) => orientation.differenceTo(destination))
        const speed = clampSpeed(Math.abs(destination.angle) / Math.PI * 50)
        motors[otherDirection(direction)].accelerate(-speed)
        motors[direction].accelerate(speed)
        await trigger.promise
        car.float()
      }
    },

    /*
      Move car to the given position with the specified speed.
      After reaching the position, the car is switched to floating mode.
    */
    async goto(position: Position): Promise<void> {
      console.debug(`car.goto${position}, currentPos=${this.position} ${this.orientation}`)
      const angle = this.position.angleTo(position)
      await this.turnTo(createOrientation(angle))
      const distance = this.position.distanceTo(position)
      if (distance > 0) {
        const speed = clampSpeed(distance / 16)
        const trigger = [
          motors.left.go(distance, speed),
          motors.right.go(distance, speed)
        ]
        await Promise.race(trigger.map(t => t.promise))
        trigger.forEach(t => t.cancel())
        car.float()
      }
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

    const theta = (a - b) / AXIS_WIDTH_IN_TICKS
    const radius = theta ? AXIS_WIDTH_IN_TICKS * (a + b) / (2 * (a - b)) : 0
    const dY = theta ? (Math.sin(theta) * radius) : (Math.sign(a) === Math.sign(b) ? Math.sign(a) * Math.min(Math.abs(a), Math.abs(b)) : (a + b))
    const dX = (1 - Math.cos(theta)) * radius

    const delta = Math.PI / 2 - car.orientation.angle
    car.position.x += dY * Math.cos(car.orientation.angle) + dX * Math.cos(delta)
    car.position.y += dY * Math.sin(car.orientation.angle) - dX * Math.sin(delta)
    car.orientation = createOrientation(normalizeAngle(car.orientation.angle + theta))

    // console.debug(`leftPos=${leftPos}, rightPos=${rightPos}, a=${a}, b=${b}, dX=${dX}, dY=${dY}, current position: ${car.position.x}, ${car.position.y}, ${car.orientation.degreeAngle()}`)
    if ((Math.abs(a) > epsilon || Math.abs(b) > epsilon || Math.abs(theta) > epsilon)) {
      listeners.call(car.position, car.orientation)
    }
  }

  interval = setInterval(updatePosition, 50)

  return car
}
