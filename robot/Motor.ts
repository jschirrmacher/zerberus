import { Encoder, TICKS_PER_REV } from "./Encoder"
import { CancellableAsync, resolvedCancellableAsync } from "./CancellableAsync"
import wait from "./wait"
import { GPIO, OUTPUT, PWM } from './gpio'

export const DIAMETER = 120 // mm
export const PERIMETER = DIAMETER * Math.PI
export const TICKS_PER_MM = TICKS_PER_REV / PERIMETER

const MAX_ACCELERATION = 40

export type Motor = {
  no: number,
  speed: number,
  mode: MotorMode,
  accelerate: (speed: number) => Promise<void>,
  go(distance: number, speed: number): CancellableAsync,
  stop: () => CancellableAsync,
  float: () => CancellableAsync,
  getPosition: () => number,
  getSpeed(): number,
  positionReached(position: number): CancellableAsync,
  speedReached(speed: number): CancellableAsync,
  destruct(): void,
}

export enum MotorMode {
  BREAK = 'break',
  FLOAT = 'float',
  FORWARD = 'forward',
  BACKWARDS = 'backwards'
}

let motorNo = 1

export default function (gpio: GPIO, pin_in1: number, pin_in2: number, pin_ena: number, encoder = undefined as Encoder, logger = { debug: console.debug }): Motor {
  let destructed = false
  const in1 = gpio.create(pin_in1, { mode: OUTPUT })
  const in2 = gpio.create(pin_in2, { mode: OUTPUT })
  const ena = gpio.create(pin_ena, { mode: PWM })
  
  function setMode(motor: Motor, mode: MotorMode): void {
    in1.digitalWrite(mode === MotorMode.FORWARD || mode === MotorMode.FLOAT ? 1 : 0)
    in2.digitalWrite(mode === MotorMode.BACKWARDS || mode === MotorMode.FLOAT ? 1 : 0)
    motor.mode = mode
  }

  function log(): void {
    logger.debug(`Motor,${motor.no},${''.padStart((motor.no - 1)* 15)},${motor.mode},${motor.speed.toFixed(0)}`)
  }

  async function sendSpeed(motor: Motor, speed: number): Promise<void> {
    if (speed < 0 && motor.mode !== MotorMode.BACKWARDS) {
      setMode(motor, MotorMode.BACKWARDS)
    } else if (speed > 0 && motor.mode !== MotorMode.FORWARD) {
      setMode(motor, MotorMode.FORWARD)
    } else if (speed === 0 && motor.mode !== MotorMode.FLOAT) {
      setMode(motor, MotorMode.FLOAT)
    }

    if (!destructed) {
      encoder.simulateSpeed(speed)
    }

    const pwmValue = Math.max(0, Math.min(255, Math.round(Math.abs(speed * 2.55))))
    const time = Math.abs(speed - motor.speed) / MAX_ACCELERATION * 100
    motor.speed = speed
    ena.pwmWrite(pwmValue)
    log()
    await wait(time)
  }

  function halt(motor: Motor, mode: MotorMode): void {
    encoder.simulateSpeed(0)
    ena.pwmWrite(0)
    setMode(motor, mode)
    log()
    motor.speed = 0
  }

  const motor = {
    no: motorNo++, 
    speed: 0,
    mode: MotorMode.FLOAT,

    // @todo Return a CancellableAsync instead
    async accelerate(speed: number): Promise<void> {
      speed = Math.min(Math.abs(speed), 100) * Math.sign(speed)
      // console.debug(`Motor #${this.no}:${indent(motor.no)}accelerate(from=${this.speed}% to ${speed}%)`)
      while (speed !== this.speed) {
        const diff = Math.min(MAX_ACCELERATION, Math.abs(speed - this.speed))
        const newSpeed = this.speed + Math.sign(speed - this.speed) * diff
        await sendSpeed(this, newSpeed)
      }
    },

    go(distance: number, speed: number): CancellableAsync {
      // console.debug(`Motor #${this.no}: go(distance=${distance}, speed=${speed}), trigger=${encoder.currentPosition + distance * Math.sign(speed)}`)
      const trigger = motor.positionReached(encoder.currentPosition + distance * Math.sign(speed))
      this.accelerate(speed)
      return trigger
    },
    
    // @todo Create an actual trigger
    stop(): CancellableAsync {
      halt(this, MotorMode.BREAK)
      return resolvedCancellableAsync
    },
    
    // @todo Create an actual trigger
    float(): CancellableAsync {
      halt(this, MotorMode.FLOAT)
      return resolvedCancellableAsync
    },

    getPosition(): number {
      return encoder.currentPosition
    },

    getSpeed(): number {
      return encoder.currentSpeed
    },

    /*
      Installs a listener Returns a CancellableAsync with a promise for a position to be reached.
    */
    positionReached(desiredPosition: number): CancellableAsync {
      // logger.debug(`Motor #${motor.no}: setting trigger to position=${desiredPosition}`)
      const direction = Math.sign(desiredPosition - encoder.currentPosition)
      return encoder.listeners.add((pos: number) => {
        return direction > 0 && pos >= desiredPosition || direction < 0 && pos <= desiredPosition
      })
    },

    speedReached(desiredSpeed: number): CancellableAsync {
      // logger.debug(`Motor #${motor.no}: setting trigger to speed=${desiredSpeed}`)
      const direction = Math.sign(desiredSpeed - (encoder.currentSpeed || 0))
      return encoder.listeners.add((pos: number, speed: number) => {
        return direction > 0 && speed >= desiredSpeed || direction < 0 && speed <= desiredSpeed
      })
    },

    destruct(): void {
      encoder.simulateSpeed(0)
      destructed = true
    }
  }
  
  return motor
}