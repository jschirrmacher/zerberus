import { describe, it, expect } from "vitest"
import { mount } from "@vue/test-utils"
import ABox from "../ABox.vue"

describe("ABox", () => {
  it("should render as expected", () => {
    const props = { length: "20px", width: "10px", height: "5px", color: "#ff3355" }
    const component = mount(ABox, { props })
    expect(component.element).toMatchSnapshot()
  })
})
