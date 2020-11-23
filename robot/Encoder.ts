import { GPIO, INPUT, PI_NTFY_FLAGS_ALIVE } from './gpio'
import createListenerList, { ListenerList } from './ListenerList'

export const TICKS_PER_REV = 544
const SAMPLE_DURATION_MS = 3

export type Encoder = {
  no: number,
  simulated: boolean,
  currentPosition: number,
  currentSpeed: number,
  listeners: ListenerList,
  tick(diff: number, time: number): void,
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
export default function (gpio: GPIO, pin_a: number, pin_b: number, logger = { debug: console.debug }): Encoder {
  let oldVal = 0
  let lastTick = undefined as number
  const notifier = gpio.createNotifier([pin_a, pin_b])
  let timer = undefined as NodeJS.Timer

  const encoder = {
    no: encoderNo++,
    simulated: notifier.simulated,
    currentPosition: 0,
    listeners: createListenerList(),

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
        logger.debug(`Encoder,${encoder.no},${encoder.currentPosition},${encoder.currentSpeed},${time - lastTick}`)
      }
      lastTick = time
      encoder.listeners.call(encoder.currentPosition, encoder.currentSpeed)
    },

    simulateSpeed(speed: number): void {
      if (encoder.simulated) {
        timer && clearInterval(timer)
        timer = undefined
        if (speed) {
          const diff = Math.round(speed * SAMPLE_DURATION_MS / 36.7)
          timer = setInterval(() => encoder.tick(diff, (lastTick || 0) + SAMPLE_DURATION_MS), SAMPLE_DURATION_MS)
        }
      }
    },
  }

  function handleChunk(chunk: Buffer) {
    if (!(chunk.readUInt16LE(2) & PI_NTFY_FLAGS_ALIVE)) {
      const level = chunk.readUInt32LE(8)
      const newVal = ((level >>> pin_a) & 1) << 1 | ((level >>> pin_b) & 1)
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
