import { Encoder, Trigger } from "./Encoder"
import wait from "./wait"

const Gpio = require('../gpio')

const MAX_ACCELERATION = 40
const SAMPLE_FREQ = 10

export type Motor = {
  no: number,
  speed: number,
  mode: MotorMode,
  accelerate: (speed: number) => Promise<void>,
  go(speed: number, ticks: number): Promise<void>,
  stop: () => void,
  float: () => void,
  getPosition: () => number,
  on(position: number): Promise<void>,
  destruct(): void,
}

enum MotorMode {
  BREAK = 'break',
  FLOAT = 'float',
  FORWARD = 'forward',
  BACKWARDS = 'backwards'
}

let motorNo = 1

export default function (pin_in1: number, pin_in2: number, pin_ena: number, encoder = undefined as Encoder): Motor {
  const in1 = new Gpio(pin_in1, { mode: Gpio.OUTPUT })
  const in2 = new Gpio(pin_in2, { mode: Gpio.OUTPUT })
  const ena = new Gpio(pin_ena, { mode: Gpio.PWM })
  
  let encoderTimer: NodeJS.Timeout
  let encoderTrigger: Trigger

  function setMode(motor: Motor, mode: MotorMode): void {
    in1.digitalWrite(mode === MotorMode.FORWARD || mode === MotorMode.FLOAT ? 1 : 0)
    in2.digitalWrite(mode === MotorMode.BACKWARDS || mode === MotorMode.FLOAT ? 1 : 0)
    motor.mode = mode
  }

  async function sendSpeed(motor: Motor, speed: number): Promise<void> {
    if (speed < 0 && motor.mode !== MotorMode.BACKWARDS) {
      setMode(motor, MotorMode.BACKWARDS)
    } else if (speed > 0 && motor.mode !== MotorMode.FORWARD) {
      setMode(motor, MotorMode.FORWARD)
    } else if (speed === 0 && motor.mode !== MotorMode.FLOAT) {
      setMode(motor, MotorMode.FLOAT)
    }

    if (encoder.simulate) {
      const ticks = Math.round(speed / 100 * 544 * (1 / SAMPLE_FREQ))
      encoderTimer && clearInterval(encoderTimer)
      // console.debug(`Setting encoder frequency for motor #${motor.no} to ${ticks}`)
      encoderTimer = setInterval(() => encoder.simulate(ticks), 1000 / SAMPLE_FREQ)
    }

    const pwmValue = Math.round(Math.abs(speed * 2.55))
    const time = Math.abs(speed - motor.speed) / MAX_ACCELERATION * 100
    motor.speed = speed
    ena.pwmWrite(pwmValue)
    await wait(time)
  }

  function halt(motor: Motor, mode: MotorMode): void {
    console.debug(`${mode} motor #${motor.no}`)
    ena.pwmWrite(0)
    encoderTimer && clearInterval(encoderTimer)
    encoderTimer = undefined
    encoderTrigger && encoderTrigger.cancel()
    encoderTrigger = undefined
    setMode(motor, mode)
    motor.speed = 0
  }

  return {
    no: motorNo++, 
    speed: 0,
    mode: MotorMode.FLOAT,

    async accelerate(speed: number): Promise<void> {
      console.debug(`Motor #${this.no}: accelerate(from=${this.speed}% to ${speed}%)`)
      while (speed !== this.speed) {
        const diff = Math.min(MAX_ACCELERATION, Math.abs(speed - this.speed))
        const newSpeed = this.speed + Math.sign(speed - this.speed) * diff
        await sendSpeed(this, newSpeed)
      }
    },

    async go(speed: number, distance: number): Promise<void> {
      console.debug(`Motor #${this.no}: go(speed=${speed}, distance=${distance})`)
      encoderTrigger = encoder.on(distance * Math.sign(speed))
      await this.accelerate(speed)
      await encoderTrigger.promise
      encoderTrigger = undefined
      await this.float()
    },
    
    stop(): void {
      halt(this, MotorMode.BREAK)
    },
    
    float(): void {
      halt(this, MotorMode.FLOAT)
    },

    getPosition(): number {
      return encoder.get()
    },

    async on(position: number): Promise<void> {
      await encoder.on(position)
    },

    destruct(): void {
      encoderTimer && clearInterval(encoderTimer)
      encoderTrigger && encoderTrigger.cancel()
    }
  }
}