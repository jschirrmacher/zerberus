import 'should'
import { Stream } from 'stream'
import EncoderFactory, { Encoder, TICKS_PER_REV } from "./Encoder"
import { GPIO, GPIONotifier, GPIOPin, INPUT, ListenerFunction, PI_NTFY_FLAGS_ALIVE } from './gpio'

const initializedPins = {}
const listeners = []
let currentValue = undefined
const readableData = []

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

describe('Encoder', () => {
  let encoder: Encoder
  let timer: number

  beforeEach(() => {
    encoder = EncoderFactory(gpio, 1, 2)
  })

  afterEach(() => {
    timer &&  clearInterval(timer)
    timer = undefined
    encoder.simulateSpeed(0)
  })

  it('should initialize the GPIO', () => {
    Object.keys(initializedPins).forEach(key => delete initializedPins[key])
    encoder = EncoderFactory(gpio, 1, 2)
    initializedPins.should.deepEqual({1: { mode: INPUT }, 2: { mode: INPUT }})
  })

  it('should have an id', () => {
    const encoder2 = EncoderFactory(gpio, 3, 4)
    encoder2.no.should.not.equal(encoder.no)
    encoder2.simulateSpeed(0)
  })

  it('should contain the current position', () => {
    encoder.currentPosition.should.equal(0)
    encoder.tick(1, 1)
    encoder.currentPosition.should.equal(1)
  })

  it('should contain the current speed', () => {
    encoder.tick(1, 1)
    encoder.tick(1, 2)
    encoder.currentSpeed.should.equal(1000000 / TICKS_PER_REV)
    encoder.tick(4, 4)
    encoder.currentSpeed.should.equal(2000000 / TICKS_PER_REV)
  })

  it('should allow to wait for a position to be reached', async () => {
    const trigger = encoder.position(10)
    timer = setInterval(() => encoder.tick(1, 1))
    await trigger.promise
    encoder.currentPosition.should.equal(10)
  })

  it('should allow to be notified when a speed is reached', async () => {
    const trigger = encoder.speed(50)
    let time = 1
    timer = setInterval(() => encoder.tick(time / 100, time += 200))
    await trigger.promise
    encoder.currentSpeed.should.greaterThanOrEqual(50)
  })

  it('should return triggers that can be cancelled', async () => {
    const trigger = encoder.position(10)
    encoder.tick(1, 1)
    trigger.cancel()
    await trigger.promise
    encoder.currentPosition.should.equal(1)
  })

  it('should log in csv format if env ist set', () => {
    const console = {
      messages: [],
      debug: (msg: string) => console.messages.push(msg)
    }
    process.env.LOG_ENCODER = 'true'
    encoder = EncoderFactory(gpio, 1, 2, console)
    encoder.tick(1, 1)
    encoder.tick(1, 2)
    console.messages.length.should.equal(2)
    const entry = console.messages[1].split(',')
    entry.length.should.equal(5)
    entry.should.containDeep(['Encoder', '2', '1838.235294117647', '1'])
    delete process.env.LOG_ENCODER
  })

  function testStream(info: {flags: number, time: number, level: number}[]): Promise<void> {
    const data = Buffer.alloc(12 * info.length)
    info.forEach((entry, index) => {
      data.writeInt16LE(entry.flags, index * 12 + 2)
      data.writeInt32LE(entry.time, index * 12 + 4)
      data.writeInt32LE(entry.level, index * 12 + 8)
    })
    readableData.push(data)
    return new Promise(resolve => setImmediate(resolve))
  }

  it('should read from stream', async () => {
    await testStream([
      {flags: 0, level: 2, time: 10000}
    ])
    encoder.currentPosition.should.equal(1)
  })

  it('should handle buffers containing multiple entries', async () => {
    await testStream([
      {flags: 0, level: 2, time: 10000},
      {flags: 0, level: 6, time: 20000}
    ])
    encoder.currentPosition.should.equal(2)
  })

  it('should ignore keepalive ticks', async () => {
    await testStream([
      {flags: 0, level: 2, time: 10000},
      {flags: PI_NTFY_FLAGS_ALIVE, level: 6, time: 20000}
    ])
    encoder.currentPosition.should.equal(1)
  })

  it('should allow to simulate motion', done => {
    encoder.simulateSpeed(100)
    setTimeout(() => {
      encoder.currentPosition.should.be.greaterThan(0)
      done()
    }, 100)
  })
})
