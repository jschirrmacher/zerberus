import { Subject } from "../Subject"

export type DataSeries<T> = {
  name: string

  // Add the data point so it fits timewise
  add(point: DataPoint<T>): void
  listen(subject: Subject<T>): void
  getValues(): DataPoint<T>[]
  getStrings(formatter?: (T) => string): string[]
}

export function fromStrings<T>(name: string, raw: string[], transformation: (string) => T): DataSeries<T> {
  const series = DataSeriesFactory<T>(name)
  raw.forEach((r) => {
    const parts = r.split(" ", 2)
    const time = Number.parseFloat(parts[0])
    const value = transformation(parts[1])
    series.add(DataPointFactory(time, value))
  })
  return series
}

export type DataPoint<T> = {
  time: number
  value: T
}

export default function DataSeriesFactory<T>(name: string, time: () => number = null): DataSeries<T> {
  let values: DataPoint<T>[] = []

  function add(point: DataPoint<T>) {
    if (point.value == null) {
      throw new Error("Tried to add a null value")
    }
    values.push(point)
  }

  function listen(subject: Subject<T>) {
    if (time == null) {
      throw new Error("Can't listen if the DataSeries has no function to get time")
    }
    subject.registerObserver((val) => add(DataPointFactory(time(), val)))
  }

  function comparePoints(a: DataPoint<T>, b: DataPoint<T>): number {
    if (a.time < b.time) {
      return -1
    } else if (a.time == b.time) {
      return 0
    }
    return 1
  }

  function getValues(): DataPoint<T>[] {
    values = values.sort(comparePoints)
    return values
  }

  function getStrings(formatter?: (T) => string): string[] {
    formatter = formatter || ((v: T) => v.toString())
    return getValues().map((v) => `${v.time} ${formatter(v.value)}`)
  }

  const dataSeries: DataSeries<T> = {
    name,
    getValues,
    add,
    listen,
    getStrings,
  }

  return dataSeries
}

export function DataPointFactory<T>(time: number, value: T) {
  return {
    time,
    value,
  }
}
