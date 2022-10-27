import expect from "expect"
import { make3dCoord } from "./ThreeDeeCoord"

describe("ThreeDeeCoords", () => {
  describe("construcor", () => {
    it("should use default values", () => {
      expect(make3dCoord()).toMatchObject({ x: 0, y: 0, z: 0 })
    })

    it("should take given values", () => {
      expect(make3dCoord(1, 2, 3)).toMatchObject({ x: 1, y: 2, z: 3 })
    })
  })

  describe("add() function", () => {
    it("should add each coordinate", () => {
      expect(make3dCoord(1, 2, 3).add(make3dCoord(4, 5, 6))).toMatchObject({ x: 5, y: 7, z: 9 })
    })
  })

  describe("sub() function", () => {
    it("should suctract another coordinate", () => {
      expect(make3dCoord(7, 8, 9).sub(make3dCoord(4, 5, 6))).toMatchObject({ x: 3, y: 3, z: 3 })
    })
  })

  describe("toString() function", () => {
    it("should return a string", () => {
      expect(typeof make3dCoord().toString(2)).toEqual("string")
    })

    it("should format each coordinate with the given amount of digits", () => {
      expect(make3dCoord(1.23, 2.3456, 3).toString(3)).toEqual("1.230,2.346,3.000")
    })

    it("should use all available digits if no number of digits is specified", () => {
      expect(make3dCoord(1.23, 2.3456, 3).toString()).toEqual("1.23,2.3456,3")
    })
  })
})
