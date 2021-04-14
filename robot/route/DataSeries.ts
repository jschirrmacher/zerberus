import { Subject } from "../Subject"

export type DataSeries<T> = {
  name: string

  // Add the data point so it fits timewise
  add(point: DataPoint<T>): void
  listen(subject: Subject<T>): void
  getValues(): DataPoint<T>[]
}

export type DataPoint<T> = {
  time: number
  value: T
}

export default function DataSeriesFactory<T>(name: string, time: () => number = null): DataSeries<T> {
  let values: DataPoint<T>[] = []

  function add(point: DataPoint<T>) {
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

  const dataSeries: DataSeries<T> = {
    name,
    getValues,
    add,
    listen,
  }

  return dataSeries
}

export function DataPointFactory<T>(time: number, value: T) {
  return {
    time,
    value,
  }
}
