import { Encoder, TICKS_PER_REV } from "./Encoder"
import { CancellableAsync } from "./CancellableAsync"
import { GPIO, OUTPUT, PWM } from './gpio'
import ListenerList, { Listener } from "./ListenerList"
import { Logger, LogLevel } from "./Logger"

export const DIAMETER = 120 // mm
export const PERIMETER = DIAMETER * Math.PI
export const TICKS_PER_MM = TICKS_PER_REV / PERIMETER
export const MAX_ACCELERATION = 40
export const MAX_BLOCK_COUNT = 5

export interface Motor {
  no: number
  throttle: number
  mode: MotorMode
  accelerate: (throttle: number) => CancellableAsync
  go(distance: number, throttle: number): CancellableAsync
  stop: () => CancellableAsync
  float: () => CancellableAsync
  getPosition: () => number
  getSpeed(): number
  positionReached(position: number): CancellableAsync
  speedReached(speed: number): CancellableAsync
  destruct(): void

  onBlocked(listener: Listener): void
  releaseBlock(): void
}

export enum MotorMode {
  BREAK = 'break',
  FLOAT = 'float',
  FORWARD = 'forward',
  BACKWARDS = 'backwards'
}

let motorNo = 1

export function getAdaptedThrottle(desired: number, current: number): number {
  const diff = desired - current
  return current + Math.sign(diff) * Math.min(Math.abs(diff), MAX_ACCELERATION)
}

export default function (gpio: GPIO, pin_in1: number, pin_in2: number, pin_ena: number, encoder = undefined as Encoder, logger = undefined as Logger): Motor {
  const in1 = gpio.create(pin_in1, { mode: OUTPUT })
  const in2 = gpio.create(pin_in2, { mode: OUTPUT })
  const ena = gpio.create(pin_ena, { mode: PWM })
  let blockCount = 0
  const blockListeners = ListenerList()
  const timer = setInterval(tick, 10)
  const debugLog = process.env.DEBUG && process.env.DEBUG.split(',').includes('motorset')

  function log(level: LogLevel, msg: string) {
    if (level !== LogLevel.debug || debugLog) {
      (logger || console)[level](`Motor,${motor.no},${motor.mode},${motor.currentThrottle.toFixed(0)},${msg}`)
    }
  }

  function tick() {
    if (motor.throttle && !motor.getSpeed()) {
      if (++blockCount === MAX_BLOCK_COUNT) {
        log(LogLevel.warn, `motor is blocked and will be set to FLOAT`)
        motor.throttle = 0
        setMode(motor, MotorMode.FLOAT)
        blockListeners.call(motor)
        return
      } else {
        log(LogLevel.info, `motor seems to be blocked #${blockCount}`)
      }
    } else {
      if (blockCount) {
        log(LogLevel.info, `motor is released automatically`)
      }
      blockCount = 0
    }
    motor.throttle !== motor.currentThrottle && adaptSpeed()
  }
  
  function setMode(motor: Motor, mode: MotorMode): void {
    in1.digitalWrite(mode === MotorMode.FORWARD || mode === MotorMode.FLOAT ? 1 : 0)
    in2.digitalWrite(mode === MotorMode.BACKWARDS || mode === MotorMode.FLOAT ? 1 : 0)
    motor.mode = mode
  }

  function adaptSpeed(): void {
    motor.currentThrottle = getAdaptedThrottle(motor.throttle, motor.currentThrottle)
    if (motor.mode !== MotorMode.BREAK) {
      if (motor.currentThrottle < 0 && motor.mode !== MotorMode.BACKWARDS) {
        setMode(motor, MotorMode.BACKWARDS)
      } else if (motor.currentThrottle > 0 && motor.mode !== MotorMode.FORWARD) {
        setMode(motor, MotorMode.FORWARD)
      } else if (motor.currentThrottle === 0 && motor.mode !== MotorMode.FLOAT) {
        setMode(motor, MotorMode.FLOAT)
      }
    }
    const pwmValue = Math.max(0, Math.min(255, Math.round(Math.abs(motor.currentThrottle * 2.55))))
    ena.pwmWrite(pwmValue)
    encoder.simulateSpeed(motor.currentThrottle)
    log(LogLevel.debug, 'adaptSpeed')
  }

  function assertNormalOperation() {
    if (blockCount >= MAX_BLOCK_COUNT) {
      throw Error(`Tried to accelerate when motor is blocked`)
    }
  }

  const motor = {
    no: motorNo++, 
    throttle: 0,
    currentThrottle: 0,
    mode: MotorMode.FLOAT,

    accelerate(throttle: number): CancellableAsync {
      assertNormalOperation()
      const trigger = encoder.listeners.add(() => motor.currentThrottle === motor.throttle)
      blockListeners.add(() => {
        trigger.cancel()
        return true
      })
      motor.throttle = Math.min(Math.abs(throttle), 100) * Math.sign(throttle)
      return trigger
    },

    go(distance: number, throttle: number): CancellableAsync {
      assertNormalOperation()
      // log(LogLevel.debug, `go(distance=${distance}, throttle=${throttle}), trigger=${encoder.currentPosition + distance * Math.sign(speed)}`)
      const trigger = motor.positionReached(encoder.currentPosition + distance * Math.sign(throttle))
      motor.throttle = throttle
      blockListeners.add(() => (trigger.cancel(), true))
      return trigger
    },
    
    stop(): CancellableAsync {
      motor.throttle = 0
      setMode(motor, MotorMode.BREAK)
      return motor.speedReached(0)
        .finally(() => setMode(motor, MotorMode.FLOAT))
    },
    
    float(): CancellableAsync {
      motor.throttle = 0
      return motor.speedReached(0)
    },

    getPosition(): number {
      return encoder.currentPosition
    },

    getSpeed() {
      if (encoder) {
        return encoder.currentSpeed()
      } else {
        return 0
      }
    },

    /*
      Installs a listener Returns a CancellableAsync with a promise for a position to be reached.
    */
    positionReached(desiredPosition: number): CancellableAsync {
      log(LogLevel.debug, `setting trigger to position=${desiredPosition}`)
      const direction = Math.sign(desiredPosition - encoder.currentPosition)
      return encoder.listeners.add((pos: number) => {
        return direction > 0 && pos >= desiredPosition || direction < 0 && pos <= desiredPosition
      })
    },

    speedReached(desiredSpeed: number): CancellableAsync {
      log(LogLevel.debug, `setting trigger to speed=${desiredSpeed}`)
      const direction = Math.sign(desiredSpeed - (encoder.currentSpeed() || 0))
      return encoder.listeners.add((pos: number, speed: number) => {
        return direction > 0 && speed >= desiredSpeed || direction < 0 && speed <= desiredSpeed
      })
    },

    destruct(): void {
      clearInterval(timer)
      encoder.simulateSpeed(0)
      setMode(motor, MotorMode.FLOAT)
      ena.pwmWrite(0)
    },

    onBlocked: blockListeners.add,

    releaseBlock() {
      log(LogLevel.debug, `Block released`)
      blockCount = 0
    }
  }
  
  return motor
}