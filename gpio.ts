import fetch from 'node-fetch'

const NODE_ENV = process.env.NODE_ENV || 'development'
const simulatorUrl = 'http://localhost:10000/gpio'

class GpioSimulator {
  gpioPin: number

  constructor(gpio: number, options: Record<string, unknown> = {}) {
    this.gpioPin = gpio
    if (options.mode) {
      fetch(simulatorUrl + '/mode/' + gpio + '/' + options.mode, { method: 'POST' })
    }
  }

  static INPUT = 'IN'
  static OUTPUT = 'OUT'
  static PWM = 'PWM'

  pwmWrite(dutyCycle: number): GpioSimulator {
    fetch(simulatorUrl + '/pwm/' + this.gpioPin + '/' + dutyCycle, { method: 'POST' })
    return this
  }

  servoWrite(pulseWidth: number): GpioSimulator {
    return this
  }
}

if (NODE_ENV === 'production') {
  module.exports = require('pigpio').Gpio
} else {
  module.exports = GpioSimulator
}
