export type Trigger = {
  promise: Promise<void>,
  cancel: () => void,
}

export type Listener = (...args: unknown[]) => boolean

export type ListenerList = {
  add: (func: Listener) => Trigger,
  call: (...args: unknown[]) => void,
}

export default function (): ListenerList {
  let listenerId = 0
  const list = {} as Record<number, Listener>

  return {    
    add(func: Listener): Trigger {
      const id = ++listenerId

      return {
        promise: new Promise(resolve => {
          list[id] = (...args: unknown[]) => {
            const condition = func(...args)
            if (condition) {
              console.debug(`Listener #${id} triggered`, args)
              delete list[id]
              resolve()
            }
            return condition
          }
        }),
        cancel: () => delete list[id]
      }    
    },

    call(...args: unknown[]): void {
      Object.values(list).forEach((listener: Listener) => listener(...args))
    }
  }
}

