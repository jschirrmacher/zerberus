import expect from "expect"
import * as Position from "./Position"

describe("Position", () => {
  const origin = Position.create(0, 0)

  it("can be concatenated with a string", () => {
    expect("" + Position.create(4, 4)).toEqual("(4, 4)")
  })

  it("should compute ticks from meters, with 1 revoltion of a 12cm wheel is 544 ticks", () => {
    const pos = Position.meters(0.12 * Math.PI)
    expect(pos).toEqual(544)
  })

  it("should calculate the distance to another position", () => {
    const distance = origin.distanceTo(Position.create(4, 4))
    expect(distance).toEqual(Math.sqrt(32))
  })

  it("should add values to the current position", () => {
    const { x, y } = Position.create(7, 2).add(3, -5)
    expect(x).toEqual(10)
    expect(y).toEqual(-3)
  })

  describe("angle calculation", () => {
    it("should calculate the angle to another position", () => {
      expect(origin.angleTo(Position.create(4, 4))).toEqual(-Math.PI / 4)
    })

    it("should return -3/4 PI when going to upper left", () => {
      expect(origin.angleTo(Position.create(-4, 4))).toEqual((-3 / 4) * Math.PI)
    })

    it("should return positive values for dY < 0", () => {
      expect(origin.angleTo(Position.create(4, -4))).toEqual(Math.PI / 4)
    })

    it("should return 0 when going right", () => {
      expect(origin.angleTo(Position.create(4, 0)) === 0).toBe(true)
    })

    it("should return -PI when going left", () => {
      expect(origin.angleTo(Position.create(-4, 0))).toEqual(-Math.PI)
    })

    it("should return 0 when point is at origin", () => {
      expect(origin.angleTo(Position.create(0, 0)) === 0).toBe(true)
    })

    it("horizontal lines from minus to plus should have an angle of 0", () => {
      expect(Position.create(-4, 4).angleTo(Position.create(4, 4)) === 0).toBe(true)
    })

    it("vertical lines from minus to plus should have an angle of -PI / 2", () => {
      expect(Position.create(4, -4).angleTo(Position.create(4, 4))).toEqual(-Math.PI / 2)
    })

    it("vertical lines from plus to minus should have an angle of PI / 2", () => {
      expect(Position.create(4, 4).angleTo(Position.create(4, -4))).toEqual(Math.PI / 2)
    })

    it("should return 3 / 4 * PI for dX < 0 && dY < 0", () => {
      expect(origin.angleTo(Position.create(-4, -4))).toEqual((Math.PI * 3) / 4)
    })
  })
})
