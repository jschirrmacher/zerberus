const Gpio = require('../gpio')

type Motor = {
  in1: typeof Gpio,
  in2: typeof Gpio,
  ena: typeof Gpio,
  speed: number,
  forward: boolean,
  break: boolean,
  accelerate: (speed: number) => void,
  stop: () => void,
  float: () => void,
}

export default function (in1: number, in2: number, ena: number): Motor {
  return {    
    in1: new Gpio(in1, { mode: Gpio.OUTPUT }),
    in2: new Gpio(in2, { mode: Gpio.OUTPUT }),
    ena: new Gpio(ena, { mode: Gpio.PWM }),
    speed: 0,
    forward: false,
    break: false,

    accelerate(speed = 100) {
      function sendSpeed(motor: Motor, speed: number) {
        motor.speed = speed
        if (motor.speed < 0 && motor.forward) {
          motor.in1.write(1)
          motor.in2.write(0)
          motor.forward = false
        } else if (motor.speed > 0 && !motor.forward) {
          motor.in1.write(0)
          motor.in2.write(1)
          motor.forward = true
        }
        motor.ena.pwmWrite(speed)
      }

      this.break = false
      if (speed !== this.speed) {
        const diff = Math.min(5, Math.abs(speed - this.speed))
        sendSpeed(this, this.speed + Math.sign(speed - this.speed) * diff)
        setTimeout(() => this.accelerate.bind(this)(speed), 100)
      }
    },
    
    stop() {
      this.in1.write(0)
      this.in2.write(0)
      this.break = true
    },

    float() {
      this.in1.write(1)
      this.in2.write(1)
      this.break = false
    }
  }
}