<script setup lang="ts">
import wheel from "@/assets/wheel.svg"
import { adjust } from "../lib/ColorUtils"

const diameter = 180
const radius = diameter / 2

const tireStyles = [...Array(32)].map((_, index) => {
  const color = adjust("#111111", (index & 1) * 5)
  return `transform: translateY(${radius}px) translateX(${radius}px) rotateY(90deg) rotateX(${
    index * 11.25 - 5
  }deg) translateY(${radius - (index & 1) * 5}px) rotateX(90deg); background-color: ${color}`
})
</script>

<template>
  <div class="wheel">
    <img class="side" :src="wheel" />
    <img class="side" :src="wheel" />
    <div v-for="(style, index) in tireStyles" :key="index" class="tire-tread" :style="style" />
  </div>
</template>

<style scoped lang="scss">
.wheel {
  .side {
    width: 180px;
  }

  .side + .side {
    transform: translateZ(-50px);
  }

  .tire-tread {
    background-color: #ff0000;
    width: 50px;
    height: 20px;
    transform: rotateY(90deg);
  }
}
</style>
