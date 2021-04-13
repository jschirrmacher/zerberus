import should from "should"
import GPIOFactory, { GPIO, INPUT, OUTPUT } from "../Hardware/gpio"

describe("GPIO", () => {
  const events = []
  let gpio: GPIO

  beforeEach(() => {
    events.length = 0
    gpio = GPIOFactory(true)
    gpio.addListener((event, args) => !!events.push({ event, args }))
  })

  describe("Pin", () => {
    it("can be called without options", () => {
      gpio.create(17)
    })

    it("should inform the listeners about the mode of a created pim", () => {
      gpio.create(17, { mode: INPUT })
      events.should.deepEqual([{ event: "gpio-mode", args: { pin: 11, mode: INPUT } }])
    })

    it("should remember the options of each pin set", () => {
      gpio.create(17, { mode: INPUT })
      gpio.initializedPins.should.deepEqual({ 17: { mode: INPUT } })
    })

    it("should notify registered listernes when digitalWrite() is called", () => {
      const pin = gpio.create(17, { mode: OUTPUT })
      pin.digitalWrite(42)
      events.should.containDeep([{ event: "gpio-write", args: { pin: 11, value: 42 } }])
    })

    it("should notify registered listernes when pwmWrite() is called", () => {
      const pin = gpio.create(17, { mode: OUTPUT })
      pin.pwmWrite(42)
      events.should.containDeep([{ event: "gpio-pwm", args: { pin: 11, value: 42 } }])
    })

    it("should not notify de-registered listeners", () => {
      const pin = gpio.create(17, { mode: OUTPUT })
      const id = gpio.addListener(() => should.fail("called", "not called", "Listener was called"))
      gpio.removeListener(id)
      pin.pwmWrite(42)
    })
  })

  describe("Notifier", () => {
    it("should create a simulated notifier", () => {
      const notifier = gpio.createNotifier([11])
      notifier.simulated.should.be.true()
    })

    it("should calculate bits from pins", () => {
      gpio.createNotifier([11]).bits.should.equal(2048)
      gpio.createNotifier([11, 13]).bits.should.equal(8192 + 2048)
    })
  })
})
