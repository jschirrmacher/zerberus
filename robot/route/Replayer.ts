import { Subject } from "../Subject"
import { Route } from "./Route"

export type Replayer = {
  route: Route
  getSubjects(): Subject<unknown>[]
  replay(): Promise<void>
  cancel(): void
}
