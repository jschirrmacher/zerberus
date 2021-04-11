import "should"
import Sinon from "sinon"
import ObservableValue from "./ObservableValue"

describe("Observable Value", () => {
  it("should allow updating and retrieving the stored value", () => {
    const val = ObservableValue("test", 1)
    val.value.should.equal(1)
    val.value = 10
    val.value.should.equal(10)
  })

  it("should let me update the value with a single call", () => {
    const val = ObservableValue("test", 1)
    val.value += 3
    val.value.should.equal(4)
  })

  it("should notify observers when value changes", () => {
    const val = ObservableValue("test", 1)
    const observer = Sinon.spy()
    val.registerObserver(observer)
    observer.callCount.should.equal(0)
    val.value = 2
    observer.callCount.should.equal(1)
  })

  it("should notify all registered observers", () => {
    const val = ObservableValue("test", 1)
    const observer1 = Sinon.spy()
    const observer2 = Sinon.spy()
    val.registerObserver(observer1)
    val.registerObserver(observer2)
    val.value = 2
    observer1.callCount.should.equal(1)
    observer2.callCount.should.equal(1)
  })

  it("should not notify observers when set() is called with the same value", () => {
    const val = ObservableValue("test", 1)
    const observer = Sinon.spy()
    val.registerObserver(observer)
    val.value = 1
    observer.callCount.should.equal(0)
  })

  it("should not notify unregistered observers", () => {
    const val = ObservableValue<number>("test", 1)
    const observer = Sinon.spy()
    val.registerObserver(observer)
    val.value = 4
    observer.callCount.should.equal(1)
    val.unregisterObserver(observer)
    val.value = 8
    observer.callCount.should.equal(1)
  })
})
