import "should"
import should from "should"
import DataSeriesFactory, { DataPointFactory } from "./DataSeries"
import RouteFactory, { Route } from "./Route"
import path from "path"

describe("Route", () => {
  let route: Route = null
  let files: [string, string[]][]
  const fileWriter = async (path: string, content: string[]) => {
    files.push([path, content])
    return
  }

  beforeEach(() => {
    route = RouteFactory("Test")
    files = []
  })

  it("should allow creation of a route with a name", () => {
    route.name.should.equal("Test")
    route.start.should.greaterThan(0)
    should.equal(route.end, null)
  })

  it("should allow saving an empty route", () => {
    route.save("dir", fileWriter)
    files.length.should.equal(0)
  })

  it("should allow adding already initialised data series to a route", () => {
    const ds = DataSeriesFactory<string>("a")
    ds.add(DataPointFactory(1, "a"))
    ds.add(DataPointFactory(2, "b"))
    route.add(ds)
    route.get("a").should.equal(ds)
  })

  it("should save data series correctly", () => {
    const ds = DataSeriesFactory<string>("a")
    ds.add(DataPointFactory(1, "a"))
    ds.add(DataPointFactory(2, "b"))
    route.add(ds)
    route.save("dir", fileWriter)
    files[0][0].should.equal(path.join("dir", "a"))
    files[0][1].should.deepEqual(["1 a", "2 b"])
  })

  it("should save mutliple data series correctly", () => {
    const ds = DataSeriesFactory<string>("a")
    ds.add(DataPointFactory(1, "a"))
    ds.add(DataPointFactory(2, "b"))
    const ds2 = DataSeriesFactory<number>("b")
    ds2.add(DataPointFactory(1, "1"))
    ds2.add(DataPointFactory(1, "2"))
    route.add(ds)
    route.add(ds2)
    route.save("dir", fileWriter)
    files[0][0].should.equal(path.join("dir", "a"))
    files[0][1].should.deepEqual(["1 a", "2 b"])
    files[1][0].should.equal(path.join("dir", "b"))
    
  })
})
