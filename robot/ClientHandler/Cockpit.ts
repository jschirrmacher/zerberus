import IO from "socket.io"
import { Car, CarState } from "../Car/Car"
import { MPU } from "../Hardware/MPU6050"
import { throttle } from "../lib/throttle"

export function connectCockpit(client: IO.Socket, car: Car, mpu: MPU) {
  function sendInfo(): boolean {
    const pos = car.position.value.metricCoordinates()
    client.emit("car-position", {
      posX: pos.x.toFixed(3),
      posY: pos.y.toFixed(3),
      orientation: Math.round(car.orientation.value.degreeAngle()),
      speed: car.speed.value.toFixed(1),
      accel: mpu.accel.value.toString(3),
      gyro: mpu.gyro.value.toString(3),
    })
    return false
  }

  function sendCarStateChange(state: CarState): boolean {
    client.emit("state-change", { newState: state })
    return false
  }

  sendInfo()
  const throttledInfoFunc = throttle(sendInfo, 20)
  car.position.registerObserver(throttledInfoFunc)
  car.speed.registerObserver(throttledInfoFunc)
  car.state.registerObserver(sendCarStateChange)
  mpu.accel.registerObserver(throttledInfoFunc)
  mpu.gyro.registerObserver(throttledInfoFunc)
}
