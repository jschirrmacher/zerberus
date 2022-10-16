import "should"
import "should-sinon"
import sinon from "sinon"
import CarFactory, { Car, Direction, MINIMAL_DISTANCE, MINIMAL_TURN_ANGLE } from "./Car"
import MockMotor, { createMotorSpies } from "../MotorSet/MockMotor"
import { Motor } from "../MotorSet/Motor"
import { create as createOrientation, fromDegrees, fromRadian } from "./Orientation"
import { create as createPosition } from "./Position"
import { isPending } from "../lib/TestHelpers"
import MPUFactory from "../Hardware/MPU6050"
import TestLogger, { Logger } from "../lib/Logger"

const sandbox = sinon.createSandbox()

describe("Car", () => {
  let left: Motor
  let right: Motor
  let car: Car
  let leftMotorSpy: ReturnType<typeof createMotorSpies>
  let rightMotorSpy: ReturnType<typeof createMotorSpies>
  let logger: Logger

  beforeEach(async () => {
    logger = TestLogger()
    leftMotorSpy = createMotorSpies(sandbox)
    rightMotorSpy = createMotorSpies(sandbox)

    left = MockMotor(1, leftMotorSpy)
    right = MockMotor(2, rightMotorSpy)
    const mpu = await MPUFactory({ useFake: true })
    car = CarFactory({ left, right }, mpu, logger)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe("motor control", () => {
    it("should both accelerate to the given throttle", async () => {
      await car.accelerate(100)
      leftMotorSpy.accelerate.should.be.calledWith(100)
      rightMotorSpy.accelerate.should.be.calledWith(100)
    })

    it("should have a throttle of zero after breaking", async () => {
      await car.accelerate(100)
      await car.stop()
      leftMotorSpy.stop.should.be.calledOnce()
      rightMotorSpy.stop.should.be.calledOnce()
    })

    it("should have a throttle of zero after floating", async () => {
      await car.accelerate(100)
      await car.float()
      leftMotorSpy.float.should.be.calledOnce()
      rightMotorSpy.float.should.be.calledOnce()
    })

    it("should run motors in different directions if car turns on the spot", async () => {
      await car.turn(Direction.left)
      leftMotorSpy.accelerate.should.be.calledWith(-50)
      rightMotorSpy.accelerate.should.be.calledWith(50)
    })

    it("should set one motor slower than the other when turning while car is in motion", async () => {
      left.throttle = 50
      right.throttle = 50
      await car.turn(Direction.left)
      leftMotorSpy.accelerate.should.be.calledWith(25)
      rightMotorSpy.accelerate.should.be.calledWith(75)
    })

    it("should run the motors only until reaching a position", async () => {
      await car.go(100, 50)
      leftMotorSpy.go.should.be.calledWith(100, 50)
      rightMotorSpy.go.should.be.calledWith(100, 50)
      leftMotorSpy.float.should.be.calledOnce()
      rightMotorSpy.float.should.be.calledOnce()
    })

    it("should receive and propagate blocking events", async () => {
      let signalReceived = false
      car.state.registerObserver(() => (signalReceived = true))
      const promise = car.go(500, 50)
      left.blocked.notify(true)
      signalReceived.should.be.true()
      await promise
    })
  })

  describe("turning relative", () => {
    it("should accelerate the motors in the correct direction", async () => {
      const turned = car.turnRelative(createOrientation(1))
      leftMotorSpy.accelerate.should.be.calledWith(50)
      rightMotorSpy.accelerate.should.be.calledWith(-50)
      car.orientation.value = createOrientation(1)
      await turned
    })

    it("should stop when relative angle is reached", async () => {
      await car.accelerate(50)
      const turn = car.turnRelative(createOrientation(Math.PI / 4))
      car.orientation.value = fromDegrees(20)
      ;(await isPending(turn)).should.be.true()
      car.orientation.value = fromDegrees(45)
      ;(await isPending(turn)).should.be.false()
    })

    it("should not turn if angle is too small", async () => {
      await car.turnRelative(createOrientation(MINIMAL_TURN_ANGLE.angle * 0.99))
      car.orientation.value.degreeAngle().should.equal(0)
    })
  })

  describe("turning to an absolute angle", () => {
    it("should stop when angle is reached", async () => {
      const turn = car.turnTo(createOrientation(Math.PI / 4))
      car.orientation.value = fromDegrees(20)
      ;(await isPending(turn)).should.be.true()
      car.orientation.value = fromDegrees(45)
      ;(await isPending(turn)).should.be.false()
    })

    it("should turn left", async () => {
      const turn = car.turnTo(createOrientation((-Math.PI * 3) / 4))
      while (await isPending(turn)) {
        car.orientation.value = car.orientation.value.add(fromDegrees(-1))
      }
      await turn
      Math.abs(car.orientation.value.degreeAngle() + 135).should.lessThanOrEqual(4)
    })

    it("should not turn if angle is too small", async () => {
      await car.turnTo(createOrientation(MINIMAL_TURN_ANGLE.angle * 0.99))
      car.orientation.value.degreeAngle().should.equal(0)
    })
  })

  describe("directions", () => {
    async function fakeMotorMovement() {
      const go = car.go(100, 50)
      left.position.value = 100
      right.position.value = 100
      await go
    }

    it("should send commands to both motors", async () => {
      car.go(100, 50)
      leftMotorSpy.go.should.be.calledWith(100, 50)
      rightMotorSpy.go.should.be.calledWith(100, 50)
    })

    it("should reach positive X coordinates when running east", async () => {
      await fakeMotorMovement()
      car.position.value.x.should.be.greaterThan(0)
    })

    it("should reach positive Y coordinates when running north°", async () => {
      car.orientation.value = fromRadian(-Math.PI / 2)
      await fakeMotorMovement()
      car.position.value.y.should.be.greaterThan(0)
    })

    it("should reach negative X coordinates when running west", async function () {
      car.orientation.value = fromRadian(Math.PI)
      await fakeMotorMovement()
      car.position.value.x.should.be.lessThan(0)
    })

    it("should reach negative Y coordinates when running south", async () => {
      car.orientation.value = fromRadian(Math.PI / 2)
      await fakeMotorMovement()
      car.position.value.y.should.be.lessThan(0)
    })
  })

  describe("absolute positioning", () => {
    it("should reach the goal if its in a straight line", async () => {
      const destination = createPosition(200, 0)
      const goto = car.goto(destination)
      await approximateMovement(goto)

      car.position.value.distanceTo(destination).should.be.lessThanOrEqual(MINIMAL_DISTANCE)
    })

    it("should reach the given position", async function () {
      car.position.value = createPosition(-300, 100)
      const destination = createPosition(200, 200)
      const goto = car.goto(destination)
      await approximateMovement(goto)
      car.position.value.distanceTo(destination).should.be.lessThanOrEqual(MINIMAL_DISTANCE)
    })

    async function approximateMovement(goto: Promise<void>) {
      function move(stepX: number, stepY: number) {
        left.position.value += stepX
        right.position.value += stepY
      }

      move(2, 2)
      while (await isPending(goto)) {
        const x = leftMotorSpy.setThrottle.lastCall?.args[0] || 0
        const y = rightMotorSpy.setThrottle.lastCall?.args[0] || 0
        const factor = Math.sqrt(x * x + y * y) / 2
        move(x / factor, y / factor)
      }
      await goto
    }

    it("should follow a route", async function () {
      this.timeout(15000)
      let goto = car.goto(createPosition(200, 200))
      await approximateMovement(goto)
      goto = car.goto(createPosition(-200, 200))
      await approximateMovement(goto)
      goto = car.goto(createPosition(-200, -200))
      await approximateMovement(goto)
      car.position.value.distanceTo(createPosition(-200, -200)).should.be.lessThanOrEqual(MINIMAL_DISTANCE)
    })
  })
})
