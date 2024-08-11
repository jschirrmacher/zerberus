<script setup lang="ts">
import ABox from "./ABox.vue"

defineProps<{
  length: number
  width: number
  height: number
  color: string
}>()
</script>

<template>
  <ABox
    class="car-chassis"
    :length="length + 'px'"
    :width="width + 'px'"
    :height="height + 'px'"
    :color="color"
  />
</template>

<style scoped lang="scss"></style>
