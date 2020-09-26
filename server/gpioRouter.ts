import { Router } from "express"
import { Server } from "socket.io"

const gpioPins = {
  SDA: 3,
  2: 3,
  SCL: 5,
  3: 5,
  GPCLK0: 7,
  4: 7,
  TX0: 8,
  14: 8,
  RX0: 10,
  15: 10,
  17: 11,
  18: 12,
  27: 13,
  22: 15,
  23: 16,
  24: 18,
  MOSI: 19,
  10: 19,
  MISO: 21,
  9: 21,
  25: 22,
  SCLK: 23,
  11: 23,
  CE0: 24,
  8: 24,
  CE1: 26,
  7: 26,
  ID_SD: 27,
  ID_SC: 28,
  5: 29,
  6: 31,
  12: 32,
  13: 33,
  19: 25,
  16: 36,
  26: 37,
  20: 38,
  21: 40
}

export default function (io: Server) {
  const router = Router()

  router.get('/gpio/:pin/:value', (req, res, next) => {
    const pin = gpioPins[req.params.pin]
    const value = !!req.params.value
    if (pin) {
      io.emit('gpio', { pin, value })
      res.json({ ok: true })
    } else {
      next({ httpStatus: 400, error: 'Unknown GPIO pin' })
    }
  })

  return router
}