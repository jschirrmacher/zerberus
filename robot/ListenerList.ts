import { CancellableAsync, createCancellableAsync } from "./CancellableAsync"

export type Listener = (...args: unknown[]) => boolean

export type ListenerList = {
  add: (func: Listener) => CancellableAsync,
  remove(id): void,
  call: (...args: unknown[]) => void,
}

let listenerId = 0

export default function (): ListenerList {
  const list = {} as Record<string, { func: Listener, resolve: () => void }>

  function add(func: Listener): CancellableAsync {
    return createCancellableAsync(async () => new Promise(resolve => {
      list[++listenerId] = { func, resolve }
    })).finally(() => remove(listenerId))
  }

  function remove(id: string | number): void {
    delete list[id]
  }

  function call(...args: unknown[]): void {
    Object.keys(list).forEach((id: string) => {
      if (list[id].func(...args)) {
        list[id].resolve()
        remove(id)
      }
    })
  }

  return { add, remove, call }
}

