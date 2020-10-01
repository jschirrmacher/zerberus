import Motor from './Motor'
import Car, { Direction } from './Car'
const Gpio = require('../gpio')

// const led = new Gpio(19, {mode: Gpio.OUTPUT})

// let value = 0
// setInterval(() => {
//   led.write(value)
//   value = 1 - value
// }, 500)

const motor1 = Motor(2, 3, 4)
const motor2 = Motor(17, 27, 22)
const car = Car({ left: motor1, right: motor2 })

async function wait(millseconds: number) {
  return new Promise(resolve => setTimeout(resolve, millseconds))
}

const loop = setInterval(async () => {
  car.accelerate(50)
  await wait(500)
  car.turn(100, Direction.left)
  await wait(3500)
  car.accelerate(0)
}, 4000)

process.on('SIGINT', function() {
  console.log("Caught interrupt signal")
  clearInterval(loop)
  car.stop()
  process.exit
})
