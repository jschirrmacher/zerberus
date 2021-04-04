import { GPIO, INPUT, PI_NTFY_FLAGS_ALIVE } from "./gpio"
import ObservableValueFactory, { ObservableValue } from "./ObservableValue"
import SubjectFactory, { Subject } from "./Subject"

export const TICKS_PER_REV = 544
const SAMPLE_DURATION_MS = 3

export interface Encoder {
  no: number
  simulated: boolean
  position: ObservableValue<number>
  speed: ObservableValue<number>
  tick(diff: number, time: number): void
  simulateSpeed(speed: number): void
}

let encoderNo = 1

const QEM = [
  [0, -1, 1, NaN],
  [1, 0, NaN, -1],
  [-1, NaN, 0, 1],
  [NaN, 1, -1, 0],
]

const debug = process.env.DEBUG && process.env.DEBUG.split(",").includes("encoder") ? console.debug : () => undefined

/*
  This class implements a quadrature encoder with two outputs, with a 90° phase shift.
  Specify the GPIO pins where the outputs are connecte too.
*/
export default function (gpio: GPIO, pin_a: number, pin_b: number, logger = { debug }): Encoder {
  let oldVal = 0
  let lastTick = undefined as number
  let lastMeasuredSpeed = undefined as number
  let lastTickTime = undefined as number
  const notifier = gpio.createNotifier([pin_a, pin_b])
  let timer = undefined as NodeJS.Timer
  let zeroSent = false
  let zeroTimeOut: NodeJS.Timeout

  const encoder = {
    no: encoderNo++,
    simulated: notifier.simulated,
    position: ObservableValueFactory<number>("position", 0),
    speed: ObservableValueFactory<number>("speed", 0),

    /*
      Handle a single tick of the motor.
      `diff` should specify the direction, positive is forward, negative is backwards.
      `time` is specified in microseconds.
    */
    tick(diff: number, time: number): void {
      encoder.position.set(encoder.position.get() + diff)
      if (lastTick) {
        lastMeasuredSpeed = ((diff / (time - lastTick)) * 1000000) / TICKS_PER_REV
      }
      logger.debug(`Encoder,${encoder.no},${encoder.position.get()},${lastMeasuredSpeed},${time - lastTick}`)
      lastTickTime = +Date.now()
      lastTick = time
      encoder.speed.set(lastMeasuredSpeed)
      if (zeroTimeOut) {
        clearTimeout(zeroTimeOut)
      }
      zeroTimeOut = setTimeout(() => {
        encoder.speed.set(0)
      }, 50)
    },

    simulateSpeed(speed: number): void {
      if (encoder.simulated) {
        timer && clearInterval(timer)
        timer = undefined
        if (speed || !zeroSent) {
          zeroSent = !speed
          const diff = Math.round((speed * SAMPLE_DURATION_MS) / 36.7)
          timer = setInterval(() => encoder.tick(diff, (lastTick || 0) + SAMPLE_DURATION_MS), SAMPLE_DURATION_MS)
        }
      }
    },
  }

  function handleChunk(chunk: Buffer) {
    if (!(chunk.readUInt16LE(2) & PI_NTFY_FLAGS_ALIVE)) {
      const level = chunk.readUInt32LE(8)
      const newVal = (((level >>> pin_a) & 1) << 1) | ((level >>> pin_b) & 1)
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
  notifier.stream().on("data", handleChunk)

  return encoder
}
