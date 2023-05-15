export enum CLIENT_TYPE {
  REMOTE_CONTROL = "REMOTE_CONTROL", // Sends operator commands to car
  COCKPIT = "COCKPIT", // shows camera image, car speed and similar properties
  CAMERA = "CAMERA", // is a camera
  GPIO_VIEWER = "GPIO_VIEWER", // shows pin values of GPIO
  ACCELEROMETER = "ACCELEROMETER", // Sends data on the acceleration of the car
}

export type ThreeDeeCoords = { x: number; y: number; z: number }
export type MotorInfo = { throttle: number }
export type CarInfo = {
  orientation: number
  leftMotor: MotorInfo
  rightMotor: MotorInfo
  posX: number
  posY: number
  speed: number
  mpu: {
    accel: ThreeDeeCoords
    gyro: ThreeDeeCoords
    speed: ThreeDeeCoords
  }
}
