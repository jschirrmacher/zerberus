import IO from "socket.io"
import { Car, Direction } from "../Car/Car"
import { throttleFromJoystickValues } from "../Car/CarThrottle"
import RouteTrackerFactory, { DataPoint, DataType, RouteTracker } from "../route/RouteTracker"
import CommandList from "./CommandList"
import fs from "fs"
import path from "path"

let connectedRemoteControls = 0
let tracker: RouteTracker

export function connectRemoteControl(client: IO.Socket, car: Car): void {
  const keyControls = {
    forward: () => car.accelerate(car.getCurrentThrottle() + 25),
    back: () => car.accelerate(car.getCurrentThrottle() - 25),
    left: () => car.turn(Direction.left),
    right: () => car.turn(Direction.right),
    break: () => car.stop(),
    track: () => toggleTracker(),
  }

  function keyControl(info: { cmd: string }) {
    console.debug("Direct control " + info.cmd)
    keyControls[info.cmd] && keyControls[info.cmd]()
  }

  function toggleTracker() {
    const buffer = []
    let interval: NodeJS.Timeout
    let output: fs.WriteStream

    function flush() {
      if (buffer.length) {
        output.write(buffer.join("\n"))
        buffer.length = 0
      }
    }

    function logEvent(event: DataPoint): boolean {
      if (event.type === DataType.ROUTE_END) {
        flush()
        output.end()
        clearInterval(interval)
        interval = undefined
        return true
      } else {
        buffer.push([event.time, event.type, event.value].join(","))
        return false
      }
    }

    if (tracker) {
      tracker.endRecording()
      tracker = undefined
    } else {
      const routesDir = path.resolve(__dirname, "..", "..", "data", "routes")
      fs.mkdirSync(routesDir, { recursive: true })
      const routeFile = path.resolve(routesDir, "" + +new Date() + ".csv")
      output = fs.createWriteStream(routeFile, { flags: "a" })
      tracker = RouteTrackerFactory("route")
      tracker.registerObserver(logEvent)
      tracker.track(car.position, DataType.CAR_POSITION, (position) => position.x + "," + position.y)
      tracker.track(car.orientation, DataType.CAR_ORIENTATION, (orientation) => orientation.angle)
      tracker.track(car.events, DataType.CAR_STATUS, () => "")
      interval = setInterval(flush, 500)
    }
  }

  async function doCommand(client: IO.Socket, command: { name: string; args: unknown[] }) {
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
  }

  async function remoteControlIsDisconnected(): Promise<void> {
    connectedRemoteControls--
    if (!connectedRemoteControls) {
      await car.float()
    }
  }

  const commands = CommandList(car)
  connectedRemoteControls++
  client.on("disconnect", remoteControlIsDisconnected)
  client.on("error", remoteControlIsDisconnected)
  client.on("command", async (command) => doCommand(client, command))
  client.on("control", (info) => keyControl(info))
  client.on("joystick", (values) => {
    car.throttle(throttleFromJoystickValues(values))
  })
}
