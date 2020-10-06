import Gpio from 'pigpio'

export type Encoder = {
  no: number,
  get: () => number,
  on(revolution: number): Promise<void>
}

let encoderNo = 1

const QEM = [
  [0, -1, 1, NaN],
  [1, 0, NaN, -1],
  [-1, NaN, 0, 1],
  [NaN, 1, -1, 0],
]

/*
  This class implements a quadrature encoder with two outputs, with a 90° phase shift.
  Specify the GPIO pins where the outputs are connecte too.
*/
export default function (pin_a: number, pin_b: number): Encoder {
  let pos = 0
  let oldVal = 0
  const listeners = {}

  const stream = new Gpio.Notifier({ bits: 1 << pin_a | 1 << pin_b })
  stream.stream().on('data', notification => {
    if (!(notification.flags & Gpio.Notifier.PI_NTFY_FLAGS_ALIVE)) {
      const newVal = ((notification.level >> (pin_a - 1)) & 1) | ((notification.level >> pin_b) & 1)
      const diff = QEM[oldVal][newVal]
      if (diff !== NaN) {
        pos += diff
        if (listeners[pos]) {
          listeners[pos]()
        }
      }
      oldVal = newVal
    }
  })

  return {
    no: encoderNo++,
    
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
    on(tick: number): Promise<void> {
      return new Promise(resolve => {
        listeners[pos + tick] = () => {
          delete listeners[pos + tick]
          resolve()
        }
      })
    }
  }
}
