import 'should'
import MotorFactory, { getAdaptedThrottle, Motor, MotorMode, MAX_ACCELERATION } from './MotorSet'
import GPIOFactory, { GPIO, INPUT, OUTPUT, PWM } from './gpio'
import EncoderFactory, { Encoder } from './Encoder'
import Logger, { LogLevel } from "./Logger"

process.env.DEBUG = "motorset"
const logger = Logger()

describe('MotorSet', () => {
  let encoder: Encoder
  let motor: Motor
  let gpio: GPIO

  beforeEach(() => {
    gpio = GPIOFactory(true)
    encoder = EncoderFactory(gpio, 4, 5)
    motor = MotorFactory(gpio, 1, 2, 3, encoder, logger)
  })

  afterEach(() => {
    motor.destruct()
    logger.reset()
  })

  it('should initialize the GPIO', () => {
    gpio.initializedPins.should.deepEqual({
      1: { mode: OUTPUT },
      2: { mode: OUTPUT },
      3: { mode: PWM },
      4: { mode: INPUT },
      5: { mode: INPUT },
    })
  })

  it('should have an id', () => {
    const motor2 = MotorFactory(gpio, 6, 7, 8)
    const no2 = motor2.no
    no2.should.not.equal(motor.no)
  })

  it('should be in FORWARD mode after being accelerated', async () => {
    await motor.accelerate(100).completed
    motor.mode.should.equal(MotorMode.FORWARD)
  })

  it('should be in BACKWARDS mode after being accelerated with negative speed', async () => {
    await motor.accelerate(-100).completed
    motor.mode.should.equal(MotorMode.BACKWARDS)
  })

  it('should go to FLOAT mode when decelerated to 0', async () => {
    await motor.accelerate(10).completed
    await motor.accelerate(0).completed
    motor.mode.should.equal(MotorMode.FLOAT)
  })

  it('should reflect the throttle', async () => {
    await motor.accelerate(42).completed
    motor.throttle.should.equal(42)
  })

  it('should not allow to accelerate to more than 100%', async () => {
    await motor.accelerate(101).completed
    motor.throttle.should.equal(100)
    await motor.accelerate(-101).completed
    motor.throttle.should.equal(-100)
  })

  it('should adapt throttle slowly', () => {
    getAdaptedThrottle(100, 0).should.equal(MAX_ACCELERATION)
    getAdaptedThrottle(100, 80).should.equal(100)
    getAdaptedThrottle(-100, 80).should.equal(80 - MAX_ACCELERATION)
  })
  
  it('should accelerate with a maximum acceleration', async () => {
    await motor.accelerate(100).completed
    logger.get(LogLevel.debug)
      .map(e => e.split(","))
      .filter(e => e[4] === "adaptSpeed")
      .map(e => e[3]).should.deepEqual([ '40', '80', '100' ])
  })

  it('should go to FLOAT mode when calling float()', async () => {
    await motor.accelerate(100).completed
    await motor.float().completed
    motor.mode.should.equal(MotorMode.FLOAT)
  })

  it('should allow to wait for a position to be reached', async () => {
    const trigger = motor.positionReached(10)
    motor.accelerate(100)
    await trigger.completed
    motor.getPosition().should.be.greaterThanOrEqual(10)
  })

  it('should allow to wait for a negative position to be reached', async () => {
    const trigger = motor.positionReached(-10)
    motor.accelerate(-100)
    await trigger.completed
    motor.getPosition().should.be.lessThanOrEqual(10)
  })

  it('should allow to be notified when a speed is reached', async () => {
    const trigger = motor.speedReached(50)
    motor.accelerate(100)
    await trigger.completed
    motor.getSpeed().should.be.greaterThanOrEqual(50)
  })

  it('should allow to run the motor a given distance', async () => {
    await motor.go(100, 100).completed
    motor.getPosition().should.be.greaterThanOrEqual(100)
  })

  describe("with blocked motor", () => {    
    async function blockMotor() {
      encoder.simulated = false // prevent simulated ticks
      const trigger = motor.go(500, 50)
      encoder.simulateSpeed(0)
      await trigger.completed
    }

    it("should set motor to float if it blocks", async () => {
      await blockMotor()
      motor.mode.should.equal(MotorMode.FLOAT)
      motor.throttle.should.equal(0)
    })
  
    it("should prevent to accelerate when motor is blocked", async () => {
      await blockMotor()
      const tryAccelerate = () => motor.accelerate(50)
      tryAccelerate.should.throw()
    })
  
    it("should allow to release the lock", async () => {
      await blockMotor()
      encoder.simulated = true
      motor.releaseBlock()
      await motor.go(50, 50).completed
    })
  
    it("should send an event to listeners if motor blocks", async () => {
      let called = 0
      motor.onBlocked(() => ++called < 0)
      await blockMotor()
      called.should.equal(1)
    })
  })
})
