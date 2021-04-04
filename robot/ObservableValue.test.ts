import "should"
import Sinon from "sinon"
import ObservableValue from "./ObservableValue"

describe("Observable Value", () => {
  it("should allow updating and retrieving the stored value", () => {
    const val = ObservableValue<number>("test", 1)
    val.get().should.equal(1)
    val.set(10)
    val.get().should.equal(10)
  })

  it("should notify any observers when value changed", () => {
    const val = ObservableValue<number>("test", 1)
    const observer1 = Sinon.spy()
    const observer2 = Sinon.spy()
    val.registerObserver(observer1)
    observer1.callCount.should.equal(0)
    val.set(-1)
    observer1.callCount.should.equal(1)
    val.registerObserver(observer2)
    val.set(-1) // dont update if the value is still the same
    observer1.callCount.should.equal(1)
    observer2.callCount.should.equal(0)
    val.set(1)
    observer1.callCount.should.equal(2)
    observer2.callCount.should.equal(1)
  })

  it("should respect observers unregistering", () => {
    const val = ObservableValue<number>("test", 1)
    const observer1 = Sinon.spy()
    val.registerObserver(observer1)
    val.set(4)
    observer1.callCount.should.equal(1)
    val.unregisterObserver(observer1)
    val.set(8)
    observer1.callCount.should.equal(1)
  })
})
