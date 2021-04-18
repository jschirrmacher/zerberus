import IO from "socket.io"
import { GPIO } from "../Hardware/gpio"

export function connectGPIOViewer(client: IO.Socket, gpio: GPIO): void {
  const listenerId = gpio.addListener((...args) => client.emit(...args))
  client.on("disconnect", () => {
    gpio.removeListener(listenerId)
  })
}
