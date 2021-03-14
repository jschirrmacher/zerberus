import 'should'
import EncoderFactory, { Encoder, TICKS_PER_REV } from "./Encoder"
import GPIOFactory, { GPIO, INPUT, PI_NTFY_FLAGS_ALIVE, pushStreamData } from './gpio'

describe('Encoder', () => {
  let gpio: GPIO
  let encoder: Encoder
  let timer: number

  beforeEach(() => {
    gpio = GPIOFactory(true)
    encoder = EncoderFactory(gpio, 1, 2)
  })

  afterEach(() => {
    timer &&  clearInterval(timer)
    timer = undefined
    encoder.simulateSpeed(0)
  })

  it('should initialize the GPIO', () => {
    encoder = EncoderFactory(gpio, 1, 2)
    gpio.initializedPins.should.deepEqual({1: { mode: INPUT }, 2: { mode: INPUT }})
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

  it('should log in csv format if env ist set', () => {
    const console = {
      messages: [],
      debug: (msg: string) => console.messages.push(msg)
    }
    process.env.LOG = 'encoder'
    encoder = EncoderFactory(gpio, 1, 2, console)
    encoder.tick(1, 1)
    encoder.tick(1, 2)
    console.messages.length.should.equal(2)
    const entry = console.messages[1].split(',')
    entry.length.should.equal(5)
    entry.should.containDeep(['Encoder', '2', '1838.235294117647', '1'])
    delete process.env.LOG_ENCODER
  })

  it('should read from stream', (done) => {
    pushStreamData([{ flags: 0, level: 2, time: 10000 }])
    setImmediate(() => {
      encoder.currentPosition.should.equal(1)
      done()
    })
  })

  it('should handle buffers containing multiple entries', (done) => {
    pushStreamData([
      {flags: 0, level: 2, time: 10000},
      {flags: 0, level: 6, time: 20000}
    ])
    setImmediate(() => {
      encoder.currentPosition.should.equal(2)
      done()
    })
  })

  it('should ignore keepalive ticks', (done) => {
    pushStreamData([
      {flags: 0, level: 2, time: 10000},
      {flags: PI_NTFY_FLAGS_ALIVE, level: 6, time: 20000}
    ])
    setImmediate(() => {
      encoder.currentPosition.should.equal(1)
      done()
    })
  })

  it('should allow to simulate motion', done => {
    encoder.simulateSpeed(100)
    setTimeout(() => {
      encoder.currentPosition.should.be.greaterThan(0)
      done()
    }, 100)
  })
})
