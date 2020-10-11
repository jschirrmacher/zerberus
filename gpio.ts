import fetch from 'node-fetch'
import { Readable, Stream } from 'stream'

const NODE_ENV = process.env.NODE_ENV || 'development'
const simulatorUrl = 'http://localhost:10000/gpio'

class GpioSimulator {
  gpioPin: number
  simulated: true

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

  setCarPosition(posX: number, posY: number, orientation: number): void {
    const headers = { 'content-type': 'application/json' }
    fetch(`${simulatorUrl}/car/position`, { method: 'POST', headers, body: JSON.stringify({ posX, posY, orientation }) })
  }
}

class GpioNotifierSimulator {
  PI_NTFY_FLAGS_ALIVE = 1 << 6
  dataStream: Readable
  simulated: true

  constructor() {
    this.dataStream = new Stream.Readable({
      read() {},
      objectMode: true,
    })
  }

  stream() {
    return this.dataStream
  }
}

if (NODE_ENV === 'production') {
  const pigpio = require('pigpio')
  module.exports = pigpio.Gpio
  module.exports.Notifier = pigpio.Notifier
} else {
  module.exports = GpioSimulator
  module.exports.Notifier = GpioNotifierSimulator
}
