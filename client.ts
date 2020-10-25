import io from 'socket.io-client'

const socket = io('ws://localhost:10000')

export function send(name: string, args: unknown) {
  socket.emit('command', { name, args })
}

socket.on('result', (data) => {
  console.log(data)
})

socket.on('error', (data) => {
  console.error(data)
})
