import fetch from 'node-fetch'
import { Readable, Stream } from 'stream'
import crypto from 'crypto'

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

  digitalWrite(value: number) {
    fetch(simulatorUrl + '/' + this.gpioPin + '/' + value, { method: 'POST' })
    return this
  }

  pwmWrite(dutyCycle: number): GpioSimulator {
    fetch(simulatorUrl + '/pwm/' + this.gpioPin + '/' + dutyCycle, { method: 'POST' })
    return this
  }

  servoWrite(pulseWidth: number): GpioSimulator {
    return this
  }
}

class GpioNotifierSimulator {
  PI_NTFY_FLAGS_ALIVE = 1 << 6
  dataStream: Readable

  constructor() {
    this.dataStream = new Stream.Readable({
      read() {},
      objectMode: true,
    })

    setInterval(() => {
      this.dataStream.push({
        flags: 0,
        level: crypto.randomBytes(4).readUInt32BE()
      })
    }, 10)
  }

  stream() {
    return this.dataStream
  }
}

if (NODE_ENV === 'production') {
  module.exports = require('pigpio').Gpio
} else {
  module.exports = GpioSimulator
  module.exports.Notifier = GpioNotifierSimulator
}
