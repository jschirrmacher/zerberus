import "should"
import should from "should"
import DataSeriesFactory, { DataPointFactory, fromStrings } from "./DataSeries"

describe("DataPoint", () => {
  it("should store values passed to it", () => {
    const pt = DataPointFactory(1, 10)
    pt.time.should.be.equal(1)
    pt.value.should.be.equal(10)
  })
})

describe("DataSeries", () => {
  it("should initialise correctly", () => {
    const ds = DataSeriesFactory("Test1")
    ds.name.should.equal("Test1")
    ds.getValues().length.should.be.equal(0)
  })

  it("should not allow null values", () => {
    const ds = DataSeriesFactory("Test1")
    ;(() => ds.add(DataPointFactory(1, null))).should.throw()
  })

  it("should correctly add values", () => {
    const ds = DataSeriesFactory<number>("DS")
    ds.add(DataPointFactory(10, 5))
    ds.getValues().length.should.be.equal(1)
    ds.getValues()[0].value.should.be.equal(5)
    ds.add(DataPointFactory(1, 1))
    ds.add(DataPointFactory(12, 0))
    ds.getValues().length.should.be.equal(3)
    ds.getValues().should.be.deepEqual([DataPointFactory(1, 1), DataPointFactory(10, 5), DataPointFactory(12, 0)])
  })

  it("should allow loading from a string list", () => {
    const strings = ["0 10", "1 -1", "2 20"]
    const ds = fromStrings("integers", strings, (v) => Number.parseInt(v))
    ds.name.should.equal("integers")
    ds.getValues().length.should.equal(3)
    ds.getValues().should.deepEqual([
      DataPointFactory<number>(0, 10),
      DataPointFactory<number>(1, -1),
      DataPointFactory<number>(2, 20),
    ])
  })

  it("should save correctly to strings", () => {
    const ds = DataSeriesFactory<number>("DS")
    ds.add(DataPointFactory(10, 5))
    ds.add(DataPointFactory(11, 20))
    ds.getStrings().should.deepEqual(["10 5", "11 20"])
  })

  it("should save correct to strings using custom transformer", () => {
    const ds = DataSeriesFactory<number>("DS")
    ds.add(DataPointFactory(10, 5))
    ds.add(DataPointFactory(11, 20))
    ds.getStrings((v) => "a").should.deepEqual(["10 a", "11 a"])
  })
})
