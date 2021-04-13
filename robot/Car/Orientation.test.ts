import "should"
import * as Orientation from "./Orientation"
import { fromDegrees } from "./Orientation"

const halfPi = Math.PI / 2
const threeQuartersPI = (3 / 4) * Math.PI

describe("Orientation", () => {
  it("should calculate a difference", () => {
    Orientation.create(0).differenceTo(Orientation.create(halfPi)).angle.should.equal(halfPi)
  })

  it("should return 0 if angles are the same", () => {
    Orientation.create(halfPi).differenceTo(Orientation.create(halfPi)).angle.should.equal(0)
  })

  it("should swap around after substracting from a negative angle", () => {
    Orientation.create(-threeQuartersPI).differenceTo(Orientation.create(halfPi)).angle.should.equal(-threeQuartersPI)
  })

  it("should normalize angles which are out of bounds", () => {
    Orientation.create(3 * Math.PI).angle.should.equal(Math.PI)
    Orientation.create(-3 * Math.PI).angle.should.equal(Math.PI)
  })

  it("should normalize angles between ±PI", () => {
    Orientation.create(halfPi).angle.should.equal(halfPi)
    Orientation.create(-halfPi).angle.should.equal(-halfPi)
  })

  it("should convert to degrees", () => {
    Orientation.create(Math.PI).degreeAngle().should.equal(180)
    Orientation.create(-Math.PI).degreeAngle().should.equal(180)
    Orientation.create(-halfPi).degreeAngle().should.equal(-90)
  })

  it("should add two angles", () => {
    Orientation.create(Math.PI)
      .add(Orientation.create((3 / 2) * Math.PI))
      .angle.should.equal(halfPi)
  })

  it("should be convertable to a string", () => {
    Orientation.create(halfPi).toString().should.equal("90.0°")
    Orientation.create(-halfPi).toString().should.equal("-90.0°")
  })

  it("should identify close orientations", () => {
    fromDegrees(10).isCloseTo(fromDegrees(10), fromDegrees(0)).should.be.true()
    fromDegrees(10).isCloseTo(fromDegrees(9), fromDegrees(1)).should.be.true()
    fromDegrees(10).isCloseTo(fromDegrees(9), fromDegrees(5)).should.be.true()
    fromDegrees(10).isCloseTo(fromDegrees(9), fromDegrees(0)).should.be.false()
  })

  it("should accurately create orientations from degress", () => {
    fromDegrees(180).angle.should.equal(Orientation.fromRadian(Math.PI).angle)
    fromDegrees(90).angle.should.equal(Orientation.fromRadian(0.5 * Math.PI).angle)
    fromDegrees(-90).angle.should.equal(Orientation.fromRadian(-0.5 * Math.PI).angle)
  })
})
