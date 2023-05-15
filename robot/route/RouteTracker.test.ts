import { beforeEach, describe, expect, it, vi } from "vitest"
import RouteTrackerFactory, { DataType, type RouteTracker } from "./RouteTracker"
import ObservableValue from "../lib/ObservableValue"

describe("RouteTracker", () => {
  let tracker: RouteTracker
  let time = 42

  beforeEach(() => {
    tracker = RouteTrackerFactory("Test", () => time++)
  })

  it("should allow creation of a route with a name", () => {
    expect(tracker.name).toEqual("Test")
    expect(tracker.start).toBeGreaterThan(0)
    expect(tracker.end).toEqual(undefined)
  })

  it("should track events", () => {
    const value = ObservableValue("orientation", 0)
    const observer = vi.fn()
    tracker.registerObserver(observer)
    tracker.track(value, DataType.CAR_ORIENTATION, (value) => value)
    value.notify(5)
    tracker.endRecording()
    expect(observer).toBeCalledWith({ time: 1, type: DataType.CAR_ORIENTATION, value: 5 }, expect.any(Object))
  })

  it("should send a completion event", () => {
    const observer = vi.fn()
    tracker.registerObserver(observer)
    tracker.endRecording()
    expect(observer).toBeCalledWith({ time: 1, type: DataType.ROUTE_END }, expect.any(Object))
  })
})
