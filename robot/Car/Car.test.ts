import expect from "expect"
import * as sinon from "sinon"
import CarFactory, { type Car, Direction, MINIMAL_DISTANCE, MINIMAL_TURN_ANGLE } from "./Car"
import MockMotor, { createMotorSpies } from "../MotorSet/MockMotor"
import type { Motor } from "../MotorSet/Motor"
import { create as createOrientation, fromDegrees, fromRadian } from "./Orientation"
import { create as createPosition } from "./Position"
import { isPending } from "../lib/TestHelpers"
import MPUFactory from "../Hardware/MPU6050"
import TestLogger, { type Logger } from "../lib/Logger"

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
      expect(leftMotorSpy.accelerate.calledWith(100)).toBe(true)
      expect(rightMotorSpy.accelerate.calledWith(100)).toBe(true)
    })

    it("should have a throttle of zero after breaking", async () => {
      await car.accelerate(100)
      await car.stop()
      expect(leftMotorSpy.stop.calledOnce).toBe(true)
      expect(rightMotorSpy.stop.calledOnce).toBe(true)
    })

    it("should have a throttle of zero after floating", async () => {
      await car.accelerate(100)
      await car.float()
      expect(leftMotorSpy.float.calledOnce).toBe(true)
      expect(rightMotorSpy.float.calledOnce).toBe(true)
    })

    it("should run motors in different directions if car turns on the spot", async () => {
      await car.turn(Direction.left)
      expect(leftMotorSpy.accelerate.calledWith(-50)).toBe(true)
      expect(rightMotorSpy.accelerate.calledWith(50)).toBe(true)
    })

    it("should set one motor slower than the other when turning while car is in motion", async () => {
      left.throttle = 50
      right.throttle = 50
      await car.turn(Direction.left)
      expect(leftMotorSpy.accelerate.calledWith(25)).toBe(true)
      expect(rightMotorSpy.accelerate.calledWith(75)).toBe(true)
    })

    it("should run the motors only until reaching a position", async () => {
      await car.go(100, 50)
      expect(leftMotorSpy.go.calledWith(100, 50)).toBe(true)
      expect(rightMotorSpy.go.calledWith(100, 50)).toBe(true)
      expect(leftMotorSpy.float.calledOnce).toBe(true)
      expect(rightMotorSpy.float.calledOnce).toBe(true)
    })

    it("should receive and propagate blocking events", async () => {
      let signalReceived = false
      car.state.registerObserver(() => (signalReceived = true))
      const promise = car.go(500, 50)
      left.blocked.notify(true)
      expect(signalReceived).toBe(true)
      await promise
    })
  })

  describe("turning relative", () => {
    it("should accelerate the motors in the correct direction", async () => {
      const turned = car.turnRelative(createOrientation(1))
      expect(leftMotorSpy.accelerate.calledWith(50)).toBe(true)
      expect(rightMotorSpy.accelerate.calledWith(-50)).toBe(true)
      car.orientation.value = createOrientation(1)
      await turned
    })

    it("should stop when relative angle is reached", async () => {
      await car.accelerate(50)
      const turn = car.turnRelative(createOrientation(Math.PI / 4))
      car.orientation.value = fromDegrees(20)
      expect(await isPending(turn)).toBe(true)
      car.orientation.value = fromDegrees(45)
      expect(await isPending(turn)).toBe(false)
    })

    it("should not turn if angle is too small", async () => {
      await car.turnRelative(createOrientation(MINIMAL_TURN_ANGLE.angle * 0.99))
      expect(car.orientation.value.degreeAngle()).toEqual(0)
    })
  })

  describe("turning to an absolute angle", () => {
    it("should stop when angle is reached", async () => {
      const turn = car.turnTo(createOrientation(Math.PI / 4))
      car.orientation.value = fromDegrees(20)
      expect(await isPending(turn)).toBe(true)
      car.orientation.value = fromDegrees(45)
      expect(await isPending(turn)).toBe(false)
    })

    it("should turn left", async () => {
      const turn = car.turnTo(createOrientation((-Math.PI * 3) / 4))
      while (await isPending(turn)) {
        car.orientation.value = car.orientation.value.add(fromDegrees(-1))
      }
      await turn
      expect(Math.abs(car.orientation.value.degreeAngle() + 135)).toBeLessThanOrEqual(4)
    })

    it("should not turn if angle is too small", async () => {
      await car.turnTo(createOrientation(MINIMAL_TURN_ANGLE.angle * 0.99))
      expect(car.orientation.value.degreeAngle()).toEqual(0)
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
      expect(leftMotorSpy.go.calledWith(100, 50)).toBe(true)
      expect(rightMotorSpy.go.calledWith(100, 50)).toBe(true)
    })

    it("should reach positive X coordinates when running east", async () => {
      await fakeMotorMovement()
      expect(car.position.value.x).toBeGreaterThan(0)
    })

    it("should reach positive Y coordinates when running north°", async () => {
      car.orientation.value = fromRadian(-Math.PI / 2)
      await fakeMotorMovement()
      expect(car.position.value.y).toBeGreaterThan(0)
    })

    it("should reach negative X coordinates when running west", async function () {
      car.orientation.value = fromRadian(Math.PI)
      await fakeMotorMovement()
      expect(car.position.value.x).toBeLessThan(0)
    })

    it("should reach negative Y coordinates when running south", async () => {
      car.orientation.value = fromRadian(Math.PI / 2)
      await fakeMotorMovement()
      expect(car.position.value.y).toBeLessThan(0)
    })
  })

  describe("absolute positioning", () => {
    it("should reach the goal if its in a straight line", async () => {
      const destination = createPosition(200, 0)
      const goto = car.goto(destination)
      await approximateMovement(goto)

      expect(car.position.value.distanceTo(destination)).toBeLessThanOrEqual(MINIMAL_DISTANCE)
    })

    it("should reach the given position", async function () {
      car.position.value = createPosition(-300, 100)
      const destination = createPosition(200, 200)
      const goto = car.goto(destination)
      await approximateMovement(goto)
      expect(car.position.value.distanceTo(destination)).toBeLessThanOrEqual(MINIMAL_DISTANCE)
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
      expect(car.position.value.distanceTo(createPosition(-200, -200))).toBeLessThanOrEqual(MINIMAL_DISTANCE)
    })
  })
})
