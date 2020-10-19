import fetch from 'node-fetch'
import { Readable, Stream } from 'stream'
import { Orientation } from './robot/Orientation'
import { Position } from './robot/Position'

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

  setCarPosition(pos: Position, orientation: Orientation): void {
    const headers = { 'content-type': 'application/json' }
    const coords = pos.metricCoordinates()
    const angle = orientation.degreeAngle().toFixed(2)
    // console.debug(`Current position: ${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}, ${angle}°`)
    fetch(`${simulatorUrl}/car/position`, { method: 'POST', headers, body: JSON.stringify({ posX: coords.x, posY: coords.y, orientation: angle }) })
  }
}

class GpioNotifierSimulator {
  PI_NTFY_FLAGS_ALIVE = 1 << 6
  dataStream: Readable
  simulated: boolean

  constructor() {
    this.dataStream = new Stream.Readable({
      read() {},
      objectMode: true,
    })
    this.simulated = true
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
