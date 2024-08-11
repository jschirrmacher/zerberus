import SubjectFactory, { type Subject } from "./Subject"

export type ObservableValue<T> = Subject<T> & {
  value: T
  valueOf(): T
  toString(): string
}

export default function ObservableFactory<T>(name: string, value: T) {
  const subject = SubjectFactory<T>(name)
  return createObservable(subject, value)
}

export function createObservable<T>(subject: Subject<T>, value: T) {
  return {
    ...subject,

    set value(newValue: T) {
      if (value !== newValue) {
        value = newValue
        subject.notify(value)
      }
    },

    get value() {
      return value
    },

    toString() {
      return "" + value
    },

    valueOf() {
      return value
    },
  }
}

export function addObservableProperty<T>(object: object, propertyName: string, subject: Subject<T>, initialValue: T) {
  const observable = createObservable(subject, initialValue)

  Object.defineProperty(object, propertyName, {
    get() {
      return observable.value
    },

    set(value: T) {
      observable.value = value
    },
  })
}
