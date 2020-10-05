import Motor from './Motor'
import Car, { Direction } from './Car'
import wait from './wait'
import { basename } from 'path'
// import Encoder from './Encoder'

const motor1 = Motor(2, 3, 4)
const motor2 = Motor(17, 27, 22)
// const encoder1 = Encoder(14, 15)
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

const commands = {
  async loop() {
    console.log('turn left 45°')
    await car.turn(45, Direction.left, 50)
    console.log('turn right 270°')
    await car.turn(270, Direction.right, 50)
    console.log('turn left 45°')
    await car.turn(45, Direction.left, 50)
    console.log('turn left 180° on the spot')
    await car.turn(180, Direction.left, 50, true)
  },
  
  async turnOnSpot() {
    await car.turn(360, Direction.left, 100, true)
  },
  
  async forward() {
    await car.accelerate(50)
    await wait(500)
  },
  
  async back() {
    await car.accelerate(-50)
    await wait(500)
  },

  async demo() {
    await car.accelerate(40)
    await wait(500)
    await car.accelerate(60)
    await wait(500)
    await car.turn(180, Direction.left, 50, true)
    await wait(500)
    await this.turnOnSpot()
  }
}

if (!process.argv[2]) {
  console.error('\nUsage: ' + basename(process.argv.join(' ')) + ' <command>\nwith <command> equal to one of\n\t' + Object.keys(commands).join('\n\t'))
} else {
  commands[process.argv[2]]().then(car.stop)
}

process.on('SIGINT', function() {
  console.log("Caught interrupt signal")
  car.stop()
  car.float()
  process.exit()
})
