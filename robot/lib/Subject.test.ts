import "should"
import Subject from "./Subject"

describe("Subject", () => {
  it("should notify registered observer", () => {
    const subject = Subject<{ value: number }>("A")
    let c = 0
    const observer = () => c++
    subject.registerObserver(observer)
    subject.notify({ value: 42 })
    c.should.equal(1)
  })

  it("should not notify an unregistered observer", async () => {
    const subject = Subject<{ value: number }>("A")
    let c = 0
    const observer = () => c++

    subject.registerObserver(observer)
    subject.unregisterObserver(observer)
    subject.notify({ value: 42 })
    c.should.equal(0)
  })
})
