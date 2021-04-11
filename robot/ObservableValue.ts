import SubjectFactory, { Subject, Observer } from "./Subject"

export type ObservableValue<T> = Subject<T> & {
  value: T
  valueOf(): T
  toString(): string
}

export default function <T>(name: string, value: T): ObservableValue<T> {
  const subject = SubjectFactory<T>(name)

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
