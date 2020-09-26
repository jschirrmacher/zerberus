import express from 'express'
import path from 'path'
import http from 'http'
import IO from 'socket.io'
import gpio from './gpioRouter'
import gpioRouter from './gpioRouter'

const port = process.env.port || 10000
const logger = console

const app = express()
const server = http.createServer(app)

const io = IO(server)
io.on('connection', (socket) => {
  console.log('a user connected')
  socket.emit('hi', 'Robot Simulator Frontend')

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

app.use((req, res, next) => {
  logger.info(`${req.method.toUpperCase()} ${req.path}`)
  next()
})

app.use('/', express.static(path.resolve(__dirname, '..', 'frontend')))

app.use(gpioRouter(io))

app.use(function(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error(err)
  res.status(err.httpStatus || 500).json({error: err.toString()})
})

server.listen(port, () => logger.info(`Running on http://localhost:${port}`))
