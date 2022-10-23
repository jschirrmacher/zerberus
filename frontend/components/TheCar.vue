<script setup lang="ts">
import CarWheel from "./CarWheel.vue"
import CarChassis from "./CarChassis.vue"

defineProps<{
  motorSpeedLeft: number
  motorSpeedRight: number
}>()

function speed(percent: number) {
  return {
    animationDuration: 5 - Math.abs(percent) / 25 + "s",
    animationDirection: percent < 0 ? "reverse" : "normal",
  }
}
</script>

<template>
  <div class="car">
    <CarChassis />
    <div class="left">
      <div class="back">
        <CarWheel :style="speed(motorSpeedLeft)" />
      </div>
      <div class="front">
        <CarWheel :style="speed(motorSpeedLeft)" />
      </div>
    </div>
    <div class="right">
      <div class="back">
        <CarWheel :style="speed(motorSpeedRight)" />
      </div>
      <div class="front">
        <CarWheel :style="speed(motorSpeedRight)" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.left {
  transform: translateZ(-20px);
}

.right {
  transform: translateZ(320px);
}

.front {
  transform: translateX(320px);
}
</style>
