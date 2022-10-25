<script setup lang="ts">
import { ref, computed } from "vue"

const cameraPos = ref({ x: 450, y: 400, z: 0 })
const cameraRot = ref({ x: -10, y: 0, z: 0 })

const commands = {
  ArrowDown: () => move({ y: 50 }),
  ArrowUp: () => move({ y: -50 }),
  ArrowLeft: () => move({ x: -50 }),
  ArrowRight: () => move({ x: 50 }),
  TurnArrowDown: () => turn({ y: -10 }),
  TurnArrowUp: () => turn({ y: 10 }),
  TurnArrowLeft: () => turn({ x: 10 }),
  TurnArrowRight: () => turn({ x: -10 }),
} as Record<string, () => void>

function keydown(event: KeyboardEvent) {
  const code = (event.shiftKey ? "Turn" : "") + event.code
  commands[code] && commands[code]()
}

window.addEventListener("keydown", keydown)

function move({ x, y }: { x?: number; y?: number }) {
  cameraPos.value.x += x || 0
  cameraPos.value.y += y || 0
}

function turn({ x, y }: { x?: number; y?: number }) {
  cameraRot.value.y += x || 0
  cameraRot.value.x += y || 0
}

const setupStyle = computed(() => {
  return {
    transform: `translate3d(${cameraPos.value.x}px,${cameraPos.value.y}px,${cameraPos.value.z}px)
      rotateX(${cameraRot.value.x}deg) rotateY(${cameraRot.value.y}deg) rotateZ(${cameraRot.value.z}deg`,
  }
})
</script>

<template>
  <nav>
    <button id="ArrowUp" @click="commands.ArrowUp">ᐃ</button>
    <button id="ArrowLeft" @click="commands.ArrowLeft">ᐊ</button>
    <button id="ArrowRight" @click="commands.ArrowRight">ᐅ</button>
    <button id="ArrowDown" @click="commands.ArrowDown">ᐁ</button>
  </nav>

  <div id="perspective">
    <div id="camera">
      <div id="setup" :style="setupStyle">
        <div id="floor" />
        <div id="x-axis"></div>
        <div id="z-axis"></div>
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
#perspective {
  color: #5c758e;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transform-origin: 0 0;
}

#camera {
  width: 100%;
  height: 100%;
  perspective: 3000px;
  perspective-origin: 50% 50%;
}

#setup,
#setup *,
#setup :deep(*) {
  transform-style: preserve-3d;
  transition: all 1s linear;
  position: absolute;
  transform-origin: 0 0;
}

#floor {
  top: 0;
  left: 0;
  width: 10000px;
  height: 10000px;
  background: #003300;
  transform: translate3d(-5000px, 0, -5000px) rotateX(90deg);
}

#x-axis,
#z-axis {
  width: 1px;
  height: 10000px;
  background-color: red;
}
#x-axis {
  transform: translateY(-1px) rotateZ(-90deg) translateY(-5000px);
}
#z-axis {
  transform: translateY(-1px) rotateX(-90deg) translateY(-5000px);
}
</style>
