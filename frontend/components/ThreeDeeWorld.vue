<script setup lang="ts">
import { ref, computed, nextTick } from "vue"

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

function resize() {
  const perspective = document.getElementById("perspective")
  cameraPos.value.x = (perspective?.clientWidth || 1000) * 0.5
  cameraPos.value.y = (perspective?.clientHeight || 800) * 0.7
}

window.addEventListener("resize", resize)
nextTick(resize)
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
        <div id="directions">
          <div id="north">N</div>
          <div id="north-east">NE</div>
          <div id="east">E</div>
          <div id="south-east">SE</div>
          <div id="south">S</div>
          <div id="south-west">SW</div>
          <div id="west">W</div>
          <div id="north-west">NW</div>
        </div>
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
  border-radius: 50%;
}

#x-axis,
#z-axis {
  width: 2px;
  height: 10000px;
  background-color: red;
}
#x-axis {
  transform: translateY(-1px) rotateZ(-90deg) translateY(-5000px);
}
#z-axis {
  transform: translateY(-1px) rotateX(-90deg) translateY(-5000px);
}

#directions {
  font-size: 100px;
  transform: translateX(-0.35em) translateY(-1.35em);

  #north {
    transform: rotateY(90deg) translateX(5000px) rotateY(270deg);
  }
  #north-east {
    transform: rotateY(45deg) translateX(5000px) rotateY(270deg);
  }
  #east {
    transform: translateX(5000px) rotateY(270deg);
  }
  #south-east {
    transform: rotateY(-45deg) translateX(5000px) rotateY(270deg);
  }
  #south {
    transform: rotateY(-90deg) translateX(5000px) rotateY(270deg) translateX(-0.6em);
  }
  #south-west {
    transform: rotateY(-135deg) translateX(5000px) rotateY(270deg);
  }
  #west {
    transform: rotateY(180deg) translateX(5000px) rotateY(270deg);
  }
  #north-west {
    transform: rotateY(135deg) translateX(5000px) rotateY(270deg);
  }
}
</style>
