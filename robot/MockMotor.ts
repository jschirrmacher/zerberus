import { CancellableAsync, resolvedCancellableAsync } from './CancellableAsync'
import { Motor, MotorMode } from './MotorSet'

let motorId = 0

export default function (): Motor {
  let position = 0

  return {
    no: ++motorId,
    throttle: 0,
    mode: MotorMode.FLOAT,

    async accelerate(throttle: number): Promise<void> {
      this.throttle = throttle
    },

    go(distance: number, throttle: number): CancellableAsync {
      position += distance
      this.throttle = throttle
      return resolvedCancellableAsync
    },

    stop(): CancellableAsync {
      this.mode = MotorMode.BREAK
      this.throttle = 0
      return resolvedCancellableAsync
    },
    
    float(): CancellableAsync {
      this.mode = MotorMode.FLOAT
      this.throttle = 0
      return resolvedCancellableAsync
    },
    
    getPosition(): number {
      return position
    },
    
    getSpeed(): number {
      return this.throttle
    },

    positionReached(position: number): CancellableAsync {
      return resolvedCancellableAsync
    },

    speedReached(speed: number): CancellableAsync {
      return resolvedCancellableAsync
    },

    destruct(): void {
      // do nothing
    },

  }
}
