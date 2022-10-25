<script setup lang="ts">
import ThreeDeeWorld from "./components/ThreeDeeWorld.vue"
import TheCar from "./components/TheCar.vue"
</script>

<template>
  <header>Zerberus</header>

  <ThreeDeeWorld>
    <TheCar :motor-speed-left="20" :motor-speed-right="100" />
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
