import wait from "./wait"

const Gpio = require('../gpio')

export type Motor = {
  no: number,
  in1: typeof Gpio,
  in2: typeof Gpio,
  ena: typeof Gpio,
  speed: number,
  mode: MotorMode,
  accelerate: (speed: number) => Promise<void>,
  stop: () => void,
  float: () => void,
}

enum MotorMode {
  BREAK = 'break',
  FLOAT = 'float',
  FORWARD = 'forward',
  BACKWARDS = 'backwards'
}

let motorNo = 1

export default function (in1: number, in2: number, ena: number): Motor {
  function setMode(motor: Motor, mode: MotorMode): void {
    motor.in1.digitalWrite(mode === MotorMode.FORWARD || mode === MotorMode.FLOAT ? 1 : 0)
    motor.in2.digitalWrite(mode === MotorMode.BACKWARDS || mode === MotorMode.FLOAT ? 1 : 0)
    motor.mode = mode
  }

  function sendSpeed(motor: Motor, speed: number):void {
    motor.speed = speed
    if (motor.speed < 0 && motor.mode !== MotorMode.BACKWARDS) {
      setMode(motor, MotorMode.BACKWARDS)
    } else if (motor.speed > 0 && motor.mode !== MotorMode.FORWARD) {
      setMode(motor, MotorMode.FORWARD)
    } else if (motor.speed === 0 && motor.mode !== MotorMode.FLOAT) {
      setMode(motor, MotorMode.FLOAT)
    }
    const pwmValue = Math.round(Math.abs(speed * 2.55))
    motor.ena.pwmWrite(pwmValue)
  }

  return {
    no: motorNo++, 
    in1: new Gpio(in1, { mode: Gpio.OUTPUT }),
    in2: new Gpio(in2, { mode: Gpio.OUTPUT }),
    ena: new Gpio(ena, { mode: Gpio.PWM }),
    speed: 0,
    mode: MotorMode.FLOAT,

    async accelerate(speed: number): Promise<void> {
      while (speed !== this.speed) {
        const diff = Math.min(40, Math.abs(speed - this.speed))
        const newSpeed = this.speed + Math.sign(speed - this.speed) * diff
        console.debug(`accelerate #${this.no} from ${this.speed} to ${newSpeed} to eventually achieve ${speed}`)
        sendSpeed(this, newSpeed)
        await wait(100)
      }
    },
    
    stop(): void {
      console.debug(`break motor #${this.no}`)
      this.ena.pwmWrite(0)
      setMode(this, MotorMode.BREAK)
      this.speed = 0
    },

    float(): void {
      console.debug(`float motor #${this.no}`)
      this.ena.pwmWrite(0)
      setMode(this, MotorMode.FLOAT)
      this.speed = 0
    }
  }
}