import "should"
import { ThreeDeeCoords } from "../lib/ThreeDeeCoord"
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
  MPU,
  PWR_MGMT_1,
  SMPLRT_DIV,
} from "./MPU6050"

let currentTime = 0n

const timer = () => {
  return currentTime
}

describe("MPU6050", () => {
  let mpu: MPU

  beforeEach(async () => (mpu = await MPUFactory({ useFake: true, timer })))
  afterEach(() => mpu.close())

  it("should initialize accelerometer and gyroscope", () => {
    fakeI2CBus.data[PWR_MGMT_1].should.equal(0)
    fakeI2CBus.data[SMPLRT_DIV].should.equal(7)
    fakeI2CBus.data[CONFIG].should.equal(0)
    fakeI2CBus.data[GYRO_CONFIG].should.equal(0)
    // fakeI2CBus.data[INT_ENABLE].should.equal(1)
  })

  it("should read values from accelerometer", () => {
    const promise = new Promise((resolve) => mpu.accel.registerObserver(resolve))
    fakeI2CBus.set({ [ACCEL_X]: 123, [ACCEL_Y]: 42, [ACCEL_Z]: -815 })
    mpu.update()
    promise.should.be.resolvedWith({ x: 123 / 16384, y: 42 / 16384, z: -815 / 16384 })
  })

  it("should read values from gyroscope", () => {
    const promise = new Promise((resolve) => mpu.gyro.registerObserver(resolve))
    fakeI2CBus.set({ [GYRO_X]: -321, [GYRO_Y]: -24, [GYRO_Z]: 518 })
    mpu.update()
    promise.should.be.resolvedWith({ x: -321 / 131, y: -24 / 131, z: 518 / 131 })
  })

  it("should calculate speeds from acceleration", async () => {
    fakeI2CBus.set({ [ACCEL_X]: 0, [ACCEL_Y]: 0, [ACCEL_Z]: 0 })
    currentTime = 1000000000n
    mpu.update()
    const promise = new Promise<ThreeDeeCoords>((resolve) => mpu.speed.registerObserver(resolve))
    currentTime = 1300000000n
    fakeI2CBus.set({ [ACCEL_X]: 7, [ACCEL_Y]: -2, [ACCEL_Z]: 4 })
    mpu.update()
    const result = await promise
    result.toString(5).should.equal("0.00013,-0.00004,0.00007")
  })
})
