import { Subject } from "./Subject"

export type Trigger<T> = {
  completed: string[]
  race(): Promise<string>
  waitFor(subject: Subject<T>, predicate?: Predicate<T>): void
}

type Predicate<T> = (payload: T) => boolean
type ResolveFunc = (value: string | PromiseLike<string>) => void

type Listener<T> = {
  subject: Subject<T>
  resolve: ResolveFunc
  predicate: Predicate<T>
  promise: Promise<string>
}

export async function waitFor<T>(subject: Subject<T>, predicate: Predicate<T> = () => true): Promise<void> {
  const trigger = TriggerFactory<T>()
  trigger.waitFor(subject, predicate)
  await trigger.race()
}

export default function TriggerFactory<T>(): Trigger<T> {
  const completed = [] as string[]

  function handle(payload: T, subject: Subject<T>): void {
    listeners.forEach((listener) => {
      if (listener.subject.name == subject.name && listener.predicate(payload)) {
        listener.resolve(subject.name)
        if (!completed.includes(subject.name)) {
          completed.push(subject.name)
        }
      }
    })
  }

  async function race() {
    if (listeners.length == 0) {
      return ""
    }
    await Promise.race(listeners.map((listener) => listener.promise))
    listeners.forEach((l) => l.subject.unregisterObserver(handle))
    return completed[0]
  }

  function waitFor(subject: Subject<T>, predicate: Predicate<T> = () => true) {
    let resolve: ResolveFunc
    const promise = new Promise<string>((res) => (resolve = res))
    subject.registerObserver(handle)
    listeners.push({ subject, predicate, resolve, promise })
  }

  const listeners: Listener<T>[] = []

  return { race, waitFor, completed }
}
