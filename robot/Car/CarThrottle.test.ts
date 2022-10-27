import expect from "expect"
import { throttleFromJoystickValues } from "./CarThrottle"

function testWithValues(input: number[], output: number[]): void {
  expect(throttleFromJoystickValues({ x: input[0], y: input[1] })).toEqual({ left: output[0], right: output[1] })
}

describe("CarThrottle", () => {
  it("should not throttle if both x and y are 0", () => {
    testWithValues([0, 0], [0, 0])
  })

  it("should use y value as throttle, if x is 0", () => {
    testWithValues([0, 100], [100, 100])
  })

  it("should rotate in place if y is 0", () => {
    testWithValues([100, 0], [100, -100])
  })

  it("should use a quadratic curve to adapt throttle", () => {
    testWithValues([0, 50], [25, 25])
  })

  it("should not throttle more than 100 if both x and y are greater 0", () => {
    testWithValues([80, 80], [100, -28])
  })

  it("should not throttle less than -100 if both x and y are less than 0", () => {
    testWithValues([-80, -80], [-100, 28])
  })
})
