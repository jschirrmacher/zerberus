import Motor from './Motor'
import Car, { Direction } from './Car'
import wait from './wait'
const Gpio = require('../gpio')

const motor1 = Motor(2, 3, 4)
const motor2 = Motor(17, 27, 22)
const car = Car({ left: motor1, right: motor2 })

async function loop() {
  console.log('starting loop')
  car.accelerate(50)
  await wait(500)
  console.log('turn left 180°')
  await car.turn(180, Direction.left, 50)
  console.log('turn left 180° on the spot')
  await car.turn(180, Direction.left, 50, true)
  console.log('turn right 180°')
  await car.turn(180, Direction.right, 50)
  console.log('turn right 180° on the spot')
  await car.turn(180, Direction.right, 50, true)
  car.stop()
  console.log('end of loop')
  // setImmediate(loop)
}

async function turnOnSpot() {
  await car.turn(360, Direction.left, 100, true)
}

turnOnSpot()

process.on('SIGINT', function() {
  console.log("Caught interrupt signal")
  car.stop()
  car.float()
  process.exit()
})
