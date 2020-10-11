import Motor from './Motor'
import Car, { Direction } from './Car'
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

  async turn() {
    await car.turn(180, Direction.right, 70)
  },
  
  async turnOnSpot() {
    await car.turn(360, Direction.left, 100, true)
  },
  
  async forward() {
    await car.go(200, 50)
    await car.stop()
  },
  
  async back() {
    await car.go(1000, -50)
  },

  async triangle() {
    await car.go(500, 40)
    await car.turn(60, Direction.right, 100, true)
    await car.go(500, 60)
    await car.turn(60, Direction.right, 100, true)
    await car.go(500, 80)
  },

  async star() {
    for (let i=0; i < 10; i++) {
      await car.go(500, 40)
      // take photo
      await car.go(500, -40)
      await car.turn(45, Direction.left, 60, true)
    }
  },

  async curve() {
    await car.turn(90, Direction.left, 50)
    await car.go(1500, -30)
    await car.turn(90, Direction.right, 50)
    await car.go(1500, 30)
  },

  async square() {
    await car.goto(-200, -200, 50)
    await car.goto(200, -200, 50)
    await car.goto(200, 200, 50)
    await car.goto(-200, 200, 50)
    await car.goto(-200, -200, 50)
  },
}

if (!process.argv[2] || !commands[process.argv[2]]) {
  const programCall = basename(process.argv.join(' ')) + ' <command>\n'
  const availableCommands = '\n\t' + Object.keys(commands).join('\n\t')
  console.error(`Usage: ${programCall}with <command> equal to one of ${availableCommands}`)
  car.destruct()
} else {
  commands[process.argv[2]]().then(() => {
    console.log('Pos: ' + car.positionX + ', ' + car.positionY)
    console.log('Ori: ' + car.orientation)
    car.destruct()
  })
}

process.on('SIGINT', function() {
  console.log("Caught interrupt signal")
  car.destruct()
  process.exit()
})
