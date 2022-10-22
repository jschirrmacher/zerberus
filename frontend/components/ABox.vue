<script setup lang="ts">
import { adjust } from "../lib/ColorUtils"

defineProps<{
  length: string
  width: string
  height: string
  color: string
}>()
</script>

<template>
  <div class="box">
    <div class="top"></div>
    <div class="bottom"></div>
    <div class="left"></div>
    <div class="right"></div>
    <div class="front"></div>
    <div class="back"></div>
  </div>
</template>

<style scoped lang="scss">
.box {
  > div {
    position: absolute;
    transform-style: preserve-3d;
    transition: all 1s linear;
    transform-origin: 0 0;
  }

  .top,
  .bottom {
    width: v-bind(length);
    height: v-bind(width);
    background-color: v-bind(adjust(color, 0));
  }

  .front,
  .back {
    width: v-bind(length);
    height: v-bind(height);
    background-color: v-bind(adjust("#000000", 10));
  }

  .left,
  .right {
    width: v-bind(width);
    height: v-bind(height);
    background-color: v-bind(adjust("#000000", 20));
  }

  .top {
    transform: rotateX(90deg);
  }

  .bottom {
    transform: translateZ(calc(v-bind(width))) translateY(calc(v-bind(height))) rotateX(-90deg);
  }

  .front {
    transform: translateX(calc(v-bind(length))) translateZ(calc(v-bind(width))) rotateY(180deg);
  }

  .left {
    transform: rotateY(-90deg);
  }

  .right {
    transform: translateX(calc(v-bind(length))) rotateY(-90deg);
  }
}
</style>
