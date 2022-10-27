import expect from "expect"
import Subject from "./Subject"
import Trigger, { waitFor } from "./Trigger"
import { spy } from "sinon"

describe("Trigger", () => {
  it("should be completed if empty", async () => {
    const empty = Trigger<number>()
    expect(await empty.race()).toEqual("")
  })

  it("should wait for the event to occur", async () => {
    const trigger = Trigger()
    const subjectA = Subject("A")
    trigger.waitFor(subjectA)
    subjectA.notify("a")
    expect(await trigger.race()).toEqual("A")
  })

  it("should require event to be triggered", async () => {
    const trigger = Trigger()
    const subjectA = Subject("A")
    trigger.waitFor(subjectA)
    const result = await Promise.race([trigger.race(), Promise.resolve("B")])
    expect(result).toEqual("B")
  })

  it("should not resolve if predicate is false", async () => {
    const trigger = Trigger()
    const subjectA = Subject("A")
    trigger.waitFor(subjectA, () => false)
    subjectA.notify("a")
    const result = await Promise.race([trigger.race(), Promise.resolve("B")])
    expect(result).toEqual("B")
  })

  it("should wait for the correct event to trigger before returning", async () => {
    const trigger = Trigger()
    const subjectA = Subject("A")
    const subjectB = Subject("B")
    trigger.waitFor(subjectA, (x) => x === 10)
    trigger.waitFor(subjectB, (x) => x === 5)
    subjectA.notify(5)
    subjectB.notify(10)
    subjectB.notify(5)
    subjectA.notify(10)
    expect(await trigger.race()).toEqual("B")
  })

  it("should unregister itself from all subjects", async () => {
    const spyA = spy()
    const spyB = spy()
    const trigger = Trigger()
    const subjectA = Subject("A")
    subjectA.unregisterObserver = spyA
    const subjectB = Subject("B")
    subjectB.unregisterObserver = spyB
    trigger.waitFor(subjectA, () => false)
    trigger.waitFor(subjectB)
    subjectA.notify(1)
    expect(spyA.callCount).toEqual(0)
    expect(spyB.callCount).toEqual(0)
    subjectB.notify(1)
    expect(spyA.callCount).toEqual(0)
    expect(spyB.callCount).toEqual(0)
    await trigger.race()
    expect(spyA.callCount).toEqual(1)
    expect(spyB.callCount).toEqual(1)
  })

  it("should allow simple creation of triggers for single subject", async () => {
    const subjectA = Subject("A")
    setTimeout(() => subjectA.notify("A"), 100)
    await waitFor(subjectA)
  })

  it("should add the completed subject names to the list", async () => {
    const trigger = Trigger<number>()
    const subjectA = Subject<number>("A")
    const subjectB = Subject<number>("B")
    trigger.waitFor(subjectA, () => true)
    trigger.waitFor(subjectA, (x) => x == 3)
    trigger.waitFor(subjectB, (x) => x === 2)
    expect(trigger.completed).toEqual([])
    subjectA.notify(5)
    expect(trigger.completed).toEqual(["A"])
    subjectA.notify(3)
    expect(trigger.completed).toEqual(["A"])
    subjectB.notify(3)
    expect(trigger.completed).toEqual(["A"])
    subjectB.notify(2)
    expect(trigger.completed).toEqual(["A", "B"])
  })
})
