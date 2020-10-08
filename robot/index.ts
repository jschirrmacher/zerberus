import Motor from './Motor'
import Car, { Direction } from './Car'
import wait from './wait'
import { basename } from 'path'
import Encoder from './Encoder'

const CPR = 544

const leftEncoder = Encoder(14, 15)
const rightEncoder = Encoder(10, 9)
const leftMotorSet = Motor(3, 2, 4, leftEncoder)
const rightMotorSet = Motor(27, 17, 22, rightEncoder)
const car = Car({ left: leftMotorSet, right: rightMotorSet })

const commands = {
  async loop() {
    await car.turn(45, Direction.left, 50)
    await car.turn(270, Direction.right, 50)
    await car.turn(45, Direction.left, 50)
    await car.turn(180, Direction.left, 50, true)
  },
  
  async turnOnSpot() {
    await car.turn(360, Direction.left, 100, true)
  },
  
  async forward() {
    leftEncoder.on(2 * CPR).then(car.stop)   // two wheel turns
    await car.accelerate(50)
    await wait(1000)
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
  },

  async star() {
    for (let i=0; i < 10; i++) {
      await car.accelerate(40)
      await wait(2500)
      // take photo
      await car.accelerate(-40)
      await wait(2500)
      await car.turn(10, Direction.left, 60, true)
    }
  },

  async curve() {
    await car.turn(90, Direction.left, 50)
    await car.accelerate(-30)
    await wait(1500)
    await car.turn(90, Direction.right, 50)
    await car.accelerate(30)
    await wait(1500)
    await car.stop()
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
