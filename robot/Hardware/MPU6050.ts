import { createObservable, ObservableValue } from "../lib/ObservableValue"
import Subject from "../lib/Subject"
import { make3dCoord, ThreeDeeCoords } from "../lib/ThreeDeeCoord"

const UPDATE_INTERVAL = 20

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

export default async function MPUFactory(options: MPUOptions = {}): Promise<MPU> {
  const address = options.address || 0x68
  let timer = options.timer || process.hrtime.bigint
  let timeout: NodeJS.Timeout
  const i2c = options.useFake ? fakeI2CBus : await import("i2c-bus")
  const gyro = createObservable<ThreeDeeCoords>(Subject("gyro"), make3dCoord())
  const accel = createObservable<ThreeDeeCoords>(Subject("accel"), make3dCoord())
  const speed = createObservable<ThreeDeeCoords>(Subject("speed"), make3dCoord())

  const bus = i2c.openSync(options.i2cbus || 1)
  bus.writeByteSync(address, PWR_MGMT_1, 0)
  bus.writeByteSync(address, SMPLRT_DIV, 0b00000111)
  bus.writeByteSync(address, CONFIG, 0b00000000)
  bus.writeByteSync(address, ACCEL_CONFIG, 0b00000000)
  bus.writeByteSync(address, GYRO_CONFIG, 0b00000000)
  // bus.writeByteSync(address, INT_ENABLE, 1)

  const accelDivisor = 0x4000 // g (earth gravity)
  const gyroDivisor = (131 * 250) / 250 // deg/s

  function read(pos: number, divisor: number): number {
    const value = (bus.readByteSync(address, pos) << 8) + bus.readByteSync(address, pos + 1)
    return (value > 0x7fff ? value - 0x10000 : value) / divisor
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
    accel.value = make3dCoord(result[0], result[1], result[2])
    gyro.value = make3dCoord(result[3], result[4], result[5])
    const now = timer()
    if (lastUpdate) {
      const delta = Number(now - lastUpdate) / 1e9
      if (delta && (result[0] || result[1] || result[2])) {
        speed.value = speed.value.add(make3dCoord(result[0] * delta, result[1] * delta, result[2] * delta))
      }
    }
    lastUpdate = now
    timeout = setTimeout(update, UPDATE_INTERVAL)
  }

  update()

  return {
    gyro,
    accel,
    speed,
    update,

    close: () => {
      timeout && clearTimeout(timeout)
    },
  }
}

interface I2CBus {
  data: Record<number, number>
  set(values: Partial<typeof fakeI2CBus.data>): void
  openSync(busNumber: number): {
    writeByteSync(address: number, pos: number, value: number): void
    readByteSync(address: number, pos: number): number
  }
}

export const fakeI2CBus: I2CBus = {
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

  set(values) {
    Object.keys(values).forEach((key) => {
      const rawValue = values[+key] || 0
      const value = rawValue < 0 ? rawValue + 0x10000 : rawValue
      fakeI2CBus.data[+key] = value >> 8
      fakeI2CBus.data[+key + 1] = value & 0xff
    })
  },

  openSync() {
    return {
      writeByteSync: (_, pos, value) => (fakeI2CBus.data[pos] = value),
      readByteSync: (_, pos) => fakeI2CBus.data[pos],
    }
  },
}
