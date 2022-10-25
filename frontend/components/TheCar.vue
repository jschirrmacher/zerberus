<script setup lang="ts">
import CarWheel from "./CarWheel.vue"
import CarChassis from "./CarChassis.vue"

defineProps<{
  motorSpeedLeft: number
  motorSpeedRight: number
  direction?: number
}>()

const length = 250
const width = 500
const height = 125
const wheelDiameter = 180
const wheelWidth = 50
</script>

<template>
  <div class="car">
    <CarChassis :length="length" :width="width" :height="height" color="#000000" />
    <div class="left">
      <div class="back">
        <CarWheel :speed="motorSpeedLeft" :diameter="wheelDiameter" :width="wheelWidth" />
      </div>
      <div class="front">
        <CarWheel :speed="motorSpeedLeft" :diameter="wheelDiameter" :width="wheelWidth" />
      </div>
    </div>
    <div class="right">
      <div class="back">
        <CarWheel :speed="motorSpeedRight" :diameter="wheelDiameter" :width="wheelWidth" />
      </div>
      <div class="front">
        <CarWheel :speed="motorSpeedRight" :diameter="wheelDiameter" :width="wheelWidth" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.car {
  transform-origin: calc(v-bind(length) * 0.5px) 0 calc(v-bind(width) * 0.5px) !important;
  transform: translateX(calc(v-bind(length) * -0.5px)) translateY(calc(v-bind(wheelDiameter) * -1px))
    translateZ(calc(v-bind(width) * -0.5px)) rotateY(calc(v-bind(direction) * 1deg));
}

.left {
  transform: translateX(-50px);
}

.right {
  transform: translateX(300px);
}

.front {
  transform: translateY(calc(v-bind(wheelDiameter) * 1px)) translateZ(calc(v-bind(wheelDiameter) * 0.5px));
}

.back {
  transform: translateY(calc(v-bind(wheelDiameter) * 1px))
    translateZ(calc((v-bind(width) - v-bind(wheelDiameter) / 2) * 1px));
}
</style>
