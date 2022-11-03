import { describe, it, expect } from "vitest"
import { shallowMount } from "@vue/test-utils"
import CarWheel from "./CarWheel.vue"

describe("CarWheel", () => {
  it("should render as expected", () => {
    const component = shallowMount(CarWheel, {
      props: { diameter: 100, width: 30, speed: 0 },
    })
    expect(component.element).toMatchSnapshot()
  })

  it("should turn if a speed is specified", () => {
    const component = shallowMount(CarWheel, {
      props: { diameter: 100, width: 30, speed: 100 },
    })
    expect(component.element).toMatchSnapshot()
  })

  it("should turn backwards if a negative speed is specified", () => {
    const component = shallowMount(CarWheel, {
      props: { diameter: 100, width: 30, speed: -50 },
    })
    expect(component.element).toMatchSnapshot()
  })
})
