import { Subject } from "../Subject"

export enum DataStorageFormat {
  SingleFile = "SingleFile",
  MultiFile = "MultiFile",
}

export type DataSeries<T> = {
  name: string
  bufferSize: number
  write: (T) => Promise<void>
  type: DataStorageFormat

  // Add the data point so it fits timewise
  add(point: DataPoint<T>): void
  listen(subject: Subject<T>): void
  getValues(): DataPoint<T>[]
  setFormatter(formatter: (T) => string)
  getStrings(): string[]
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
  let formatter = (v: T) => v.toString()

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

  function getStrings(): string[] {
    return getValues().map((v) => `${v.time} ${formatter(v.value)}`)
  }

  function setFormatter(newFormatter?: (T) => string) {
    formatter = newFormatter
  }

  const dataSeries: DataSeries<T> = {
    name,
    getValues,
    add,
    listen,
    getStrings,
    setFormatter,
  }

  return dataSeries
}

export function DataPointFactory<T>(time: number, value: T) {
  return {
    time,
    value,
  }
}
