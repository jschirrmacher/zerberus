import 'should'
import * as Orientation from './Orientation'

const halfPi = Math.PI / 2
const threeQuartersPI = 3 / 4 * Math.PI

describe('Orientation', () => {
  it('should calculate a difference', () => {
    Orientation.create(0).differenceTo(Orientation.create(halfPi)).should.equal(halfPi)
  })

  it('should return 0 if angles are the same', () => {
    Orientation.create(halfPi).differenceTo(Orientation.create(halfPi)).should.equal(0)
  })

  it('should swap around after substracting from a negative angle', () => {
    Orientation.create(-threeQuartersPI).differenceTo(Orientation.create(halfPi)).should.equal(-threeQuartersPI)
  })

  it('should normalize angles which are out of bounds', () => {
    Orientation.create(3 * Math.PI).angle.should.equal(Math.PI)
    Orientation.create(-3 * Math.PI).angle.should.equal(Math.PI)
  })

  it('should normalize angles between ±PI', () => {
    Orientation.create(halfPi).angle.should.equal(halfPi)
    Orientation.create(-halfPi).angle.should.equal(-halfPi)
  })

  it('should convert to degrees', () => {
    Orientation.create(Math.PI).degreeAngle().should.equal(180)
    Orientation.create(-Math.PI).degreeAngle().should.equal(180)
    Orientation.create(-halfPi).degreeAngle().should.equal(-90)
  })

  it('should be convertable to a string', () => {
    Orientation.create(halfPi).toString().should.equal('90.0°')
    Orientation.create(-halfPi).toString().should.equal('-90.0°')
  })
})
