import "should"
import MotorFactory, { getAdaptedThrottle, Motor, MotorMode, MAX_ACCELERATION } from "./Motor"
import GPIOFactory, { GPIO, INPUT, OUTPUT, PWM } from "../Hardware/gpio"
import { Encoder } from "./Encoder"
import MockEncoderFactory, { createEncoderSpies } from "./MockEncoder"
import { createSandbox } from "sinon"

const sandbox = createSandbox()

describe("MotorSet", () => {
  let encoder: Encoder
  let motor: Motor
  let gpio: GPIO
  let encoderSpy

  function notify(pos: number, speed: number) {
    encoder.position.notify(pos)
    encoder.speed.notify(speed)
  }

  beforeEach(() => {
    gpio = GPIOFactory(true)
    encoderSpy = createEncoderSpies(sandbox)
    encoder = MockEncoderFactory(1, encoderSpy)
    motor = MotorFactory(gpio, 1, 2, 3, encoder)
  })

  afterEach(() => {
    motor.destruct()
  })

  it("should initialize the GPIO", () => {
    gpio.initializedPins.should.deepEqual({
      1: { mode: OUTPUT },
      2: { mode: OUTPUT },
      3: { mode: PWM },
    })
  })

  it("should have an id", () => {
    const motor2 = MotorFactory(gpio, 6, 7, 8, encoder)
    const no2 = motor2.no
    no2.should.not.equal(motor.no)
  })

  it("should be in FORWARD mode after being accelerated", async () => {
    motor.accelerate(100)
    motor.mode.value.should.equal(MotorMode.FORWARD)
  })

  it("should be in BACKWARDS mode after being accelerated with negative speed", async () => {
    motor.accelerate(-100)
    motor.mode.value.should.equal(MotorMode.BACKWARDS)
  })

  it("should go to FLOAT mode when decelerated to 0", async () => {
    motor.accelerate(10)
    motor.accelerate(0)
    motor.mode.value.should.equal(MotorMode.FLOAT)
  })

  it("should reflect the throttle", async () => {
    const accelerate = motor.accelerate(42)
    motor.throttle.should.equal(42)
  })

  it("should not allow to accelerate to more than 100%", async () => {
    motor.accelerate(101)
    motor.throttle.should.equal(100)
    motor.accelerate(-101)
    motor.throttle.should.equal(-100)
  })

  it("should adapt throttle slowly", () => {
    getAdaptedThrottle(100, 0).should.equal(MAX_ACCELERATION)
    getAdaptedThrottle(100, 80).should.equal(100)
    getAdaptedThrottle(-100, 80).should.equal(80 - MAX_ACCELERATION)
  })

  it("should accelerate with a maximum acceleration", async () => {
    const acceleration = motor.accelerate(100)
    motor.currentThrottle.should.equal(40)
    notify(40, 40)
    motor.currentThrottle.should.equal(80)
    notify(120, 80)
    motor.currentThrottle.should.equal(100)
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
    motor.currentThrottle.should.equal(100)
    const float = motor.float()
    notify(20, 20)
    notify(40, 0)
    await float
    motor.currentThrottle.should.equal(0)
    motor.mode.value.should.equal(MotorMode.FLOAT)
  })

  it("should allow to run the motor a given distance", async () => {
    const go = motor.go(100, 100)
    notify(110, 1)
    encoder.position.value = 110
    await go
    motor.position.value.should.be.greaterThanOrEqual(100)
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
      motor.mode.value.should.equal(MotorMode.FLOAT)
      motor.throttle.should.equal(0)
    })

    it("should prevent to accelerate when motor is blocked", async () => {
      await blockMotor()
      await motor.accelerate(50).should.be.rejected()
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
      called.should.equal(1)
    })
  })
})
