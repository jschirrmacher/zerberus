<script setup lang="ts">
import type { CarInfo, ThreeDeeCoords } from "@/types"
import { storeToRefs } from "pinia"
import { nextTick, ref, watch } from "vue"
import FlightIndicator from "./components/FlightIndicator.vue"
import JoystickHandle from "./components/JoystickHandle.vue"
import TheCar from "./components/TheCar.vue"
import ThreeDeeWorld from "./components/ThreeDeeWorld.vue"
import { useSocket } from "./lib/WebSockets"
import { useCarStore } from "./stores/car"

const camera = ref({ x: 450, y: 400, z: 0, angle: -10, zoom: 0 })
const car = ref({ x: 0, y: 0, angle: 0 })
const leftMotorSpeed = ref(0)
const rightMotorSpeed = ref(0)
const accel = ref({ x: 0, y: 0, z: 0 } as ThreeDeeCoords)
const gyro = ref({ x: 0, y: 0, z: 0 } as ThreeDeeCoords)
const speed = ref({ x: 0, y: 0, z: 0 } as ThreeDeeCoords)

const carStore = useCarStore()
const { orientation } = storeToRefs(carStore)

const appEl = document.querySelector("#app")
watch(orientation, () => {
  const pos = orientation.value / 3.6
  appEl?.setAttribute("data-angle", "" + orientation.value)
  appEl?.setAttribute("style", `background-position-x: ${pos}%`)
})

const socket = useSocket()

socket.on("hi", () => {
  socket.emit("hi", ["REMOTE_CONTROL", "COCKPIT"])
})

socket.on("car-position", (info: CarInfo) => {
  carStore.setInfo(info)
  car.value.x = +info.posX
  car.value.y = +info.posY
  car.value.angle = -info.orientation
  leftMotorSpeed.value = info.leftMotor.throttle
  rightMotorSpeed.value = info.rightMotor.throttle
  accel.value = info.mpu.accel
  gyro.value = info.mpu.accel
  speed.value = info.mpu.accel
})

function setMotorThrottles(value: { x: number; y: number }) {
  function squarePercent(value: number) {
    return Math.sign(value) * Math.round((value / 100) * (value / 100) * 100)
  }

  const x = squarePercent(value.x)
  const y = squarePercent(value.y)
  const offset = Math.max(y + x - 100, 0) + Math.min(y + x + 100, 0)
  socket.emit("motor-throttle", { left: y + x - offset, right: y - x - offset })
}

// function cameraTurn({ x }: { x: number }) {
//   camera.value.angle += x || 0
// }

// function cameraMove({ x, y }: { x: number; y: number }) {
//   camera.value.x += x
//   camera.value.y += y
// }

// function cameraZoom(amount: number) {
//   camera.value.zoom += amount
// }

function resize() {
  camera.value.x = (window.innerWidth || 1000) * 0.5
  camera.value.y = (window.innerHeight || 800) * 0.7
}

window.addEventListener("resize", resize)
nextTick(resize)
</script>

<template>
  <div id="info">
    <FlightIndicator />
    <div>
      <div>Angle: {{ car.angle }}°</div>
      <div>Accel: {{ accel }}</div>
      <div>Gyro: {{ gyro }}</div>
      <div>Speed: {{ speed }}</div>
    </div>
    <div>
      <JoystickHandle @change="setMotorThrottles" />
      <!-- <KeyboardControl @turn="cameraTurn" @move="cameraMove" @zoom="cameraZoom" /> -->
    </div>
  </div>

  <ThreeDeeWorld
    :camera-pos-x="camera.x"
    :camera-pos-y="camera.y"
    :camera-pos-z="camera.z"
    :camera-angle-x="camera.angle"
    :camera-angle-y="-car.angle"
    :camera-zoom="camera.zoom"
  >
    <TheCar
      :motor-speed-left="leftMotorSpeed"
      :motor-speed-right="rightMotorSpeed"
      :direction="car.angle"
    />
  </ThreeDeeWorld>
</template>

<style lang="scss">
#info {
  width: 100%;
  display: grid;
  grid-template-columns: 200px auto 200px;
  grid-column-gap: 20px;
  z-index: 999;

  p {
    color: white;
  }
}

#title {
  font-size: 27px;
  color: white;
  grid-column-start: 1;
  grid-column-end: 4;
}

#car-info {
  grid-column-start: 2;
  grid-column-end: 4;
}

#app {
  background: url("./assets/background.jpeg");
  background-size: cover;
}
</style>
