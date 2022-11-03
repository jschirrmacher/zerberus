import { mount } from "@vue/test-utils"
import { describe, it, expect } from "vitest"
import { mockSocket } from "./lib/WebSockets"
import App from "./App.vue"

type Point = { x: number; y: number }
type Throttle = { left: number; right: number }

describe("App", () => {
  async function testSetMotorThrottles(input: Point, output: Throttle) {
    const socket = await mockSocket()
    const component = mount(App)
    ;(component.vm as unknown as typeof App).setMotorThrottles(input)
    expect(socket.emit).toBeCalledWith("motor-throttle", output)
  }

  it("should not throttle if both x and y are 0", async () => {
    await testSetMotorThrottles({ x: 0, y: 0 }, { left: 0, right: 0 })
  })

  it("should use y value as throttle, if x is 0", async () => {
    await testSetMotorThrottles({ x: 0, y: 100 }, { left: 100, right: 100 })
  })

  it("should rotate in place if y is 0", async () => {
    await testSetMotorThrottles({ x: 100, y: 0 }, { left: 100, right: -100 })
  })

  it("should use a quadratic curve to adapt throttle", async () => {
    await testSetMotorThrottles({ x: 0, y: 50 }, { left: 25, right: 25 })
  })

  it("should not throttle more than 100 if both x and y are greater 0", async () => {
    await testSetMotorThrottles({ x: 80, y: 80 }, { left: 100, right: -28 })
  })

  it("should not throttle less than -100 if both x and y are less than 0", async () => {
    await testSetMotorThrottles({ x: -80, y: -80 }, { left: -100, right: 28 })
  })
})
