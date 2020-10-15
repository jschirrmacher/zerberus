import { Encoder, Trigger } from "./Encoder"
import wait from "./wait"

const Gpio = require('../gpio')

const MAX_ACCELERATION = 40
const SAMPLE_DURATION_MS = 10

export type Motor = {
  no: number,
  speed: number,
  mode: MotorMode,
  accelerate: (speed: number) => Promise<void>,
  go(distance: number, speed: number): Promise<void>,
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
  let simTime = 0

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

    if (encoder.simulated) {
      encoderTimer && clearInterval(encoderTimer)
      if (speed !== 0) {
        const ticks = Math.round(SAMPLE_DURATION_MS * 50000 / Math.abs(speed))
        encoderTimer = setInterval(() => encoder.tick(speed < 0 ? -1 : 1, simTime += ticks), SAMPLE_DURATION_MS)
      }
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
    setMode(motor, mode)
    motor.speed = 0
  }

  const motor = {
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

    async go(distance: number, speed: number): Promise<void> {
      console.debug(`Motor #${this.no}: go(distance=${distance}, speed=${speed})`)
      const trigger = encoder.position(encoder.currentPosition + distance * Math.sign(speed))
      await this.accelerate(speed)
      await trigger.promise
    },
    
    stop(): void {
      halt(this, MotorMode.BREAK)
    },
    
    float(): void {
      halt(this, MotorMode.FLOAT)
    },

    getPosition(): number {
      return encoder.currentPosition
    },

    on(position: number): Promise<void> {
      return encoder.position(position).promise
    },

    destruct(): void {
      encoderTimer && clearInterval(encoderTimer)
    }
  }
  
  return motor
}