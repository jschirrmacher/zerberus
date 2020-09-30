import Motor from './Motor'
import Car from './Car'
const Gpio = require('../gpio')

// const led = new Gpio(19, {mode: Gpio.OUTPUT})

// let value = 0
// setInterval(() => {
//   led.write(value)
//   value = 1 - value
// }, 500)

const motor1 = Motor(2, 3, 4)
const motor2 = Motor(17, 27, 22)
const car = Car(motor1, motor2)

async function wait(millseconds: number) {
  return new Promise(resolve => setTimeout(resolve, millseconds))
}

setInterval(async () => {
  car.accelerate(100)
  await wait(1000)
  car.accelerate(0)
  await wait(1000)
  car.accelerate(-100)
  await wait(1000)
  car.accelerate(0)
  car.stop()
}, 3000)

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
