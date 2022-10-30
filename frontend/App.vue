<script setup lang="ts">
import ThreeDeeWorld from "./components/ThreeDeeWorld.vue"
import TheCar from "./components/TheCar.vue"
import io from "socket.io-client"
import { ref } from "vue"

const socket = io("http://localhost:10000")

const direction = ref(0)
const leftMotorSpeed = ref(0)
const rightMotorSpeed = ref(0)

type MotorInfo = { throttle: number }
type CarInfo = {
  orientation: number
  leftMotor: MotorInfo
  rightMotor: MotorInfo
}

socket.on("hi", () => {
  socket.emit("hi", ["REMOTE_CONTROL", "COCKPIT"])
})

socket.on("car-position", ({ orientation, leftMotor, rightMotor }: CarInfo) => {
  direction.value = orientation
  leftMotorSpeed.value = leftMotor.throttle
  rightMotorSpeed.value = rightMotor.throttle
})
</script>

<template>
  <header>Zerberus</header>

  <ThreeDeeWorld>
    <TheCar :motor-speed-left="leftMotorSpeed" :motor-speed-right="rightMotorSpeed" :direction="direction" />
  </ThreeDeeWorld>
</template>

<style lang="scss">
header {
  font-size: 27px;
  color: black;
}

#app {
  background: linear-gradient(0deg, rgba(8, 99, 115, 1) 0, rgba(0, 212, 255, 1) 100%);
}
</style>
