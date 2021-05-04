import { Subject } from "../Subject"
import { RouteTracker } from "./RouteTracker"

export type Replayer = {
  route: RouteTracker
  getSubjects(): Subject<unknown>[]
  replay(): Promise<void>
  cancel(): void
}
