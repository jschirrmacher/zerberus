import path from "path"
import MotorFactory from "./MotorSet/Motor"
import CarFactory from "./Car/Car"
import Encoder from "./MotorSet/Encoder"
import express from "express"
import { Server, Socket } from "socket.io"
import GPIOFactory from "./Hardware/gpio"
import MPUFactory from "./Hardware/MPU6050"
import HTTP = require("http")
import { CLIENT_TYPE } from "../types"
import { connectCockpit } from "./ClientHandler/Cockpit"
import { connectRemoteControl } from "./ClientHandler/RemoteControl"
import { connectCamera } from "./ClientHandler/Camera"
import { connectGPIOViewer } from "./ClientHandler/GPIOViewer"
import { exec } from "child_process"
import { promisify } from "util"

const asyncExec = promisify(exec)

async function initCar() {
  const mode = process.env.NODE_ENV
  const prod = mode === "production"
  const gpio = GPIOFactory(!prod)
  const mpu = await MPUFactory({ useFake: !prod })

  const leftEncoder = Encoder(gpio, 14, 15)
  const rightEncoder = Encoder(gpio, 19, 26)
  const leftMotorSet = MotorFactory(gpio, 10, 9, 4, leftEncoder)
  const rightMotorSet = MotorFactory(gpio, 17, 27, 22, rightEncoder)
  const car = CarFactory({ left: leftMotorSet, right: rightMotorSet }, await mpu)

  const app = express()
  const server = HTTP.createServer(app)
  const io = new Server(server, { cors: { origin: true } })
  const port = process.env.PORT || 10000
  server.listen(port, async () => {
    const { stdout } = await asyncExec(`hostname -I | awk '{print $1;}'`)
    const url = `http://${stdout.trim()}:${port}`
    console.log(`Car controller is running in "${mode}" mode and waits for connections on ${url}`)
  })
  app.use("/", express.static(path.resolve(__dirname, "..", "dist")))
  app.use("/old", express.static(path.resolve(__dirname, "..", "old-frontend")))
  app.use("/", express.static(path.resolve(__dirname, "..", "pictures")))

  async function clientHasRegistered(client: Socket, types: string[]): Promise<void> {
    console.log(types)
    if (types.includes(CLIENT_TYPE.REMOTE_CONTROL)) {
      connectRemoteControl(client, car, mpu)
    }

    if (types.includes(CLIENT_TYPE.CAMERA)) {
      connectCamera(client)
    }

    if (types.includes(CLIENT_TYPE.COCKPIT)) {
      connectCockpit(client, car, mpu)
    }

    if (types.includes(CLIENT_TYPE.GPIO_VIEWER)) {
      connectGPIOViewer(client, gpio)
    }
  }

  io.on("connection", (client) => {
    console.log("Client connected")
    client.on("hi", (types: string[]) => clientHasRegistered(client, types))
    client.on("disconnect", () => console.log("Client has disconnected"))
    client.emit("hi", "Zerberus")
  })

  process.on("SIGINT", async function () {
    console.log("Caught interrupt signal")
    car.destruct()
    console.log("Motor controller discarded")
    mpu.close()
    console.log("MPU discarded")
    process.exit()
  })
}

initCar()
