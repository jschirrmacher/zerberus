import { Socket } from "socket.io"
import { GPIO } from "../Hardware/gpio"

export function connectGPIOViewer(client: Socket, gpio: GPIO): void {
  const listenerId = gpio.addListener((event: string, ...args) => client.emit(event, ...args))
  client.on("disconnect", () => {
    gpio.removeListener(listenerId)
  })
}
