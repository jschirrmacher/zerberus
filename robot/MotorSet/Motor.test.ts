import { afterEach, beforeEach, describe, expect, it } from "vitest"
import MotorFactory, { getAdaptedThrottle, type Motor, MotorMode, MAX_ACCELERATION } from "./Motor"
import GPIOFactory, { type GPIO, OUTPUT, PWM } from "../Hardware/gpio"
import type { Encoder } from "./Encoder"
import MockEncoderFactory, { createEncoderSpies } from "./MockEncoder"
import TestLogger, { type Logger } from "../lib/Logger"

describe("Motor", () => {
  let encoder: Encoder
  let motor: Motor
  let gpio: GPIO
  let encoderSpy
  let logger: Logger

  function notify(pos: number, speed: number) {
    encoder.position.notify(pos)
    encoder.speed.notify(speed)
  }

  beforeEach(() => {
    logger = TestLogger()
    gpio = GPIOFactory(true)
    encoderSpy = createEncoderSpies()
    encoder = MockEncoderFactory(1, encoderSpy)
    motor = MotorFactory(gpio, 1, 2, 3, encoder, logger)
  })

  afterEach(() => {
    motor.destruct()
  })

  it("should initialize the GPIO", () => {
    expect(gpio.initializedPins).toEqual({
      1: { mode: OUTPUT },
      2: { mode: OUTPUT },
      3: { mode: PWM },
    })
  })

  it("should have an id", () => {
    const motor2 = MotorFactory(gpio, 6, 7, 8, encoder)
    const no2 = motor2.no
    expect(no2).not.toEqual(motor.no)
  })

  it("should be in FORWARD mode after being accelerated", async () => {
    motor.accelerate(100)
    expect(motor.mode.value).toEqual(MotorMode.FORWARD)
  })

  it("should be in BACKWARDS mode after being accelerated with negative speed", async () => {
    motor.accelerate(-100)
    expect(motor.mode.value).toEqual(MotorMode.BACKWARDS)
  })

  it("should go to FLOAT mode when decelerated to 0", async () => {
    motor.accelerate(10)
    motor.accelerate(0)
    expect(motor.mode.value).toEqual(MotorMode.FLOAT)
  })

  it("should reflect the throttle", async () => {
    motor.accelerate(42)
    expect(motor.throttle).toEqual(42)
  })

  it("should not allow to accelerate to more than 100%", async () => {
    motor.accelerate(101)
    expect(motor.throttle).toEqual(100)
    motor.accelerate(-101)
    expect(motor.throttle).toEqual(-100)
  })

  it("should adapt throttle slowly", () => {
    expect(getAdaptedThrottle(100, 0)).toEqual(MAX_ACCELERATION)
    expect(getAdaptedThrottle(100, 80)).toEqual(100)
    expect(getAdaptedThrottle(-100, 80)).toEqual(80 - MAX_ACCELERATION)
  })

  it("should accelerate with a maximum acceleration", async () => {
    const acceleration = motor.accelerate(100)
    expect(motor.currentThrottle).toEqual(40)
    notify(40, 40)
    expect(motor.currentThrottle).toEqual(80)
    notify(120, 80)
    expect(motor.currentThrottle).toEqual(100)
    notify(220, 100)
    await acceleration
  })

  it("should go to FLOAT mode when calling float()", async () => {
    const acceleration = motor.accelerate(100)
    let c = 0
    while (c++ != 100 && motor.currentThrottle != 100) {
      notify(motor.position.value + 1, motor.currentThrottle)
    }
    notify(motor.position.value + 1, 100)
    await acceleration
    expect(motor.currentThrottle).toEqual(100)
    const float = motor.float()
    notify(20, 20)
    notify(40, 0)
    await float
    expect(motor.currentThrottle).toEqual(0)
    expect(motor.mode.value).toEqual(MotorMode.FLOAT)
  })

  it("should allow to run the motor a given distance", async () => {
    const go = motor.go(100, 100)
    notify(110, 1)
    encoder.position.value = 110
    await go
    expect(motor.position.value).toBeGreaterThanOrEqual(100)
  })

  describe("with blocked motor", () => {
    async function blockMotor() {
      const accelerate = motor.accelerate(100)
      notify(0, 0)
      notify(0, 0)
      notify(0, 0)
      notify(0, 0)
      notify(0, 0)
      notify(0, 0)
      return accelerate
    }

    it("should set motor to float if it blocks", async () => {
      await blockMotor()
      expect(motor.mode.value).toEqual(MotorMode.FLOAT)
      expect(motor.throttle).toEqual(0)
    })

    it("should prevent to accelerate when motor is blocked", async () => {
      await blockMotor()
      await expect(motor.accelerate(50)).rejects.toEqual(Error("Tried to power blocked motor"))
    })

    it("should allow to release the lock", async () => {
      await blockMotor()
      encoder.simulated = true
      motor.releaseBlock()
      const go = motor.go(50, 50)
      notify(50, 1)
      await go
    })

    it("should send an event to listeners if motor blocks", async () => {
      let called = 0
      motor.blocked.registerObserver(() => ++called < 0)
      await blockMotor()
      expect(called).toEqual(1)
    })
  })
})
