import expect from "expect"
import * as Orientation from "./Orientation"
import { fromDegrees } from "./Orientation"

const halfPi = Math.PI / 2
const threeQuartersPI = (3 / 4) * Math.PI
const threeHalvesPI = (3 / 2) * Math.PI

describe("Orientation", () => {
  it("should calculate a difference", () => {
    expect(Orientation.create(0).differenceTo(Orientation.create(halfPi)).angle).toEqual(halfPi)
  })

  it("should return 0 if angles are the same", () => {
    expect(Orientation.create(halfPi).differenceTo(Orientation.create(halfPi)).angle).toEqual(0)
  })

  it("should swap around after substracting from a negative angle", () => {
    expect(Orientation.create(-threeQuartersPI).differenceTo(Orientation.create(halfPi)).angle).toEqual(
      -threeQuartersPI
    )
  })

  it("should not normalize angles", () => {
    expect(Orientation.create(threeHalvesPI).angle).toEqual(threeHalvesPI)
    expect(Orientation.create(2 * Math.PI).angle).toEqual(2 * Math.PI)
    expect(Orientation.create(-halfPi).angle).toEqual(-halfPi)
  })

  it("should convert to degrees", () => {
    expect(Orientation.create(Math.PI).degreeAngle()).toEqual(180)
    expect(Orientation.create(-Math.PI).degreeAngle()).toEqual(180)
    expect(Orientation.create(-halfPi).degreeAngle()).toEqual(-90)
  })

  it("should add two angles", () => {
    expect(Orientation.create(Math.PI).add(Orientation.create(threeHalvesPI)).angle).toEqual(halfPi)
  })

  it("should be convertible to a string", () => {
    expect(Orientation.create(halfPi).toString()).toEqual("90.0°")
    expect(Orientation.create(-halfPi).toString()).toEqual("-90.0°")
  })

  it("should be coercible", () => {
    expect(+Orientation.create(halfPi)).toEqual(90)
    expect(+Orientation.create(-halfPi)).toEqual(-90)
    expect(`${Orientation.create(threeQuartersPI)}`).toEqual("135.0°")
    expect("" + Orientation.create(-halfPi)).toEqual("-90.0°")
  })

  it("should normalize the angle if it is coerced", () => {
    expect(+Orientation.create(3 * Math.PI)).toEqual(180)
    expect(`${Orientation.create(threeHalvesPI)}`).toEqual("-90.0°")
  })

  it("should identify close orientations", () => {
    expect(fromDegrees(10).isCloseTo(fromDegrees(10), fromDegrees(0))).toBe(true)
    expect(fromDegrees(10).isCloseTo(fromDegrees(9), fromDegrees(1))).toBe(true)
    expect(fromDegrees(10).isCloseTo(fromDegrees(9), fromDegrees(5))).toBe(true)
    expect(fromDegrees(10).isCloseTo(fromDegrees(9), fromDegrees(0))).toBe(false)
  })

  it("should accurately create orientations from degress", () => {
    expect(fromDegrees(180).angle).toEqual(Orientation.fromRadian(Math.PI).angle)
    expect(fromDegrees(90).angle).toEqual(Orientation.fromRadian(0.5 * Math.PI).angle)
    expect(fromDegrees(-90).angle).toEqual(Orientation.fromRadian(-0.5 * Math.PI).angle)
  })
})
