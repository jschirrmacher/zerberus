import { describe, expect, it, vi } from "vitest"
import ObservableFactory, { addObservableProperty } from "./ObservableValue"
import Subject from "./Subject"

describe("ObservableValue", () => {
  it("should allow updating and retrieving the stored value", () => {
    const val = ObservableFactory("test", 1)
    expect(val.value).toEqual(1)
    val.value = 10
    expect(val.value).toEqual(10)
  })

  it("should let me update the value with a single call", () => {
    const val = ObservableFactory("test", 1)
    val.value += 3
    expect(val.value).toEqual(4)
  })

  it("should notify observers when value changes", () => {
    const val = ObservableFactory("test", 1)
    const observer = vi.fn()
    val.registerObserver(observer)
    expect(observer).not.toBeCalled()
    val.value = 2
    expect(observer.mock.lastCall).toEqual([2, expect.any(Object)])
  })

  it("should notify all registered observers", () => {
    const val = ObservableFactory("test", 1)
    const observer1 = vi.fn()
    const observer2 = vi.fn()
    val.registerObserver(observer1)
    val.registerObserver(observer2)
    val.value = 2
    expect(observer1).toBeCalledWith(2, expect.any(Object))
    expect(observer2).toBeCalledWith(2, expect.any(Object))
  })

  it("should not notify observers when set() is called with the same value", () => {
    const val = ObservableFactory("test", 1)
    const observer = vi.fn()
    val.registerObserver(observer)
    val.value = 1
    expect(observer).toBeCalledTimes(0)
  })

  it("should not notify unregistered observers", () => {
    const val = ObservableFactory<number>("test", 1)
    const observer = vi.fn()
    val.registerObserver(observer)
    val.value = 4
    expect(observer).toBeCalledTimes(1)
    val.unregisterObserver(observer)
    val.value = 8
    expect(observer).toBeCalledTimes(1)
  })

  it("should be usable as primitive value", () => {
    const val = ObservableFactory("test", 42)
    expect(+val + 5).toBe(47)
  })

  describe("as object properties", () => {
    it("can be added to objects", () => {
      const obj = {} as { test: number }
      addObservableProperty(obj, "test", Subject("test-subject"), 42)
      expect(obj.test).toEqual(42)
    })

    it("should send notifications when value is modified", () => {
      const subject = Subject("test-subject")
      const obj = {} as { test: number }
      addObservableProperty(obj, "test", subject, 42)
      const observer = vi.fn()
      subject.registerObserver(observer)
      obj.test = 24
      expect(observer).toBeCalledTimes(1)
    })
  })
})
