import path from 'path'
import Motor from './MotorSet'
import Car, { Direction } from './Car'
import Encoder from './Encoder'
import express from 'express'
import IO from 'socket.io'
import CommandList from './CommandList'
import { Position } from './Position'
import { Orientation } from './Orientation'
import GPIOFactory from './gpio'
import HTTP = require('http')

const gpio = GPIOFactory(process.env.NODE_ENV !== "production")

const leftEncoder = Encoder(gpio, 14, 15)
const rightEncoder = Encoder(gpio, 19, 26)
const leftMotorSet = Motor(gpio, 2, 3, 4, leftEncoder)
const rightMotorSet = Motor(gpio, 17, 27, 22, rightEncoder)
const car = Car({ left: leftMotorSet, right: rightMotorSet })
const commands = CommandList(car)

const app = express()
const server = HTTP.createServer(app)
const io = IO(server)
server.listen(10000)
app.use('/', express.static(path.resolve(__dirname, '..', 'frontend')))
app.use('/', express.static(path.resolve(__dirname, '..', 'pictures')))

function sendPosition(client: IO.Socket, pos: Position, orientation: Orientation): boolean {
  client.emit('car-position', { posX: pos.metricCoordinates().x, posY: pos.metricCoordinates().y, orientation: orientation.degreeAngle() })
  return false
}

console.log(`Car controller is running in "${process.env.NODE_ENV}" mode and waits for connections`)
io.on('connection', client => {
  console.log('Client connected')
  client.emit('hi', 'Robot Simulator')
  sendPosition(client, car.position, car.orientation)

  const listenerId = gpio.addListener((...args) => client.emit(...args))

  car.setPositionListener((pos: Position, orientation: Orientation) => sendPosition(client, pos, orientation))

  client.on('command', async (command) => {
    console.debug('Received command ' + command.name)
    if (command.name === 'list-commands') {
      client.emit('command-list', Object.keys(commands))
    } else {
      try {
        await commands[command.name](command.args)
      } catch (error) {
        console.error(error)
        client.emit('error', error)
      }
      await car.stop()
    }
  })

  client.on('camera', (info) => {
    console.log(`Camera says`, info)
  })

  client.on('disconnect', () => {
    gpio.removeListener(listenerId)
    console.log('Client disconnected')
  })

  client.on('control', async (info) => {
    console.debug('Direct control ' + info.cmd)
    switch (info.cmd) {
      case 'forward': 
        car.accelerate(car.speed() + 25)
        break

      case 'back':
        car.accelerate(car.speed() - 25)
        break

      case 'left':
        car.turn(Direction.left)
        break

      case 'right':
        car.turn(Direction.right)
        break

      case 'break':
        car.stop()
        break
    }
  })
})

process.on('SIGINT', function() {
  console.log("Caught interrupt signal")
  car.destruct()
  process.exit()
})
