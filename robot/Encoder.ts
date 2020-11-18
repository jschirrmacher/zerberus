import { INPUT, PI_NTFY_FLAGS_ALIVE } from './gpio'
import ListenerList, { Trigger } from './ListenerList'

const Gpio = require('./gpio')

export const TICKS_PER_REV = 544

export type Encoder = {
  no: number,
  simulated: boolean,
  currentPosition: number,
  currentSpeed: number,
  tick(diff: number, time: number): void,
  position(desiredPosition: number): Trigger,
  speed(desiredSpeed: number): Trigger,
  simulateSpeed(speed: number): void,
}

let encoderNo = 1

const QEM = [
  [0, -1, 1, NaN],
  [1, 0, NaN, -1],
  [-1, NaN, 0, 1],
  [NaN, 1, -1, 0],
]

/*
  This class implements a quadrature encoder with two outputs, with a 90° phase shift.
  Specify the GPIO pins where the outputs are connecte too.
*/
export default function (gpio, pin_a: number, pin_b: number): Encoder {
  let oldVal = 0
  let lastTick = undefined as number
  const notifier = gpio.createNotifier([pin_a, pin_b])
  let listeners = ListenerList()

  const SAMPLE_DURATION_MS = 3

  const encoder = {
    no: encoderNo++,
    simulated: notifier.simulated,
    currentPosition: 0,
    timer: undefined as NodeJS.Timer,

    /*
      The current speed of the motor is measured in revolutions per second
    */
    currentSpeed: undefined as number,

    /*
      Handle a single tick of the motor.
      `diff` should specify the direction, +1 is forward, -1 is backwards.
      `time` is specified in microseconds.
    */
    tick(diff: number, time: number): void {
      encoder.currentPosition += diff
      if (lastTick) {
        encoder.currentSpeed = diff / (time - lastTick) * 1000000 / TICKS_PER_REV
      }
      if (process.env.LOG_ENCODER) {
        console.debug(`Encoder,${encoder.no},${encoder.currentPosition},${encoder.currentSpeed},${time - lastTick}`)
      }
      lastTick = time
      listeners.call(encoder.currentPosition, encoder.currentSpeed)
    },

    simulateSpeed(speed: number): void {
      if (encoder.simulated) {
        encoder.timer && clearInterval(encoder.timer)
        encoder.timer = undefined
        if (speed) {
          const diff = Math.round(speed * SAMPLE_DURATION_MS / 36.7)
          encoder.timer = setInterval(() => encoder.tick(diff, (lastTick || 0) + SAMPLE_DURATION_MS), SAMPLE_DURATION_MS)
        }
      }
    },

    /*
      Returns a trigger that waits for a position to be reached.
    */
    position(desiredPosition: number): Trigger {
      // console.debug(`Encoder #${encoder.no}: setting trigger to position=${desiredPosition}`)
      const direction = Math.sign(desiredPosition - encoder.currentPosition)
      return listeners.add((pos: number, speed: number) => direction > 0 && pos >= desiredPosition || direction < 0 && pos <= desiredPosition)
    },

    speed(desiredSpeed: number): Trigger {
      // console.debug(`Encoder #${encoder.no}: setting trigger to speed=${desiredSpeed}`)
      const direction = Math.sign(desiredSpeed - encoder.currentSpeed)
      return listeners.add((pos: number, speed: number) => direction > 0 && speed >= desiredSpeed || direction < 0 && speed <= desiredSpeed)
    }
  }

  function handleChunk(chunk: Buffer) {
    if (!(chunk.readUInt16LE(2) & PI_NTFY_FLAGS_ALIVE)) {
      const level = chunk.readUInt32LE(8)
      const newVal = ((level >>> pin_a) & 1) << 1 | ((level >>> pin_b) & 1)
      const diff = QEM[oldVal][newVal]
      if (!Number.isNaN(diff) && diff !== 0) {
        encoder.tick(diff, chunk.readUInt32LE(4))
      }
      oldVal = newVal
    }

    chunk.length > 12 && handleChunk(chunk.slice(12))
  }

  gpio.create(pin_a, { mode: INPUT })
  gpio.create(pin_b, { mode: INPUT })
  notifier.stream().on('data', handleChunk)

  return encoder
}
