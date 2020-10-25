import io from 'socket.io-client'

const host = process.env.HOST || 'localhost'
console.log('Connecting to ' + host)
const socket = io(`ws://${host}:10000`)

export function send(name: string, args: unknown) {
  socket.emit('command', { name, args })
}

socket.on('result', (data) => {
  console.log(data)
})

socket.on('error', (data) => {
  console.error(data)
})

global['send'] = send
