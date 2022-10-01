import SubjectFactory, { Observer, Subject } from "../lib/Subject"

export type DataPoint = {
  time: number
  type: DataType
  value?: unknown
}

export type RouteTracker = {
  name: string
  start: number
  end?: number

  track<T>(trackedSubject: Subject<T>, type: DataType, mapper: (value: T) => unknown): void
  endRecording(): void
} & Subject<DataPoint>

type SubjectWatcher = {
  subject: Subject<unknown>
  observer: Observer<unknown>
}

export enum DataType {
  CAR_POSITION = 1,
  CAR_ORIENTATION = 2,
  CAR_STATUS = 3,
  ENCODER_LEFT = 4,
  ENCODER_RIGHT = 5,
  MPU_ACCEL = 6,
  MPU_GYRO = 7,
  ROUTE_END = 999,
}

export default function RouteTrackerFactory(name: string, getTime = () => Date.now()) {
  const subject = SubjectFactory(name)
  const subjectHandlers: SubjectWatcher[] = []
  const start = getTime()
  let end: number | undefined

  function endRecording() {
    end = getTime()
    subjectHandlers.forEach((s) => s.subject.unregisterObserver(s.observer))
    subject.notify({ time: end - start, type: DataType.ROUTE_END })
  }

  function track<T>(trackedSubject: Subject<T>, type: DataType, mapper: (value: T) => unknown) {
    const handler = {
      subject,
      observer: (value: T) => {
        subject.notify({ time: getTime() - start, type, value: mapper(value) })
      },
    }
    trackedSubject.registerObserver(handler.observer)
    subjectHandlers.push(handler as SubjectWatcher)
  }

  return {
    ...subject,
    name,
    start,
    end,
    endRecording,
    track,
  } as RouteTracker
}
