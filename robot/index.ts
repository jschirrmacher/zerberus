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
  await car.turn(180, Direction.left)
  console.log('turn left 180° on the spot')
  await car.turn(180, Direction.left, true)
  console.log('turn right 180°')
  await car.turn(180, Direction.right)
  console.log('turn right 180° on the spot')
  await car.turn(180, Direction.right, true)
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
