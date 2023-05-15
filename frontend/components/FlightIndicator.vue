<script setup lang="ts">
import { computed } from "vue"
import { storeToRefs } from "pinia"
import { useCarStore } from "../stores/car"

const { speed, orientation } = storeToRefs(useCarStore())

const color = "rgba(255,0,0,0.7)"

const windroseDivisionWidth = 15
const windroseRadius = 320
const windrosePerimeter = 2 * windroseRadius * Math.PI
const windroseDashArray = computed(() => `${windroseDivisionWidth} ${windrosePerimeter / 12 - windroseDivisionWidth}`)

const transformText = computed(() => `rotate(${orientation.value})`)

const speedoMax = 15
const speedoRadius = 460
const speedoPerimeter = 2 * speedoRadius * Math.PI
const speedoArray = computed(() => {
  const val = speedoPerimeter * (Math.abs(speed.value) / speedoMax)
  return `${val} ${speedoPerimeter - val}`
})
const speedoStart = computed(() => (speedoPerimeter * 2) / 3)
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="200" height="200">
    <circle cx="500" cy="500" r="495" :stroke="color" stroke-width="10" fill="transparent" />
    <g id="windrose">
      <circle
        transform-origin="center center"
        class="speedo-divisions"
        cx="500"
        cy="500"
        :r="windroseRadius"
        fill="transparent"
        :stroke="color"
        stroke-width="80"
        :stroke-dasharray="windroseDashArray"
        :stroke-dashoffset="windroseDivisionWidth / 2"
      />
      <text :transform="transformText" x="500" y="120">N</text>
      <text :transform="transformText" x="940" y="530">E</text>
      <text :transform="transformText" x="500" y="990">S</text>
      <text :transform="transformText" x="80" y="530">W</text>
    </g>

    <line id="horizon-20" x1="300" x2="700" y1="300" y2="300" :stroke="color" stroke-width="7" />
    <line id="horizon-10" x1="200" x2="800" y1="400" y2="400" :stroke="color" stroke-width="7" />
    <line id="horizon--10" x1="200" x2="800" y1="600" y2="600" :stroke="color" stroke-width="7" />
    <line id="horizon--20" x1="300" x2="700" y1="700" y2="700" :stroke="color" stroke-width="7" />

    <circle
      id="speedo"
      cx="500"
      cy="500"
      :r="speedoRadius"
      fill="transparent"
      :stroke="color"
      stroke-width="80"
      :stroke-dasharray="speedoArray"
      :stroke-dashoffset="speedoStart"
    />

    <text data-v-0b94a63f="" y="600" x="500" style="font-size: 300px" fill="white">{{ speed }}</text>

    <line id="horizon" x1="0" x2="1000" y1="500" y2="500" :stroke="color" stroke-width="15" />
  </svg>
</template>

<style scoped>
text {
  font-size: 80px;
  text-anchor: middle;
}

#windrose text {
  transform-origin: center center;
  fill: white;
  font-size: 160px;
}
</style>
