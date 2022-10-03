export type Observer<T> = (payload: T, subject: Subject<T>) => void

export interface Subject<T> {
  name: string
  registerObserver(observer: Observer<T>): void
  unregisterObserver(observer: Observer<T>): void
  notify(payload: T): void
}

export default function <T>(name: string): Subject<T> {
  let observers = [] as Observer<T>[]
  const subject = {
    name,

    registerObserver(observer: Observer<T>) {
      observers.push(observer)
    },

    unregisterObserver(observer: Observer<T>) {
      observers = observers.filter((o) => o !== observer)
    },

    notify(payload: T) {
      observers.forEach((observer) => observer(payload, subject))
    },
  }

  return subject
}
