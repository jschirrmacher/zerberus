import { describe, it, expect } from "vitest"
import { shallowMount, VueWrapper } from "@vue/test-utils"
import KeyboardControl from "./KeyboardControl.vue"

type AugmentedVM = VueWrapper & { keydown: (obj: object) => void }

describe("KeyboardControl", () => {
  it("should render as expected", () => {
    const component = shallowMount(KeyboardControl)
    expect(component.element).toMatchSnapshot()
  })

  it("should emit move events when a button is clicked", () => {
    const component = shallowMount(KeyboardControl)
    component.find("#ArrowUp").trigger("click")
    expect(component.emitted().move).toContainEqual([{ x: 0, y: -50 }])
  })

  it("should emit move events when an arrow key is pressed", () => {
    const component = shallowMount(KeyboardControl)
    ;(component.vm as unknown as AugmentedVM).keydown({ key: "ArrowDown" })
    expect(component.emitted().move).toContainEqual([{ x: 0, y: 50 }])
  })

  it("should emit turn events when an arrow key and the shift key is pressed", () => {
    const component = shallowMount(KeyboardControl)
    ;(component.vm as unknown as AugmentedVM).keydown({ key: "ArrowDown", shiftKey: true })
    expect(component.emitted().turn).toContainEqual([{ x: -5, y: 0 }])
  })

  it("should emit zoom events when the plus key is pressed", () => {
    const component = shallowMount(KeyboardControl)
    ;(component.vm as unknown as AugmentedVM).keydown({ key: "+" })
    expect(component.emitted().zoom).toContainEqual([10])
  })

  it("should emit zoom events when the minus key is pressed", () => {
    const component = shallowMount(KeyboardControl)
    ;(component.vm as unknown as AugmentedVM).keydown({ key: "-" })
    expect(component.emitted().zoom).toContainEqual([-10])
  })
})
