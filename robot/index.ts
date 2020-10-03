import Motor from './Motor'
import Car, { Direction } from './Car'
import wait from './wait'
const Gpio = require('../gpio')

const motor1 = Motor(2, 3, 4)
const motor2 = Motor(17, 27, 22)
const car = Car({ left: motor1, right: motor2 })

async function loop() {
  console.log('turn left 45°')
  await car.turn(45, Direction.left, 50)
  console.log('turn right 270°')
  await car.turn(270, Direction.right, 50)
  console.log('turn left 45°')
  await car.turn(45, Direction.left, 50)
  console.log('turn left 180° on the spot')
  await car.turn(180, Direction.left, 50, true)
}

async function turnOnSpot() {
  await car.turn(360, Direction.left, 100, true)
}

loop().then(car.stop)

process.on('SIGINT', function() {
  console.log("Caught interrupt signal")
  car.stop()
  car.float()
  process.exit()
})
