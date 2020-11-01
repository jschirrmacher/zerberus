export type Trigger = {
  promise: Promise<void>,
  cancel: () => void,
}

export const emptyTrigger = {
  promise: new Promise(() => {}) as Promise<void>,
  cancel: () => {}
}

export function NonCancellableTrigger(func: () => unknown): Trigger {
  return {
    promise: new Promise(async resolve => {
      await func()
      resolve()
    }),
    cancel: () => {}
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

      console.debug(`Creating listener #${id}`)
      return {
        promise: new Promise(resolve => {
          list[id] = (...args: unknown[]) => {
            const condition = func(...args)
            if (condition) {
              console.debug(`Listener #${id} triggered`, args.map(a => '' + a))
              delete list[id]
              resolve()
            }
            return condition
          }
        }),

        cancel: () => {
          console.debug(`Listener #${id} cancelled`)
          delete list[id]
        }
      }    
    },

    call(...args: unknown[]): void {
      Object.values(list).forEach((listener: Listener) => listener(...args))
    }
  }
}

