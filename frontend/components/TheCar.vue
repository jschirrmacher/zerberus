<script setup lang="ts">
import CarWheel from "./CarWheel.vue"
import CarChassis from "./CarChassis.vue"
</script>

<template>
  <div class="car">
    <CarWheel class="left back" />
    <CarWheel class="right back" />
    <CarChassis />
    <CarWheel class="left front" />
    <CarWheel class="right front" />
  </div>
</template>

<style scoped lang="scss">
.left.back {
  transform: translateZ(-20px);
}

.right.back {
  transform: translateZ(320px);
}

.left.front {
  transform: translateZ(-20px) translateX(320px);
}

.right.front {
  transform: translateZ(320px) translateX(320px);
}
</style>
