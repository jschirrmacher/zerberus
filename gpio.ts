const NODE_ENV = process.env.NODE_ENV || 'development'

class GpioSimulator {
  constructor(gpio: number, options: Record<string, unknown> = {}) {

  }

  static INPUT = 1
  static OUTPUT = 2
  static ALT0 = 3
  static ALT1 = 4
  static ALT2 = 5
  static ALT3 = 6
  static ALT4 = 7
  static ALT5 = 8

  servoWrite(pulseWidth: number): GpioSimulator {
    return this
  }
}

if (NODE_ENV === 'production') {
  module.exports = require('pigpio').Gpio
} else {
  module.exports = GpioSimulator
}
