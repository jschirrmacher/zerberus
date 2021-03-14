import { Stream } from 'stream'

export type GPIOPin = {
  currentValue: number
  digitalWrite(value: number): void
  pwmWrite(dutyCycle: number): void
}

export type GPIONotifier = {
  simulated: boolean
  bits: number
  stream(): Stream
}

type ListenerId = number
export type ListenerFunction = (event: string | symbol, ...args: unknown[]) => void
type Options  = Record<string, unknown>

export type GPIO = {
  create(pin: number, options?: Options): GPIOPin,
  createNotifier(pins: number[]): GPIONotifier,
  addListener(listener: ListenerFunction): ListenerId,
  removeListener(listenerId: ListenerId): void,
  initializedPins: Record<number, Options>,
}

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

class FakeGPIO {
  digitalWrite() {
    //
  }

  pwmWrite() {
    //
  }
}

class FakeNotifer {
  simulated = true
  bits: number
  
  constructor({ bits }: { bits: number }) {
    this.bits = bits
  }

  stream() {
    function getNext() {
      return readableData.shift()
    }

    return new Stream.Readable({
      read() {
        const value = getNext()
        value && this.push(value)
      },
      objectMode: true,
    })
  }
}

export const INPUT = 'IN'
export const OUTPUT = 'OUT'
export const PWM = 'PWM'
export const PI_NTFY_FLAGS_ALIVE = 1 << 6

const gpioPins = {
  SDA: 3,
  2: 3,
  SCL: 5,
  3: 5,
  GPCLK0: 7,
  4: 7,
  TXD: 8,
  14: 8,
  RXD: 10,
  15: 10,
  17: 11,
  18: 12,
  27: 13,
  22: 15,
  23: 16,
  24: 18,
  MOSI: 19,
  10: 19,
  MISO: 21,
  9: 21,
  25: 22,
  SCLK: 23,
  11: 23,
  CE0: 24,
  8: 24,
  CE1: 26,
  7: 26,
  ID_SD: 27,
  ID_SC: 28,
  5: 29,
  6: 31,
  12: 32,
  13: 33,
  19: 35,
  16: 36,
  26: 37,
  20: 38,
  21: 40
}

export default function (useFake = false): GPIO {
  const pigpio = !useFake ? require('pigpio') : {
    Gpio: FakeGPIO,
    Notifier: FakeNotifer,
  }
  let listenerId = 0
  const listeners = {} as Record<number, (...args: unknown[]) => void>

  function notifyListeners(event: string | symbol, ...args: unknown[]): void {
    Object.values(listeners).forEach(emit => emit(event, ...args))
  }

  return {
    initializedPins: {},

    create(pin: number, options = {} as Record<string, unknown>): GPIOPin {
      const pigpioObj = new pigpio.Gpio(pin, options)
      const actualPin = gpioPins[pin]
      
      this.initializedPins[pin] = options
      if (options.mode) {
        notifyListeners('gpio-mode', { pin: actualPin, mode: options.mode })
      }

      return {
        currentValue: 0,

        digitalWrite(value: number): void {
          pigpioObj.digitalWrite(value)
          this.currentValue = value
          notifyListeners('gpio-write', { pin: actualPin, value })
        },

        pwmWrite(dutyCycle: number): void {
          const value = Math.min(255, Math.max(0, dutyCycle))
          pigpioObj.pwmWrite(value)
          this.currentValue = value
          notifyListeners('gpio-pwm', { pin: actualPin, value })
        },
      }
    },

    createNotifier(pins: number[]): GPIONotifier {
      const bits = pins.map(pin => 1 << pin).reduce((bits, bit) => bits | bit)
      return new pigpio.Notifier({ bits })
    },

    addListener(listener: ListenerFunction): ListenerId {
      listeners[++listenerId] = listener
      return listenerId
    },

    removeListener(listenerId: ListenerId): void {
      delete listeners[listenerId]
    },
  }
}
