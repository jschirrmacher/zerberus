import IO from "socket.io"
import { Car, Direction } from "../Car/Car"
import { throttleFromJoystickValues } from "../Car/CarThrottle"
import CommandList from "./CommandList"

let connectedRemoteControls = 0

export function connectRemoteControl(client: IO.Socket, car: Car): void {
  const keyControls = {
    forward: () => car.accelerate(car.getCurrentThrottle() + 25),
    back: () => car.accelerate(car.getCurrentThrottle() - 25),
    left: () => car.turn(Direction.left),
    right: () => car.turn(Direction.right),
    break: () => car.stop(),
  }

  function keyControl(info: { cmd: string }) {
    console.debug("Direct control " + info.cmd)
    keyControls[info.cmd] && keyControls[info.cmd]()
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
