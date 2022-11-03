<script setup lang="ts">
import JoystickHandle from "./components/JoystickHandle.vue"
import ThreeDeeWorld from "./components/ThreeDeeWorld.vue"
import KeyboardControl from "./components/KeyboardControl.vue"
import TheCar from "./components/TheCar.vue"
import { useSocket } from "./lib/WebSockets"
import { nextTick, ref } from "vue"

const camera = ref({ x: 450, y: 400, z: 0, angle: -10, zoom: 0 })
const car = ref({ x: 0, y: 0, angle: 0 })
const leftMotorSpeed = ref(0)
const rightMotorSpeed = ref(0)

type MotorInfo = { throttle: number }
type CarInfo = {
  orientation: number
  leftMotor: MotorInfo
  rightMotor: MotorInfo
  posX: number
  posY: number
}

const socket = useSocket()

socket.on("hi", () => {
  socket.emit("hi", ["REMOTE_CONTROL", "COCKPIT"])
})

socket.on("car-position", (info: CarInfo) => {
  car.value.x = +info.posX
  car.value.y = +info.posY
  car.value.angle = -info.orientation
  leftMotorSpeed.value = info.leftMotor.throttle
  rightMotorSpeed.value = info.rightMotor.throttle
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

function cameraTurn({ x }: { x: number }) {
  camera.value.angle += x || 0
}

function cameraMove({ x, y }: { x: number; y: number }) {
  camera.value.x += x
  camera.value.y += y
}

function cameraZoom(amount: number) {
  camera.value.zoom += amount
}

function posAndAngle({ x, y, angle }: Record<string, number>) {
  return x.toFixed(3) + "/" + y.toFixed(3) + ", " + angle + "°"
}

function resize() {
  camera.value.x = (window.innerWidth || 1000) * 0.5
  camera.value.y = (window.innerHeight || 800) * 0.7
}

window.addEventListener("resize", resize)
nextTick(resize)
</script>

<template>
  <div id="info">
    <div id="title">Zerberus</div>

    <p>Camera:</p>
    <p>{{ posAndAngle(camera) }}</p>
    <KeyboardControl @turn="cameraTurn" @move="cameraMove" @zoom="cameraZoom" />

    <p>Car:</p>
    <p id="car-info">{{ posAndAngle(car) }}</p>

    <p>Motor throttles:</p>
    <p>{{ leftMotorSpeed + " / " + rightMotorSpeed }}</p>
  </div>

  <JoystickHandle @change="setMotorThrottles" />

  <ThreeDeeWorld
    :camera-pos-x="camera.x"
    :camera-pos-y="camera.y"
    :camera-pos-z="camera.z"
    :camera-angle-x="camera.angle"
    :camera-angle-y="-car.angle"
    :camera-zoom="camera.zoom"
  >
    <TheCar :motor-speed-left="leftMotorSpeed" :motor-speed-right="rightMotorSpeed" :direction="car.angle" />
  </ThreeDeeWorld>
</template>

<style lang="scss">
#info {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  background: linear-gradient(0deg, rgb(5, 55, 64) 0, rgb(0, 212, 255) 100%);
}
</style>
