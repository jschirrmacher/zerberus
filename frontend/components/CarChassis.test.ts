import { describe, it, expect } from "vitest"
import { shallowMount } from "@vue/test-utils"
import CarChassis from "./CarChassis.vue"

describe("CarChassis", () => {
  it("should render as expected", () => {
    const component = shallowMount(CarChassis, {
      props: { length: 100, width: 200, height: 50, color: "#abcdef" },
    })
    expect(component.element).toMatchSnapshot()
  })
})
