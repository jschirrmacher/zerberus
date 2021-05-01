import { Type } from "typescript"
import { Observer, Subject } from "../Subject"
import DataSeriesFactory, { DataPointFactory, DataSeries, fromStrings } from "./DataSeries"
import path from "path"

export type Route = {
  name: string
  start: number
  end: number
  currentTime: () => number

  add<T>(series: DataSeries<T>): void
  track<T>(subject: Subject<T>): void
  save(dirPath: string, fileWriter: (path: string, content: string[]) => Promise<void>): Promise<void[]>
  load(
    dirPath: string,
    loaders: Loader<unknown>[],
    getFile: (path: string) => string[],
    getFiles: (path: string) => string[]
  ): void
  get<T>(name: string): DataSeries<T>
  endRecording(): void
}

type SubjectWatcher = {
  subject: Subject<unknown>
  observer: Observer<unknown>
}

export type Loader<T> = {
  supports(value: string): boolean
  load(value: string): T
}

export default function RouteFactory(name: string, getTime?: () => number): Route {
  const series: DataSeries<unknown>[] = []
  const subjectHandlers: SubjectWatcher[] = []
  const formatters: { type: Type; formatter: (content: unknown) => string }[] = []

  getTime = getTime || (() => Date.now())
  let currentTime: number = getTime()
  const start = currentTime
  let end = null

  function endRecording() {
    end = currentTime
    subjectHandlers.forEach((s) => s.subject.unregisterObserver(s.observer))
  }

  function add<T>(s: DataSeries<T>) {
    if (end != null) {
      throw new Error("Cant add a data series to an ended route")
    }
    series.push(s)
  }

  function track<T>(subject: Subject<T>, formatter?: (T) => string) {
    const s = DataSeriesFactory<T>(subject.name)
    if (formatter) {
      s.setFormatter(formatter)
    }
    const handler = {
      subject: subject,
      observer: (val: T) => {
        currentTime = getTime()
        s.add(DataPointFactory(currentTime, val))
      },
    }
    subjectHandlers.push(handler)
    series.push(s)
  }

  function save(dirPath: string, fileWriter: (path: string, content: string[]) => Promise<void>): Promise<void[]> {
    return Promise.all(series.map((s) => fileWriter(path.join(name, dirPath, s.name), s.getStrings())))
  }

  function findLoader(example: string, loaders: Loader<any>[]): Loader<any> {
    return loaders.filter((l) => l.supports(example))[0]
  }

  function load(
    dirPath: string,
    loaders: Loader<unknown>[],
    getFile: (path: string) => string[],
    getFiles: (path: string) => string[]
  ) {
    const files = getFiles(path.join(dirPath, name))
    files.forEach((f) => {
      const lines = getFile(f)
      series.push(fromStrings(f, lines, findLoader(lines[0], loaders).load))
    })
  }

  function get<T>(name: string): DataSeries<T> {
    return <DataSeries<T>>series.filter((s) => s.name === name)[0]
  }

  const route: Route = {
    name,
    start,
    end,
    currentTime: () => currentTime,
    add,
    track,
    endRecording,
    save,
    load,
    get,
  }

  return route
}
