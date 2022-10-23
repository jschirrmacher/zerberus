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

<style scoped lang="scss"></style>
