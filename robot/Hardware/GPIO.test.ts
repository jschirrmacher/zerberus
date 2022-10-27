import expect from "expect"
import { spy } from "sinon"
import GPIOFactory, { GPIO, INPUT, OUTPUT } from "./gpio"

describe("GPIO", () => {
  const events = [] as { event: string | symbol; args: unknown }[]
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
      expect(events).toEqual([{ event: "gpio-mode", args: { pin: 11, mode: INPUT } }])
    })

    it("should remember the options of each pin set", () => {
      gpio.create(17, { mode: INPUT })
      expect(gpio.initializedPins).toEqual({ 17: { mode: INPUT } })
    })

    it("should notify registered listernes when digitalWrite() is called", () => {
      const pin = gpio.create(17, { mode: OUTPUT })
      pin.digitalWrite(42)
      expect(events).toContainEqual({ event: "gpio-write", args: { pin: 11, value: 42 } })
    })

    it("should notify registered listernes when pwmWrite() is called", () => {
      const pin = gpio.create(17, { mode: OUTPUT })
      pin.pwmWrite(42)
      expect(events).toContainEqual({ event: "gpio-pwm", args: { pin: 11, value: 42 } })
    })

    it("should not notify de-registered listeners", () => {
      const pin = gpio.create(17, { mode: OUTPUT })
      const listener = spy()
      const id = gpio.addListener(listener)
      gpio.removeListener(id)
      pin.pwmWrite(42)
      expect(listener.callCount).toBe(0)
    })
  })

  describe("Notifier", () => {
    it("should create a simulated notifier", () => {
      const notifier = gpio.createNotifier([11])
      expect(notifier.simulated).toBe(true)
    })

    it("should calculate bits from pins", () => {
      expect(gpio.createNotifier([11]).bits).toEqual(2048)
      expect(gpio.createNotifier([11, 13]).bits).toEqual(8192 + 2048)
    })
  })
})
