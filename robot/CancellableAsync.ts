export type CancellableAsync = {
  completed: Promise<unknown>,
  cancel: () => void,
  finally: (func: () => void) => CancellableAsync,
}

const voidFunc = (): void => {
  // do nothing
}

export const resolvedCancellableAsync = {
  completed: Promise.resolve(),
  cancel: voidFunc,
  finally: (func: () => void): CancellableAsync => {
    func()
    return resolvedCancellableAsync
  }
}

export function createCancellableAsync(func: () => Promise<unknown>): CancellableAsync {
  let cancel = voidFunc
  const finallyFuncs: Array<() => void> = []
  function createFinally(resolve: (value?: unknown) => void): () => void {
    return () => {
      finallyFuncs.forEach(f => f())
      finallyFuncs.length = 0
      resolve()
    }
  }
  const completed = Promise.race([
    new Promise(resolve => cancel = createFinally(resolve)),
    new Promise(resolve => func().finally(createFinally(resolve)))
  ])

  const result = {
    completed,
    cancel,
    finally: (func: () => void): CancellableAsync => {
      finallyFuncs.push(func)
      return result
    }
  }

  return result
}
