import { Subject } from "../lib/Subject"
import { RouteTracker } from "./RouteTracker"

export type Replayer = {
  route: RouteTracker
  getSubjects(): Subject<unknown>[]
  replay(): Promise<void>
  cancel(): void
}
