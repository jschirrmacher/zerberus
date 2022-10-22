<script setup lang="ts">
import wheel from "@/assets/wheel.svg"
</script>

<template>
  <div class="wheel">
    <img :src="wheel" />
    <img :src="wheel" />
  </div>
</template>

<style scoped lang="scss">
.wheel {
  img {
    width: 100px;
  }
}
</style>
