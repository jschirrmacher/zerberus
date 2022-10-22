import { describe, it, expect } from "vitest"
import { shallowMount } from "@vue/test-utils"
import TheCar from "../TheCar.vue"

describe("TheCar", () => {
  it("should render as expected", () => {
    const component = shallowMount(TheCar)
    expect(component.element).toMatchSnapshot()
  })
})
