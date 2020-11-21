export type Trigger = {
  promise: Promise<void>,
  cancel: () => void,
}

const voidFunc = (): void => {
  // do nothing
}

export const emptyTrigger = {
  promise: new Promise(voidFunc) as Promise<void>,
  cancel: voidFunc
}

export function NonCancellableTrigger(func: () => Promise<void>): Trigger {
  return {
    promise: func(),
    cancel: voidFunc
  }
}

export type Listener = (...args: unknown[]) => boolean

export type ListenerList = {
  add: (func: Listener) => Trigger,
  call: (...args: unknown[]) => void,
}

let listenerId = 0

export default function (): ListenerList {
  const list = {} as Record<number, Listener>

  return {    
    add(func: Listener): Trigger {
      const id = ++listenerId
      let cancel = voidFunc
      const promise = Promise.race([
        new Promise(resolve => {
          cancel = resolve
          delete list[id]
        }),
        new Promise(resolve => {
          list[id] = (...args: unknown[]) => {
            const condition = func(...args)
            if (condition) {
              // console.debug(`Listener #${id} triggered`, args.map(a => '' + a))
              delete list[id]
              resolve()
            }
            return condition
          }
        })
      ]) as Promise<void>

      // console.debug(`Creating listener #${id}`)
      return {
        promise,
        cancel
      }    
    },

    call(...args: unknown[]): void {
      Object.values(list).forEach((listener: Listener) => listener(...args))
    }
  }
}

