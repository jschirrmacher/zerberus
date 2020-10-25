import path from 'path'
import Motor from './Motor'
import Car from './Car'
import Encoder from './Encoder'
import express from 'express'
import IO from 'socket.io'
import CommandList from './CommandList'
import { Position } from './Position'
import { Orientation } from './Orientation'
import Gpio from './gpio'

const gpio = Gpio()

const leftEncoder = Encoder(gpio, 14, 15)
const rightEncoder = Encoder(gpio, 19, 26)
const leftMotorSet = Motor(gpio, 27, 17, 22, rightEncoder)
const rightMotorSet = Motor(gpio, 3, 2, 4, leftEncoder)
const car = Car({ left: leftMotorSet, right: rightMotorSet })
const commands = CommandList(car)

const app = express()
const server = require('http').createServer(app)
const io = IO(server)
server.listen(10000)
app.use('/', express.static(path.resolve(__dirname, '..', 'viewer')))

console.log('Car controller is running and waits for connections')
io.on('connection', client => {
  console.log('Client connected')

  const listenerId = gpio.addListener((...args) => client.emit(...args))

  car.setPositionListener((pos: Position, orientation: Orientation) => {
    client.emit('car-position', { posX: pos.metricCoordinates().x, posY: pos.metricCoordinates().y, orientation: orientation.degreeAngle() })
    return false
  })

  client.on('command', async (command) => {
    console.debug('Received command ' + command.name)
    if (command.name === 'list-commands') {
      client.emit('result', { type: 'commandList', list: Object.keys(commands) })
    } else {
      try {
        await commands[command.name](command.args)
        client.emit('result', { type: 'currentPosition', pos: car.position, orientation: car.orientation })
      } catch (error) {
        console.error(error)
        client.emit('error', error)
      }
    }
  })

  client.on('camera', (info) => {
    console.log(`Camery says`, info)
  })

  client.on('disconnect', () => {
    gpio.removeListener(listenerId)
    console.log('Client disconnected')
  })
})

process.on('SIGINT', function() {
  console.log("Caught interrupt signal")
  car.destruct()
  process.exit()
})
