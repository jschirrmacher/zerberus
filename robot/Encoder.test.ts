import 'should'
import { Stream } from 'stream'
import Encoder, { TICKS_PER_REV } from "./Encoder"
import { GPIO, GPIONotifier, GPIOPin, INPUT, ListenerFunction, PI_NTFY_FLAGS_ALIVE } from './gpio'

const initializedPins = {}
const listeners = []
let currentValue = undefined

const gpio: GPIO = {
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
            // Do nothing
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
  }
}

describe('Encoder', () => {
  let timer: number

  afterEach(() => {
    timer &&  clearInterval(timer)
    timer = undefined
  })

  it('should initialize the GPIO', () => {
    Object.keys(initializedPins).forEach(key => delete initializedPins[key])
    Encoder(gpio, 1, 2)
    initializedPins.should.deepEqual({1: { mode: INPUT }, 2: { mode: INPUT }})
  })

  it('should have an id', () => {
    const encoder1 = Encoder(gpio, 1, 2)
    const encoder2 = Encoder(gpio, 3, 4)
    encoder1.no.should.not.equal(encoder2.no)
  })

  it('should contain the current position', () => {
    const encoder = Encoder(gpio, 1, 2)
    encoder.currentPosition.should.equal(0)
    encoder.tick(1, 1)
    encoder.currentPosition.should.equal(1)
  })

  it('should contain the current speed', () => {
    const encoder = Encoder(gpio, 1, 2)
    encoder.tick(1, 1)
    encoder.tick(1, 2)
    encoder.currentSpeed.should.equal(1000000 / TICKS_PER_REV)
    encoder.tick(4, 4)
    encoder.currentSpeed.should.equal(2000000 / TICKS_PER_REV)
  })

  it('should allow to wait for a position to be reached', async () => {
    const encoder = Encoder(gpio, 1, 2)
    const trigger = encoder.position(10)
    timer = setInterval(() => encoder.tick(1, 1))
    await trigger.promise
    encoder.currentPosition.should.equal(10)
  })

  it('should allow to be notified when a speed is reached', async () => {
    const encoder = Encoder(gpio, 1, 2)
    const trigger = encoder.speed(50)
    let time = 1
    timer = setInterval(() => encoder.tick(time / 100, time += 200))
    await trigger.promise
    encoder.currentSpeed.should.greaterThanOrEqual(50)
  })

  it('should return triggers that can be cancelled', async () => {
    const encoder = Encoder(gpio, 1, 2)
    const trigger = encoder.position(10)
    encoder.tick(1, 1)
    trigger.cancel()
    await trigger.promise
    encoder.currentPosition.should.equal(1)
  })
})
