import { type GPIO, INPUT, PI_NTFY_FLAGS_ALIVE } from "../Hardware/gpio"
import createObservable, { type ObservableValue } from "../lib/ObservableValue"
import { ModuleLogger } from "../lib/Logger"

export const TICKS_PER_REV = 544
const SAMPLE_DURATION_MS = 3

export interface Encoder {
  no: number
  simulated: boolean
  position: ObservableValue<number>
  speed: ObservableValue<number>
  tick(diff: number, time: number): void
  simulateSpeed(speed: number): void
  handleChunk(chunk: Buffer): void
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
export default function (gpio: GPIO, pin_a: number, pin_b: number, logger = ModuleLogger("encoder")): Encoder {
  let oldVal = 0
  let lastTick = undefined as number | undefined
  const notifier = gpio.createNotifier([pin_a, pin_b])
  let tickTimer = undefined as NodeJS.Timer | undefined
  let zeroSent = false
  let zeroTimeOut: NodeJS.Timeout

  const encoder = {
    no: encoderNo++,
    simulated: notifier.simulated,
    position: createObservable("position", 0),
    speed: createObservable("speed", 0),

    /*
      Handle a single tick of the motor.
      `diff` should specify the direction, positive is forward, negative is backwards.
      `time` is specified in microseconds.
    */
    tick(diff: number, time: number): void {
      encoder.position.value += diff
      const timeDiff = lastTick ? time - lastTick : 0
      encoder.speed.value = timeDiff ? ((diff / timeDiff) * 1000000) / TICKS_PER_REV : 0
      logger.debug(`Encoder,${encoder.no},${encoder.position.value},${encoder.speed.value},${timeDiff}`)
      lastTick = time
      zeroTimeOut && clearTimeout(zeroTimeOut)
      zeroTimeOut = setTimeout(() => (encoder.speed.value = 0), 50)
    },

    simulateSpeed(speed: number): void {
      if (encoder.simulated) {
        tickTimer && clearInterval(tickTimer)
        tickTimer = undefined
        if (speed || !zeroSent) {
          zeroSent = !speed
          const diff = Math.round((speed * SAMPLE_DURATION_MS) / 36.7)
          tickTimer = setInterval(() => encoder.tick(diff, (lastTick || 0) + SAMPLE_DURATION_MS), SAMPLE_DURATION_MS)
        }
      }
    },

    handleChunk(chunk: Buffer) {
      try {
        if (!(chunk.readUInt16LE(2) & PI_NTFY_FLAGS_ALIVE)) {
          const level = chunk.readUInt32LE(8)
          const newVal = (((level >>> pin_a) & 1) << 1) | ((level >>> pin_b) & 1)
          const diff = QEM[oldVal][newVal]
          if (!Number.isNaN(diff) && diff !== 0) {
            encoder.tick(diff, chunk.readUInt32LE(4))
          }
          oldVal = newVal
        }
      } catch (error) {
        logger.error(error)
        logger.error({ buffer: chunk.toString("hex").match(/../g)?.join(" ") })
      }

      chunk.length > 12 && encoder.handleChunk(chunk.slice(12))
    },
  } as Encoder

  gpio.create(pin_a, { mode: INPUT })
  gpio.create(pin_b, { mode: INPUT })
  notifier.stream().on("data", encoder.handleChunk)

  return encoder
}
