import expect from "expect"
import RouteTrackerFactory, { DataType, type RouteTracker } from "./RouteTracker"
import ObservableValue from "../lib/ObservableValue"
import { spy } from "sinon"

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
    const observer = spy()
    tracker.registerObserver(observer)
    tracker.track(value, DataType.CAR_ORIENTATION, (value) => value)
    value.notify(5)
    tracker.endRecording()
    expect(observer.firstCall.args[0]).toEqual({ time: 1, type: DataType.CAR_ORIENTATION, value: 5 })
  })

  it("should send a completion event", () => {
    const observer = spy()
    tracker.registerObserver(observer)
    tracker.endRecording()
    expect(observer.calledOnceWith({ time: 1, type: DataType.ROUTE_END })).toBe(true)
  })
})
