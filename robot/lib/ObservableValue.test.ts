import "should"
import Sinon from "sinon"
import ObservableFactory, { addObservableProperty, createObservable, ObservableValue } from "./ObservableValue"
import Subject from "./Subject"

describe("Observable Values", () => {
  it("should allow updating and retrieving the stored value", () => {
    const val = ObservableFactory("test", 1)
    val.value.should.equal(1)
    val.value = 10
    val.value.should.equal(10)
  })

  it("should let me update the value with a single call", () => {
    const val = ObservableFactory("test", 1)
    val.value += 3
    val.value.should.equal(4)
  })

  it("should notify observers when value changes", () => {
    const val = ObservableFactory("test", 1)
    const observer = Sinon.spy()
    val.registerObserver(observer)
    observer.should.not.be.called()
    val.value = 2
    observer.should.be.calledWith(2)
  })

  it("should notify all registered observers", () => {
    const val = ObservableFactory("test", 1)
    const observer1 = Sinon.spy()
    const observer2 = Sinon.spy()
    val.registerObserver(observer1)
    val.registerObserver(observer2)
    val.value = 2
    observer1.should.be.calledWith(2)
    observer2.should.be.calledWith(2)
  })

  it("should not notify observers when set() is called with the same value", () => {
    const val = ObservableFactory("test", 1)
    const observer = Sinon.spy()
    val.registerObserver(observer)
    val.value = 1
    observer.should.not.be.called()
  })

  it("should not notify unregistered observers", () => {
    const val = ObservableFactory<number>("test", 1)
    const observer = Sinon.spy()
    val.registerObserver(observer)
    val.value = 4
    observer.callCount.should.equal(1)
    val.unregisterObserver(observer)
    val.value = 8
    observer.callCount.should.equal(1)
  })

  it("should be usable as primitive value", () => {
    const val = ObservableFactory("test", 42)
    ;(+val + 5).should.equal(47)
  })

  describe("as object properties", () => {
    it("can be added to objects", () => {
      const obj = {} as { test: number }
      addObservableProperty(obj, "test", Subject("test-subject"), 42)
      obj.test.should.equal(42)
    })

    it("should send notifications when value is modified", () => {
      const subject = Subject("test-subject")
      const obj = {} as { test: number }
      addObservableProperty(obj, "test", subject, 42)
      const spy = Sinon.spy()
      subject.registerObserver(spy)
      obj.test = 24
      spy.should.be.calledOnce()
    })
  })
})
