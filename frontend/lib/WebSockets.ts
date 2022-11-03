import io from "socket.io-client"

let socket: ReturnType<typeof io>

export function useSocket() {
  return socket || (socket = io(":10000"))
}

export async function mockSocket() {
  const { vi } = await import("vitest")
  const mock = {
    on: vi.fn(),
    emit: vi.fn(),
  }
  socket = mock as unknown as ReturnType<typeof io>
  return mock
}
