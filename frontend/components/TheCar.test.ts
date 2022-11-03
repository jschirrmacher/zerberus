import { describe, it, expect } from "vitest"
import { shallowMount } from "@vue/test-utils"
import TheCar from "./TheCar.vue"

describe("TheCar", () => {
  it("should render as expected", () => {
    const component = shallowMount(TheCar, {
      props: { motorSpeedLeft: 0, motorSpeedRight: 0, direction: 0 },
    })
    expect(component.element).toMatchSnapshot()
  })
})
