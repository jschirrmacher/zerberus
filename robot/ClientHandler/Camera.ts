import IO from "socket.io"

export function connectCamera(client: IO.Socket): void {
  client.on("camera", (info) => console.log(`Camera says`, info))
}
