import "should"
import { make3dCoord } from "./ThreeDeeCoord"

describe("ThreeDeeCoords", () => {
  describe("construcor", () => {
    it("should use default values", () => {
      make3dCoord().should.containDeep({ x: 0, y: 0, z: 0 })
    })

    it("should take given values", () => {
      make3dCoord(1, 2, 3).should.containDeep({ x: 1, y: 2, z: 3 })
    })
  })

  describe("add() function", () => {
    it("should add each coordinate", () => {
      make3dCoord(1, 2, 3).add(make3dCoord(4, 5, 6)).should.containDeep({ x: 5, y: 7, z: 9 })
    })
  })

  describe("toString() function", () => {
    it("should return a string", () => {
      make3dCoord().toString(2).should.be.a.String()
    })

    it("should format each coordinate with the given amount of digits", () => {
      make3dCoord(1.23, 2.3456, 3).toString(3).should.equal("1.230,2.346,3.000")
    })

    it("should use all available digits if no number of digits is specified", () => {
      make3dCoord(1.23, 2.3456, 3).toString().should.equal("1.23,2.3456,3")
    })
  })
})
