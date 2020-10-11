import stream from 'stream'
const Gpio = require('../gpio')

export type Trigger = {
  promise: Promise<void>,
  cancel: () => void,
}

export type Encoder = {
  no: number,
  simulated: boolean,
  get: () => number,
  on(revolution: number): Trigger,
  simulate: (diff: number) => void,
}

let encoderNo = 1

const QEM = [
  [0, -1, 1, NaN],
  [1, 0, NaN, -1],
  [-1, NaN, 0, 1],
  [NaN, 1, -1, 0],
]

class NotificationTransformer extends stream.Transform {
  writableObjectMode: true
  
  _transform(chunk: Buffer, enc: string, next: () => void) {
    do {
      if (!(chunk.readUInt16LE(2) & Gpio.Notifier.PI_NTFY_FLAGS_ALIVE)) {
        this.push({
          tick: chunk.readUInt32LE(4),
          level: chunk.readUInt32LE(8)
        })
      }
    } while (chunk = chunk.slice(0, 12))
    next()
  }
}

/*
  This class implements a quadrature encoder with two outputs, with a 90° phase shift.
  Specify the GPIO pins where the outputs are connecte too.
*/
export default function (pin_a: number, pin_b: number): Encoder {
  let pos = 0
  let oldVal = 0
  const listeners = {}
  const transformer = new NotificationTransformer()

  new Gpio(pin_a, { mode: Gpio.INPUT })
  new Gpio(pin_b, { mode: Gpio.INPUT })
  const stream = new Gpio.Notifier({ bits: 1 << pin_a | 1 << pin_b })
  stream.stream().pipe(transformer).on('data', (notification: { level: number, tick: number }) => {
    const newVal = ((notification.level >> (pin_a - 1)) & 1) | ((notification.level >> pin_b) & 1)
    const diff = QEM[oldVal][newVal]
    if (diff !== NaN) {
      pos += diff
      if (listeners[pos]) {
        listeners[pos]()
      }
    }
    oldVal = newVal
  })

  return {
    no: encoderNo++,
    simulated: stream.simulated,
    
    /*
      Get current position of encoder since it was created.
    */
    get() {
      return pos
    },

    /*
      Returns a promise that is resolved as soon as the encoder reaches the given tick.
      Ticks may be positive or negative, each specifying the number relative to the current
      position, thus allowing to run until the required distance from the current position
      is reached, either forward or backwards.
    */
    on(tick: number): Trigger {
      const triggerTime = Math.round(pos + tick)
      const encNo = this.no
      console.debug(`Setting up encoder #${encNo} trigger @${pos} to @${triggerTime}`)
      return {
        promise: new Promise(resolve => {
          listeners[triggerTime] = function() {
            console.debug(`Triggered encoder #${encNo} listener @${triggerTime} at ${pos}`)
            delete listeners[triggerTime]
            resolve()
          }
        }),
        cancel: () => delete listeners[triggerTime]
      }
    },

    /*
      Simulate a number of encoder ticks
    */
    simulate(diff: number) {
      const between = (a: number, b: number) => (val: string): boolean => (+val > a && +val <= b) || (+val < a && +val >= b)
      const relevantListenersFilter = between(pos, pos += diff)
      console.debug(`Simulated ${diff} ticks on encoder #${this.no} at position ${pos}`)
      Object.keys(listeners)
        .filter(relevantListenersFilter)
        .forEach(val => listeners[val]())
    }
  }
}
