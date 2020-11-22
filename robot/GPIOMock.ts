import { Stream } from 'stream'
import { GPIO, GPIONotifier, GPIOPin, ListenerFunction } from "./gpio"

export const initializedPins = {}
export const listeners = []
export let currentValue = undefined

const readableData = []

export function pushStreamData(info: {flags: number, time: number, level: number}[]): void {
  const data = Buffer.alloc(12 * info.length)
  info.forEach((entry, index) => {
    data.writeInt16LE(entry.flags, index * 12 + 2)
    data.writeInt32LE(entry.time, index * 12 + 4)
    data.writeInt32LE(entry.level, index * 12 + 8)
  })
  readableData.push(data)
}

export const gpio: GPIO = {
  create(pin: number, options: { mode: string }): GPIOPin {
    initializedPins[pin] = options
    return {
      digitalWrite(value: number): void {
        currentValue = value
      },
      pwmWrite(dutyCycle: number): void {
        currentValue = dutyCycle
      }
    }
  },

  createNotifier(): GPIONotifier {
    return {
      simulated: true,

      stream() {
        return new Stream.Readable({
          read() {
            const value = readableData.shift()
            value && this.push(value)
          },
          objectMode: true,
        })
      }
    }
  },

  addListener(listener: ListenerFunction): number {
    listeners.push(listener)
    return listeners.length
  },

  removeListener(listenerId: number): void {
    delete listeners[listenerId - 1]
  },
}
