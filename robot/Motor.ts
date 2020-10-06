import { Encoder } from "./Encoder"
import wait from "./wait"

const Gpio = require('../gpio')

const MAX_ACCELERATION = 40

export type Motor = {
  no: number,
  speed: number,
  mode: MotorMode,
  accelerate: (speed: number) => Promise<void>,
  stop: () => void,
  float: () => void,
  getPosition: () => number,
  on(position: number): Promise<void>,
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
    const pwmValue = Math.round(Math.abs(speed * 2.55))
    ena.pwmWrite(pwmValue)
    await wait(Math.abs(speed - motor.speed) / MAX_ACCELERATION * 100)
    motor.speed = speed
  }

  return {
    no: motorNo++, 
    speed: 0,
    mode: MotorMode.FLOAT,

    async accelerate(speed: number): Promise<void> {
      while (speed !== this.speed) {
        const diff = Math.min(MAX_ACCELERATION, Math.abs(speed - this.speed))
        const newSpeed = this.speed + Math.sign(speed - this.speed) * diff
        console.debug(`accelerate #${this.no} from ${this.speed} to ${newSpeed} to eventually achieve ${speed}`)
        await sendSpeed(this, newSpeed)
      }
    },
    
    stop(): void {
      console.debug(`break motor #${this.no}`)
      ena.pwmWrite(0)
      setMode(this, MotorMode.BREAK)
      this.speed = 0
    },

    float(): void {
      console.debug(`float motor #${this.no}`)
      ena.pwmWrite(0)
      setMode(this, MotorMode.FLOAT)
      this.speed = 0
    },

    getPosition(): number {
      return encoder.get()
    },

    async on(position: number): Promise<void> {
      await encoder.on(position)
    }
  }
}