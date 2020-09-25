import express from 'express'
import path from 'path'
import http from 'http'
import IO from 'socket.io'

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

app.use('/gpio/:pin/:value', (req, res) => {
  io.emit('gpio', req.params)
  res.json({ ok: true })
})

app.use(function(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error(err)
  res.status(500).json({error: err.toString()})
})

server.listen(port, () => logger.info(`Running on http://localhost:${port}`))
