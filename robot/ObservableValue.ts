import SubjectFactory, { Subject } from "./Subject"

export type ObservableValue<T> = Subject<T> & {
  set(newValue: T): void
  get(): T
  update(func: (current: T) => T)
}

export default function <T>(name: string, value?: T): ObservableValue<T> {
  const subject = SubjectFactory<T>(name)

  return {
    ...subject,

    set(newValue: T) {
      if (value !== newValue) {
        value = newValue
        this.notify(value)
      }
    },

    get() {
      return value
    },

    update(func) {
      this.set(func(value))
    },
  }
}
