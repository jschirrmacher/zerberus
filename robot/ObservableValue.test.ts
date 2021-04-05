import "should"
import Sinon from "sinon"
import ObservableValue from "./ObservableValue"

describe("Observable Value", () => {
  it("should allow updating and retrieving the stored value", () => {
    const val = ObservableValue("test", 1)
    val.get().should.equal(1)
    val.set(10)
    val.get().should.equal(10)
  })

  it("should let me update the value with a single call", () => {
    const val = ObservableValue("test", 1)
    val.update((current) => current + 3)
    val.get().should.equal(4)
  })

  it("should notify observers when value changes", () => {
    const val = ObservableValue("test", 1)
    const observer = Sinon.spy()
    val.registerObserver(observer)
    observer.callCount.should.equal(0)
    val.set(2)
    observer.callCount.should.equal(1)
  })

  it("should notify all registered observers", () => {
    const val = ObservableValue("test", 1)
    const observer1 = Sinon.spy()
    const observer2 = Sinon.spy()
    val.registerObserver(observer1)
    val.registerObserver(observer2)
    val.set(2)
    observer1.callCount.should.equal(1)
    observer2.callCount.should.equal(1)
  })

  it("should not notify observers when set() is called with the same value", () => {
    const val = ObservableValue("test", 1)
    const observer = Sinon.spy()
    val.registerObserver(observer)
    val.set(1)
    observer.callCount.should.equal(0)
  })

  it("should not notify unregistered observers", () => {
    const val = ObservableValue<number>("test", 1)
    const observer = Sinon.spy()
    val.registerObserver(observer)
    val.set(4)
    observer.callCount.should.equal(1)
    val.unregisterObserver(observer)
    val.set(8)
    observer.callCount.should.equal(1)
  })
})
