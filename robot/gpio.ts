import { Stream } from 'stream'

const NODE_ENV = process.env.NODE_ENV || 'development'
const pigpio = NODE_ENV === 'production' ? require('pigpio') : null

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

export type GPIOPin = {
  digitalWrite(value: number): void,
  pwmWrite(dutyCycle: number): void,
}

export type GPIONotifier = {
  simulated: boolean,
  stream(): Stream,
}

export type GPIO = {
  create(pin: number, options: Record<string, unknown>): GPIOPin,
  createNotifier(pins: number[]): GPIONotifier,
  addListener(emit: (event: string | symbol, ...args: unknown[]) => boolean): number,
  removeListener(listenerId): void,
}

export default function (): GPIO {
  let listenerId = 0
  const listeners = {} as Record<number, (...args: unknown[]) => void>

  function broadcast(...args) {
    Object.values(listeners).forEach(emit => emit(...args))
  }

  return {
    create(pin: number, options = {} as Record<string, unknown>): GPIOPin {
      const pigpioObj = pigpio && new pigpio.Gpio(pin, options)
      const actualPin = gpioPins[pin]

      if (options.mode) {
        broadcast('gpio-mode', { pin: actualPin, mode: options.mode })
      }

      return {
        digitalWrite(value: number): void {
          pigpioObj && pigpioObj.digitalWrite(value)
          broadcast('gpio-write', { pin: actualPin, value })
        },

        pwmWrite(dutyCycle: number): void {
          const value = Math.min(255, Math.max(0, dutyCycle))
          pigpioObj && pigpioObj.pwmWrite(value)
          broadcast('gpio-pwm', { pin: actualPin, value })
        },
      }
    },

    createNotifier(pins: number[]): GPIONotifier {
      const bits = pins.map(pin => 1 << pin).reduce((bits, bit) => bits | bit)
      const pigpioNotifier = pigpio && new pigpio.Notifier({ bits })
      const dataStream = !pigpio && new Stream.Readable({
        read() {
          // Do nothing
        },
        objectMode: true,
      })

      return {
        simulated: !pigpio,

        stream() {
          return dataStream || pigpioNotifier.stream()
        }
      }
    },

    addListener(emit: (event: string | symbol, ...args: unknown[]) => boolean): number {
      listeners[++listenerId] = emit
      return listenerId
    },

    removeListener(listenerId): void {
      delete listeners[listenerId]
    },
  }
}
