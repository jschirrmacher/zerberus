import 'should'
import * as Orientation from './Orientation'

const halfPi = Math.PI / 2
const threeQuartersPI = 3 / 4 * Math.PI

describe('Orientation', () => {
  it('should calculate a difference', () => {
    Orientation.create(0).differenceTo(Orientation.create(halfPi)).should.equal(-halfPi)
  })

  it('should return 0 if angles are the same', () => {
    Orientation.create(halfPi).differenceTo(Orientation.create(halfPi)).should.equal(0)
  })

  it('should return swap around after substracting from a negative angle', () => {
    Orientation.create(-threeQuartersPI).differenceTo(Orientation.create(halfPi)).should.equal(threeQuartersPI)
  })
})
