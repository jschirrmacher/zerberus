import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { ThreeDeeCoords } from "../lib/ThreeDeeCoord"
import MPUFactory, {
  ACCEL_X,
  ACCEL_Y,
  ACCEL_Z,
  CONFIG,
  fakeI2CBus,
  GYRO_CONFIG,
  GYRO_X,
  GYRO_Y,
  GYRO_Z,
  INT_ENABLE,
  type MPU,
  PWR_MGMT_1,
  SMPLRT_DIV,
} from "./MPU6050"

let currentTime = BigInt(0)

const timer = () => {
  return currentTime
}

describe("MPU6050", () => {
  let mpu: MPU

  beforeEach(async () => {
    mpu = await MPUFactory({ useFake: true, timer })
  })

  afterEach(() => mpu.close())

  it("should initialize accelerometer and gyroscope", () => {
    expect(fakeI2CBus.data[PWR_MGMT_1]).toBe(0)
    expect(fakeI2CBus.data[SMPLRT_DIV]).toBe(7)
    expect(fakeI2CBus.data[CONFIG]).toBe(0)
    expect(fakeI2CBus.data[GYRO_CONFIG]).toBe(24)
    expect(fakeI2CBus.data[INT_ENABLE]).toBe(1)
  })

  it("should read values from accelerometer", async () => {
    const promise = new Promise((resolve) => mpu.accel.registerObserver(resolve))
    fakeI2CBus.set({ [ACCEL_X]: 123, [ACCEL_Y]: 42, [ACCEL_Z]: -815 })
    mpu.update()
    expect(await promise).toEqual(expect.objectContaining({ x: 123 / 16384, y: 42 / 16384, z: -815 / 16384 }))
  })

  it("should read values from gyroscope", async () => {
    const promise = new Promise((resolve) => mpu.gyro.registerObserver(resolve))
    fakeI2CBus.set({ [GYRO_X]: -321, [GYRO_Y]: -24, [GYRO_Z]: 518 })
    mpu.update()
    expect(await promise).toEqual(expect.objectContaining({ x: -321 / 131, y: -24 / 131, z: 518 / 131 }))
  })

  it("should calculate speeds from acceleration", async () => {
    fakeI2CBus.set({ [ACCEL_X]: 0, [ACCEL_Y]: 0, [ACCEL_Z]: 0 })
    currentTime = BigInt(1_000_000_000)
    mpu.update()
    const promise = new Promise<ThreeDeeCoords>((resolve) => mpu.speed.registerObserver(resolve))
    currentTime = BigInt(1_300_000_000)
    fakeI2CBus.set({ [ACCEL_X]: 7, [ACCEL_Y]: -2, [ACCEL_Z]: 4 })
    mpu.update()
    expect((await promise).toString(5)).toBe("0.00013,-0.00004,0.00007")
  })
})
