import "should"
import DataSeriesFactory, { DataPointFactory } from "./DataSeries"

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
})
