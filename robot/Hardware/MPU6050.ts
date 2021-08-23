import { createObservable, ObservableValue } from "../lib/ObservableValue"
import Subject from "../lib/Subject"

const UPDATE_INTERVAL = 20

export type ThreeDeeCoords = { x: number; y: number; z: number; toString: (num: number) => string }
export type MPU = {
  gyro: ObservableValue<ThreeDeeCoords>
  accel: ObservableValue<ThreeDeeCoords>
  speed: ObservableValue<ThreeDeeCoords>
  update: () => void
  close: () => void
}

export const SMPLRT_DIV = 0x19
export const CONFIG = 0x1a
export const GYRO_CONFIG = 0x1b
export const ACCEL_CONFIG = 0x1c
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
  timer?: () => bigint
}

function toString(num: number): string {
  return [this.x.toFixed(num), this.y.toFixed(num), this.z.toFixed(num)].join(",")
}

export default async function MPUFactory(options: MPUOptions = {}): Promise<MPU> {
  options.address = options.address || 0x68
  options.timer = options.timer || process.hrtime.bigint
  let timer: NodeJS.Timer | null = null
  const i2c = options.useFake ? fakeI2CBus : await import("i2c-bus")
  const gyro = createObservable<ThreeDeeCoords>(Subject("gyro"), { x: 0, y: 0, z: 0, toString } as ThreeDeeCoords)
  const accel = createObservable<ThreeDeeCoords>(Subject("accel"), { x: 0, y: 0, z: 0, toString } as ThreeDeeCoords)
  const speed = createObservable<ThreeDeeCoords>(Subject("speed"), { x: 0, y: 0, z: 0, toString } as ThreeDeeCoords)

  const bus = i2c.openSync(options.i2cbus || 1)
  bus.writeByteSync(options.address, PWR_MGMT_1, 0)
  bus.writeByteSync(options.address, SMPLRT_DIV, 0b00000111)
  bus.writeByteSync(options.address, CONFIG, 0b00000000)
  bus.writeByteSync(options.address, ACCEL_CONFIG, 0b00000000)
  bus.writeByteSync(options.address, GYRO_CONFIG, 0b00000000)
  // bus.writeByteSync(options.address, INT_ENABLE, 1)

  const accelDivisor = 32768 / 2 // g (earth gravity)
  const gyroDivisor = (131 * 250) / 250 // deg/s

  function read(pos: number, divisor: number): number {
    const value = (bus.readByteSync(options.address, pos) << 8) + bus.readByteSync(options.address, pos + 1)
    return (value > 32767 ? value - 65536 : value) / divisor
  }

  let lastUpdate = undefined as bigint | undefined

  function update(): void {
    const result = [
      read(ACCEL_X, accelDivisor),
      read(ACCEL_Y, accelDivisor),
      read(ACCEL_Z, accelDivisor),
      read(GYRO_X, gyroDivisor),
      read(GYRO_Y, gyroDivisor),
      read(GYRO_Z, gyroDivisor),
    ]
    accel.value = { x: result[0], y: result[1], z: result[2], toString } as ThreeDeeCoords
    gyro.value = { x: result[3], y: result[4], z: result[5], toString } as ThreeDeeCoords
    const now = options.timer()
    if (lastUpdate) {
      const delta = Number((now - lastUpdate) / 1000000000n)
      delta &&
        (speed.value = {
          x: speed.value.x + accel.value.x * delta,
          y: speed.value.y + accel.value.y * delta,
          z: speed.value.z + accel.value.z * delta,
          toString,
        } as ThreeDeeCoords)
    }
    lastUpdate = now
    timer = setTimeout(update, UPDATE_INTERVAL)
  }

  update()

  return {
    gyro,
    accel,
    speed,
    update,

    close: () => {
      clearTimeout(timer)
    },
  }
}

export const fakeI2CBus = {
  data: {
    [ACCEL_X]: 0,
    [ACCEL_X + 1]: 0,
    [ACCEL_Y]: 0,
    [ACCEL_Y + 1]: 0,
    [ACCEL_Z]: 0,
    [ACCEL_Z + 1]: 0,
    [GYRO_X]: 0,
    [GYRO_X + 1]: 0,
    [GYRO_Y]: 0,
    [GYRO_Y + 1]: 0,
    [GYRO_Z]: 0,
    [GYRO_Z + 1]: 0,
  },

  set(values: Partial<typeof fakeI2CBus.data>): void {
    Object.keys(values).forEach((key) => {
      const value = values[key] < 0 ? values[key] + 65536 : values[key]
      fakeI2CBus.data[key] = value >> 8
      fakeI2CBus.data[key + 1] = value % 8
    })
  },

  openSync(busNumber: number) {
    return {
      writeByteSync(address: number, pos: number, value: number): void {
        fakeI2CBus.data[pos] = value
      },

      readByteSync(address: number, pos: number): number {
        return fakeI2CBus.data[pos]
      },
    }
  },
}
