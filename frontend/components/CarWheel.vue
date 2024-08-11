<script setup lang="ts">
import wheel from "@/assets/wheel.svg"
import { computed } from "vue"
import { adjust } from "../lib/ColorUtils"

const props = defineProps<{
  diameter: number
  width: number
  speed?: number
}>()

const radius = props.diameter / 2
const treadDepth = 20

const animationSpeed = computed(() => {
  return {
    animationDuration: (props.speed ? 5 - Math.abs(props.speed) / 25 : 0) + "s",
    animationDirection: (props.speed || 0) < 0 ? "reverse" : "normal",
  }
})

const tireStyles = [...Array(32)].map((_, index) => {
  const color = adjust("#111111", (index & 1) * 5)
  return `transform: translateY(${radius}px) translateX(${radius}px) rotateY(90deg) rotateX(${
    index * 11.25 - 5
  }deg) translateY(${radius - (index & 1) * 5}px) rotateX(90deg) translateX(-${
    props.width / 2
  }px); background-color: ${color}`
})

const containerTransformOrigin = computed(() => `${radius}px ${props.width / 2}px`)
const containerTransformTranslate = computed(() => `${-radius}px, ${-radius * 2}px`)
</script>

<template>
  <div class="wheel-container">
    <div
      class="wheel"
      :style="animationSpeed"
    >
      <img
        class="side"
        :src="wheel"
      >
      <img
        class="side"
        :src="wheel"
      >
      <div
        v-for="(style, index) in tireStyles"
        :key="index"
        class="tire-tread"
        :style="style"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@keyframes rotation {
  from {
    transform: rotate(0);
  }

  to {
    transform: rotate(180deg);
  }
}

#setup .wheel-container {
  transform: translate(v-bind(containerTransformTranslate)) rotateY(90deg);
  transform-origin: v-bind(containerTransformOrigin);
}

#setup .wheel {
  transform-origin: calc(v-bind(radius) * 1px) calc(v-bind(radius) * 1px);
  animation: 0s linear 0s infinite normal none running rotation;

  .side {
    width: 180px;
    transform: translateZ(calc(v-bind(width) * -0.5px));
  }

  .side + .side {
    transform: translateZ(calc(v-bind(width) * 0.5px));
  }

  .tire-tread {
    background-color: #ff0000;
    width: calc(v-bind(width) * 1px);
    height: calc(v-bind(treadDepth) * 1px);
  }
}
</style>
