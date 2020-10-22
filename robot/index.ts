import Motor from './Motor'
import Car, { Direction } from './Car'
import { basename } from 'path'
import Encoder from './Encoder'
import { create as createPosition, meters } from './Position'
import IO from 'socket.io'

const CPR = 544

const leftEncoder = Encoder(14, 15)
const rightEncoder = Encoder(19, 26)
const leftMotorSet = Motor(27, 17, 22, rightEncoder)
const rightMotorSet = Motor(3, 2, 4, leftEncoder)
const car = Car({ left: leftMotorSet, right: rightMotorSet })

const server = require('http').createServer()
const io = IO(server)
io.on('connection', client => {
  console.log('connected eyes - starting script')
  client.on('event', data => console.log('Eyes:', data))
  client.on('disconnect', () => console.log('disconnected eyes'))
  run()
})
server.listen(80)

const commands = {
  async loop() {
    for (let i=0; i < 10; i++) {
      await car.turn(45, Direction.left, 50)
      await car.turn(270, Direction.right, 50)
      await car.turn(45, Direction.left, 50)
      await car.turn(180, Direction.left, 50, true)
    }
  },

  async turn() {
    await car.turn(90, Direction.right, 70)
    await car.turn(90, Direction.left, 70)
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
    await car.goto(createPosition(meters(.3), meters(0)))
    await car.goto(createPosition(meters(0), meters(.6)))
    await car.goto(createPosition(meters(-.3), meters(0)))
    await car.goto(createPosition(meters(0), meters(0)))
  },

  async star() {
    for (let i=0; i < 8; i++) {
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
    await car.goto(createPosition(meters(-.5), meters(.5)))
    await car.goto(createPosition(meters(.5), meters(.5)))
    await car.goto(createPosition(meters(.5), meters(-.5)))
    await car.goto(createPosition(meters(-.5), meters(-.5)))
    await car.goto(createPosition(meters(-.5), meters(.5)))
  },
}

process.on('SIGINT', function() {
  console.log("Caught interrupt signal")
  car.destruct()
  process.exit()
})

async function run() {
  try {
    if (!process.argv[2] || !commands[process.argv[2]]) {
      const programCall = basename(process.argv.join(' ')) + ' <command>\n'
      const availableCommands = '\n\t' + Object.keys(commands).join('\n\t')
      console.error(`Usage: ${programCall}with <command> equal to one of ${availableCommands}`)
    } else {
      await commands[process.argv[2]]()
    }
  } catch (error) {
    console.error(error)
  } finally {
    console.log('Pos: ' + car.position.metricCoordinates().x + ', ' + car.position.metricCoordinates().y)
    console.log('Ori: ' + car.orientation.degreeAngle())
    car.destruct()
  }
}
