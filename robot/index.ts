import path from "path"
import MotorFactory from "./MotorSet/Motor"
import CarFactory, { Car, CarState, Direction } from "./Car/Car"
import Encoder from "./MotorSet/Encoder"
import express from "express"
import IO from "socket.io"
import CommandList from "./CommandList"
import { Position } from "./Car/Position"
import { Orientation } from "./Car/Orientation"
import GPIOFactory from "./Hardware/gpio"
import HTTP = require("http")
import { throttleFromJoystickValues } from "./Car/CarThrottle"
import { throttle } from "./lib/throttle"

const gpio = GPIOFactory(process.env.NODE_ENV !== "production")

const leftEncoder = Encoder(gpio, 14, 15)
const rightEncoder = Encoder(gpio, 19, 26)
const leftMotorSet = MotorFactory(gpio, 2, 3, 4, leftEncoder)
const rightMotorSet = MotorFactory(gpio, 17, 27, 22, rightEncoder)
const car = CarFactory({ left: leftMotorSet, right: rightMotorSet })
const commands = CommandList(car)

const app = express()
const server = HTTP.createServer(app)
const io = IO(server)
server.listen(10000)
app.use("/", express.static(path.resolve(__dirname, "..", "frontend")))
app.use("/", express.static(path.resolve(__dirname, "..", "pictures")))

function sendInfo(client: IO.Socket, car: Car): boolean {
  const pos = car.position.value.metricCoordinates()
  client.emit("car-position", {
    posX: pos.x.toFixed(3),
    posY: pos.y.toFixed(3),
    orientation: Math.round(car.orientation.value.degreeAngle()),
    speed: car.speed.value.toFixed(1),
  })
  return false
}

function sendCarStateChange(client: IO.Socket, state: CarState): boolean {
  client.emit("state-change", { newState: state })
  return false
}

console.log(`Car controller is running in "${process.env.NODE_ENV}" mode and waits for connections`)
io.on("connection", (client) => {
  console.log("Client connected")
  client.emit("hi", "Robot Simulator")
  sendInfo(client, car)

  const listenerId = gpio.addListener((...args) => client.emit(...args))

  const throttledInfoFunc = throttle(() => sendInfo(client, car), 20)
  car.position.registerObserver(throttledInfoFunc)
  car.speed.registerObserver(throttledInfoFunc)
  car.state.registerObserver((state: CarState) => sendCarStateChange(client, state))

  client.on("command", async (command) => {
    console.debug("Received command " + command.name)
    if (command.name === "list-commands") {
      client.emit("command-list", Object.keys(commands))
    } else {
      try {
        await commands[command.name](command.args)
      } catch (error) {
        console.error(error)
        client.emit("error", error)
      }
      await car.stop()
    }
  })

  client.on("camera", (info) => {
    console.log(`Camera says`, info)
  })

  client.on("disconnect", () => {
    gpio.removeListener(listenerId)
    console.log("Client disconnected")
  })

  client.on("control", async (info) => {
    console.debug("Direct control " + info.cmd)
    switch (info.cmd) {
      case "forward":
        car.accelerate(car.getCurrentThrottle() + 25)
        break

      case "back":
        car.accelerate(car.getCurrentThrottle() - 25)
        break

      case "left":
        car.turn(Direction.left)
        break

      case "right":
        car.turn(Direction.right)
        break

      case "break":
        car.stop()
        break
    }
  })

  client.on("joystick", (values) => {
    car.throttle(throttleFromJoystickValues(values))
  })
})

process.on("SIGINT", function () {
  console.log("Caught interrupt signal")
  car.destruct()
  console.log("Motor controller discarded")
  process.exit()
})
