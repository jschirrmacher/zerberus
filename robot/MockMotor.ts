import { CancellableAsync, resolvedCancellableAsync } from './CancellableAsync'
import { Motor, MotorMode } from './MotorSet'
import ListenerList from './ListenerList'

let motorId = 0

export default function (): Motor {
  let currentPosition = 0
  let currentSpeed = 0

  const listeners = ListenerList()

  const timer = setInterval(() => {
    currentPosition += currentSpeed
    listeners.call(currentPosition, currentSpeed)
  }, 10)

  const motor = {
    no: ++motorId,
    throttle: 0,
    mode: MotorMode.FLOAT,

    async accelerate(throttle: number): Promise<void> {
      this.mode = throttle > 0 ? MotorMode.FORWARD : throttle < 0 ? MotorMode.BACKWARDS : MotorMode.FLOAT
      this.throttle = throttle
      currentSpeed = throttle / 10
    },

    go(distance: number, throttle: number): CancellableAsync {
      const trigger = this.positionReached(currentPosition + distance * Math.sign(throttle))
      this.accelerate(throttle)
      return trigger
    },

    stop(): CancellableAsync {
      motor.accelerate(0)
      this.mode = MotorMode.BREAK
      return resolvedCancellableAsync
    },
    
    float(): CancellableAsync {
      motor.accelerate(0)
      this.mode = MotorMode.FLOAT
      return resolvedCancellableAsync
    },
    
    getPosition(): number {
      return currentPosition
    },
    
    getSpeed(): number {
      return currentSpeed
    },

    positionReached(position: number): CancellableAsync {
      const direction = Math.sign(position - currentPosition)
      return listeners.add((pos: number) => {
        return direction > 0 && pos >= position || direction < 0 && pos <= position
      })
    },

    speedReached(speed: number): CancellableAsync {
      const direction = Math.sign(speed - (currentSpeed || 0))
      return listeners.add((pos: number, spd: number) => {
        return direction > 0 && spd >= speed || direction < 0 && spd <= speed
      })
    },

    destruct(): void {
      clearInterval(timer)
    },
  }

  return motor
}
