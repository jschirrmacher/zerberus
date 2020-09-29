import motor from './motor'
const Gpio = require('../gpio')

// const led = new Gpio(19, {mode: Gpio.OUTPUT})

// let value = 0
// setInterval(() => {
//   led.write(value)
//   value = 1 - value
// }, 500)

const motor1 = motor(2, 3, 4)
const motor2 = motor(17, 27, 22)

async function wait(millseconds: number) {
  return new Promise(resolve => setTimeout(resolve, millseconds))
}

(async () => {
  motor1.accelerate(10)
  await wait(1000)
  motor1.accelerate(0)
  motor1.stop()
})()

// setInterval(async () => {
//   motor1.accelerate(100)
//   await wait(1000)
//   motor2.accelerate(50)
//   await wait(1000)
//   motor1.float()
//   motor2.float()
//   await wait(1000)
//   motor1.accelerate(-50)
//   motor2.accelerate(-100)
//   await wait(1000)
//   motor2.stop()
//   await wait(1000)
//   motor1.stop()
// }, 6000)
