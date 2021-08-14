import { createObservable } from "../lib/ObservableValue"
import Subject from "../lib/Subject"

const UPDATE_INTERVAL = 20

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

export type Triple = { x: number; y: number; z: number }
export type MPU = ReturnType<typeof MPUFactory>

export default function MPUFactory(useFake: boolean, i2cbus = 1, address = 0x68) {
  let timer: NodeJS.Timer | null = null
  const i2c = useFake ? fakeI2CBus : require("i2c-bus")
  const gyro = createObservable(Subject("gyro"), {} as Triple)
  const accel = createObservable(Subject("accel"), {} as Triple)

  const bus = i2c.openSync(i2cbus)
  bus.writeByteSync(address, PWR_MGMT_1, 0)
  bus.writeByteSync(address, SMPLRT_DIV, 7)
  bus.writeByteSync(address, CONFIG, 0)
  bus.writeByteSync(address, GYRO_CONFIG, 24)
  bus.writeByteSync(address, INT_ENABLE, 1)

  async function read(pos: number) {
    return new Promise((resolve) => bus.readWord(address, pos, resolve))
  }

  async function update(): Promise<void> {
    const result = await Promise.all([
      read(ACCEL_X),
      read(ACCEL_Y),
      read(ACCEL_Z),
      read(GYRO_X),
      read(GYRO_Y),
      read(GYRO_Z),
    ])
    accel.value = { x: result[0], y: result[1], z: result[2] }
    gyro.value = { x: result[3], y: result[4], z: result[5] }
    timer = setTimeout(update, UPDATE_INTERVAL)
  }

  timer = setTimeout(update, UPDATE_INTERVAL)

  return {
    gyro,
    accel,

    close: () => {
      clearTimeout(timer)
    },
  }
}

export const fakeI2CBus = {
  data: {
    ACCEL_X: 0,
    ACCEL_Y: 0,
    ACCEL_Z: 0,
    GYRO_X: 0,
    GYRO_Y: 0,
    GYRO_Z: 0,
  },

  openSync(busNumber: number) {
    return {
      readWord(address: number, pos: number, callback: (value: number) => void): void {
        setTimeout(() => callback(fakeI2CBus.data[pos]), Math.random() / 100)
      },

      writeByteSync(address: number, pos: number, value: number): void {
        fakeI2CBus.data[pos] = value
      },
    }
  },
}
