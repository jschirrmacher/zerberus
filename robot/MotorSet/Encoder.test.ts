import { expect } from "expect"
import EncoderFactory, { type Encoder, TICKS_PER_REV } from "./Encoder"
import GPIOFactory, { type GPIO, INPUT, PI_NTFY_FLAGS_ALIVE } from "../Hardware/gpio"
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
    expect(gpio.initializedPins).toEqual({ 1: { mode: INPUT }, 2: { mode: INPUT } })
  })

  it("should have an id", () => {
    const encoder2 = EncoderFactory(gpio, 3, 4)
    expect(encoder2.no).not.toEqual(encoder.no)
    encoder2.simulateSpeed(0)
  })

  it("should contain the current position", () => {
    expect(encoder.position.value).toEqual(0)
    encoder.tick(1, 1)
    expect(encoder.position.value).toEqual(1)
  })

  it("should contain the current speed", () => {
    encoder.tick(1, 1)
    encoder.tick(1, 2)
    expect(encoder.speed.value).toEqual(1000000 / TICKS_PER_REV)
    encoder.tick(4, 4)
    expect(encoder.speed.value).toEqual(2000000 / TICKS_PER_REV)
  })

  it("should log in csv format if env ist set", () => {
    const logger = Logger()
    process.env.LOG = "encoder"
    encoder = EncoderFactory(gpio, 1, 2, logger)
    encoder.tick(1, 1)
    encoder.tick(1, 2)
    expect(logger.get().length).toEqual(2)
    const entry = logger.get()[1]
    expect(entry.split(",").length).toBe(5)
    expect(entry).toMatch(/^Encoder,\d+,2,1838.235294117647,1$/)
    delete process.env.LOG
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
    expect(encoder.position.value).toEqual(1)
  })

  it("should handle buffers containing multiple entries", (done) => {
    encoder.handleChunk(
      createBuffer([
        { flags: 0, level: 2, time: 10000 },
        { flags: 0, level: 6, time: 20000 },
      ])
    )
    setImmediate(() => {
      expect(encoder.position.value).toEqual(2)
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
      expect(encoder.position.value).toEqual(1)
      done()
    })
  })

  it("should allow to simulate motion", (done) => {
    encoder.simulateSpeed(100)
    setTimeout(() => {
      expect(encoder.position.value).toBeGreaterThan(0)
      done()
    }, 100)
  })
})
