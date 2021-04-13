import "should"
import { throttleFromJoystickValues } from "./CarThrottle"

describe("CarThrottle", () => {
  it("should not throttle if both x and y are 0", () => {
    throttleFromJoystickValues({ x: 0, y: 0 }).should.deepEqual({ left: 0, right: 0 })
  })

  it("should use y value as throttle, if x is 0", () => {
    throttleFromJoystickValues({ x: 0, y: 42 }).should.deepEqual({ left: 42, right: 42 })
  })

  it("should rotate in place if y is 0", () => {
    throttleFromJoystickValues({ x: 100, y: 0 }).should.deepEqual({ left: 100, right: -100 })
  })

  it("should not throttle more than 100 if both x and y are greater 0", () => {
    throttleFromJoystickValues({ x: 80, y: 80 }).should.deepEqual({ left: 100, right: -60 })
  })

  it("should not throttle less than -100 if both x and y are less than 0", () => {
    throttleFromJoystickValues({ x: -80, y: -80 }).should.deepEqual({ left: -100, right: 60 })
  })
})
