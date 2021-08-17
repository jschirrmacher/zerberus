import { createObservable, ObservableValue } from "../lib/ObservableValue"
import Subject from "../lib/Subject"

const UPDATE_INTERVAL = 20

export type ThreeDeeCoords = { x: number; y: number; z: number }
export type MPU = {
  gyro: ObservableValue<ThreeDeeCoords>
  accel: ObservableValue<ThreeDeeCoords>
  update: () => void
  close: () => void
}

export const SMPLRT_DIV = 0x19
export const CONFIG = 0x1a
export const GYRO_CONFIG = 0x1b
export const INT_ENABLE = 0x38
export const ACCEL_X = 0x3b
export const ACCEL_Y = 0x3d
export const ACCEL_Z = 0x3f
export const GYRO_X = 0x43
export const GYRO_Y = 0x45
export const GYRO_Z = 0x47
export const PWR_MGMT_1 = 0x6b

type MPUOptions = {
  i2cbus?: number
  address?: number
  useFake?: boolean
}

export default async function MPUFactory(options: MPUOptions = {}): Promise<MPU> {
  options.address = options.address || 0x68
  let timer: NodeJS.Timer | null = null
  const i2c = options.useFake ? fakeI2CBus : await import("i2c-bus")
  const gyro = createObservable<ThreeDeeCoords>(Subject("gyro"), {} as ThreeDeeCoords)
  const accel = createObservable<ThreeDeeCoords>(Subject("accel"), {} as ThreeDeeCoords)

  const bus = i2c.openSync(options.i2cbus || 1)
  bus.writeByteSync(options.address, PWR_MGMT_1, 0)
  // bus.writeByteSync(options.address, SMPLRT_DIV, 0)
  // bus.writeByteSync(options.address, CONFIG, 0)
  // bus.writeByteSync(options.address, GYRO_CONFIG, 0)
  // bus.writeByteSync(options.address, INT_ENABLE, 1)

  const accelDivisor = 32768 / 2 // g (earth gravity)
  const gyroDivisor = (131 * 250) / 250 // deg/s

  async function read(pos: number, divisor: number): Promise<number> {
    return new Promise((resolve, reject) => {
      bus.readWord(options.address, pos, (err: Error, result: number) => {
        if (err) {
          reject(err)
        } else {
          const value = (result % 0xff << 8) + (result >> 8)
          resolve((value > 32767 ? value - 65536 : value) / divisor)
        }
      })
    })
  }

  async function update(): Promise<void> {
    const result = await Promise.all([
      read(ACCEL_X, accelDivisor),
      read(ACCEL_Y, accelDivisor),
      read(ACCEL_Z, accelDivisor),
      read(GYRO_X, gyroDivisor),
      read(GYRO_Y, gyroDivisor),
      read(GYRO_Z, gyroDivisor),
    ])
    accel.value = { x: result[0], y: result[1], z: result[2] } as ThreeDeeCoords
    gyro.value = { x: result[3], y: result[4], z: result[5] } as ThreeDeeCoords
    timer = !options.useFake && setTimeout(update, UPDATE_INTERVAL)
  }

  update()

  return {
    gyro,
    accel,
    update,

    close: () => {
      !options.useFake && clearTimeout(timer)
    },
  }
}

export const fakeI2CBus = {
  data: {
    [ACCEL_X]: 0,
    [ACCEL_Y]: 0,
    [ACCEL_Z]: 0,
    [GYRO_X]: 0,
    [GYRO_Y]: 0,
    [GYRO_Z]: 0,
  },

  set(values: Partial<typeof fakeI2CBus.data>): void {
    Object.keys(values).forEach((key) => (fakeI2CBus.data[key] = values[key]))
  },

  openSync(busNumber: number) {
    return {
      readWord(address: number, pos: number, callback: (err: Error | null, value: number) => void): void {
        callback(null, fakeI2CBus.data[pos])
      },

      writeByteSync(address: number, pos: number, value: number): void {
        fakeI2CBus.data[pos] = value
      },
    }
  },
}
