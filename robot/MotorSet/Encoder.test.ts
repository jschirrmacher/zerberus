import "should"
import EncoderFactory, { Encoder, TICKS_PER_REV } from "./Encoder"
import GPIOFactory, { GPIO, INPUT, PI_NTFY_FLAGS_ALIVE } from "../Hardware/gpio"
import Logger from "../lib/Logger"

describe("Encoder", () => {
  let gpio: GPIO
  let encoder: Encoder
  let timer: number | undefined

  beforeEach(() => {
    gpio = GPIOFactory(true)
    encoder = EncoderFactory(gpio, 1, 2)
  })

  afterEach(() => {
    timer && clearInterval(timer)
    timer = undefined
    encoder.simulateSpeed(0)
  })

  it("should initialize the GPIO", () => {
    encoder = EncoderFactory(gpio, 1, 2)
    gpio.initializedPins.should.deepEqual({ 1: { mode: INPUT }, 2: { mode: INPUT } })
  })

  it("should have an id", () => {
    const encoder2 = EncoderFactory(gpio, 3, 4)
    encoder2.no.should.not.equal(encoder.no)
    encoder2.simulateSpeed(0)
  })

  it("should contain the current position", () => {
    encoder.position.value.should.equal(0)
    encoder.tick(1, 1)
    encoder.position.value.should.equal(1)
  })

  it("should contain the current speed", () => {
    encoder.tick(1, 1)
    encoder.tick(1, 2)
    encoder.speed.value.should.equal(1000000 / TICKS_PER_REV)
    encoder.tick(4, 4)
    encoder.speed.value.should.equal(2000000 / TICKS_PER_REV)
  })

  it("should log in csv format if env ist set", () => {
    const logger = Logger()
    process.env.LOG = "encoder"
    encoder = EncoderFactory(gpio, 1, 2, logger)
    encoder.tick(1, 1)
    encoder.tick(1, 2)
    logger.get().length.should.equal(2)
    const entry = logger.get()[1].split(",")
    entry.length.should.equal(5)
    entry.should.containDeep(["Encoder", "2", "1838.235294117647", "1"])
    delete process.env.LOG_ENCODER
  })

  function createBuffer(info: { flags: number; time: number; level: number }[]) {
    const data = Buffer.alloc(12 * info.length)
    info.forEach((entry, index) => {
      data.writeInt16LE(entry.flags, index * 12 + 2)
      data.writeInt32LE(entry.time, index * 12 + 4)
      data.writeInt32LE(entry.level, index * 12 + 8)
    })
    return data
  }

  it("should read from stream", () => {
    encoder.handleChunk(createBuffer([{ flags: 0, level: 2, time: 10000 }]))
    encoder.position.value.should.equal(1)
  })

  it("should handle buffers containing multiple entries", (done) => {
    encoder.handleChunk(
      createBuffer([
        { flags: 0, level: 2, time: 10000 },
        { flags: 0, level: 6, time: 20000 },
      ])
    )
    setImmediate(() => {
      encoder.position.value.should.equal(2)
      done()
    })
  })

  it("should ignore keepalive ticks", (done) => {
    encoder.handleChunk(
      createBuffer([
        { flags: 0, level: 2, time: 10000 },
        { flags: PI_NTFY_FLAGS_ALIVE, level: 6, time: 20000 },
      ])
    )
    setImmediate(() => {
      encoder.position.value.should.equal(1)
      done()
    })
  })

  it("should allow to simulate motion", (done) => {
    encoder.simulateSpeed(100)
    setTimeout(() => {
      encoder.position.value.should.be.greaterThan(0)
      done()
    }, 100)
  })
})
