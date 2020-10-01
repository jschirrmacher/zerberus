import Motor from './Motor'
import Car, { Direction } from './Car'
const Gpio = require('../gpio')

const motor1 = Motor(2, 3, 4)
const motor2 = Motor(17, 27, 22)
const car = Car({ left: motor1, right: motor2 })

async function wait(millseconds: number) {
  return new Promise(resolve => setTimeout(resolve, millseconds))
}

async function loop() {
  console.log('starting loop')
  car.accelerate(50)
  await wait(500)
  car.turn(0, Direction.left)
  await wait(15000)
  car.stop()
  console.log('end of loop')
  // setImmediate(loop)
}

loop()

process.on('SIGINT', function() {
  console.log("Caught interrupt signal")
  car.stop()
  process.exit()
})
