import ListenerList from "./ListenerList"

describe('ListenerList', () => {
  it('should allow to add a listener', () => {
    const list = ListenerList()
    list.add(() => true)
  })

  it('should notify listeners', () => {
    const list = ListenerList()
    let notified = false
    list.add(() => notified = true)
    list.call()
    notified.should.be.true()
  })

  it('should propagate call parameters to listeners', () => {
    const list = ListenerList()
    list.add((param) => {
      param.should.equal(42)
      return true
    })
    list.call(42)
  })

  it('should be able to be called without listeners', () => {
    const list = ListenerList()
    list.call()
  })

  it('should keep a listener that returns false', () => {
    const list = ListenerList()
    let called = 0
    list.add(() => {
      called++
      return false
    })
    list.call()
    list.call()
    called.should.equal(2)
  })

  it('should remove a listener which returns true', () => {
    const list = ListenerList()
    let called = 0
    list.add(() => {
      called++
      return true
    })
    list.call()
    list.call()
    called.should.equal(1)
  })

  it('should allow the listener to be cancelled', () => {
    const list = ListenerList()
    let called = 0
    const trigger = list.add(() => called++ && false)
    trigger.cancel()
    list.call()
    called.should.equal(0)
  })
})
