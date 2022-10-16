import "should"
import should from "should"
import RouteTrackerFactory, { DataType, RouteTracker } from "./RouteTracker"
import ObservableValue from "../lib/ObservableValue"
import Sinon from "sinon"

describe("RouteTracker", () => {
  let tracker: RouteTracker
  let time = 42

  beforeEach(() => {
    tracker = RouteTrackerFactory("Test", () => time++)
  })

  it("should allow creation of a route with a name", () => {
    tracker.name.should.equal("Test")
    tracker.start.should.greaterThan(0)
    should.equal(tracker.end, null)
  })

  it("should track events", () => {
    const value = ObservableValue("orientation", 0)
    const spy = Sinon.spy()
    tracker.registerObserver(spy)
    tracker.track(value, DataType.CAR_ORIENTATION, (value) => value)
    value.notify(5)
    tracker.endRecording()
    spy.should.be.calledWith({ time: 1, type: DataType.CAR_ORIENTATION, value: 5 })
  })

  it("should send a completion event", () => {
    const spy = Sinon.spy()
    tracker.registerObserver(spy)
    tracker.endRecording()
    spy.should.be.calledWith({ time: 1, type: DataType.ROUTE_END })
  })
})
