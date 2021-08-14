import "should"
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
  PWR_MGMT_1,
  SMPLRT_DIV,
} from "./MPU6050"

const bus = fakeI2CBus

describe("MPU6050", () => {
  let mpu: ReturnType<typeof MPUFactory>

  afterEach(() => mpu.close())

  it("should initialize accelerometer and gyroscope", () => {
    mpu = MPUFactory(true)
    bus.data[PWR_MGMT_1].should.equal(0)
    bus.data[SMPLRT_DIV].should.equal(7)
    bus.data[CONFIG].should.equal(0)
    bus.data[GYRO_CONFIG].should.equal(24)
    bus.data[INT_ENABLE].should.equal(1)
  })

  it("should read values from accelerometer", (done) => {
    mpu = MPUFactory(true)
    mpu.accel.registerObserver((value) => {
      value.should.deepEqual({ x: 123, y: 42, z: -815 })
      done()
    })
    bus.data[ACCEL_X] = 123
    bus.data[ACCEL_Y] = 42
    bus.data[ACCEL_Z] = -815
  })

  it("should read values from gyroscope", (done) => {
    mpu = MPUFactory(true)
    mpu.gyro.registerObserver((value) => {
      value.should.deepEqual({ x: -321, y: -24, z: 518 })
      done()
    })
    bus.data[GYRO_X] = -321
    bus.data[GYRO_Y] = -24
    bus.data[GYRO_Z] = 518
  })
})
