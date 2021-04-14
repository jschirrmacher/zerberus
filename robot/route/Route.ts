import { Subject } from "../Subject"
import { DataSeries } from "./DataSeries"

export type Route = {
  name: string
  start: Date
  end: Date
  currentTime: () => number

  add<T>(series: DataSeries<T>): void
  track<T>(subject: Subject<T>): void
  save(): Promise<void>
  load(name: string)
}
