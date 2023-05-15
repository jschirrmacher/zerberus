<script setup lang="ts">
import { ref, computed } from "vue"

const emit = defineEmits(["change"])

const handleSize = 50

function absolutePosition(el: HTMLElement) {
  let pos = { x: 0, y: 0 }
  while (el.parentNode !== document) {
    el = el.parentNode as HTMLElement
    pos.x += el.offsetLeft
    pos.y += el.offsetTop
  }
  return pos
}

const clamp = (min: number, max: number) => (val: number) => Math.floor(Math.min(Math.max(val, min), max))

const pad = ref(null as HTMLElement | null)
const padHandle = ref(null as HTMLElement | null)
let snapBackTimer: ReturnType<typeof setTimeout> | undefined
let pos = ref({ x: 0, y: 0 })

const padPos = computed(() => absolutePosition(padHandle.value as HTMLElement))
const padSize = computed(() => {
  if (!pad.value) {
    return { x: 200, y: 200 }
  }
  return {
    x: (pad.value as HTMLElement).clientWidth - handleSize,
    y: (pad.value as HTMLElement).clientHeight - handleSize,
  }
})

const handleCenter = computed(() => ({ x: handleSize / 2, y: handleSize / 2 }))
const padCenter = computed(() => ({ x: padSize.value.x / 2, y: padSize.value.y / 2 }))

const clampX = clamp(0, padSize.value.x - handleSize)
const clampY = clamp(0, padSize.value.y - handleSize)

const padHandleStyle = computed(() => {
  const x = ((pos.value.x / 100) * padSize.value.x) / 2 + padCenter.value.x
  const y = ((-pos.value.y / 100) * padSize.value.y) / 2 + padCenter.value.y
  return { top: y + "px", left: x + "px" }
})

function newPos(x: number, y: number) {
  pos.value.x = x
  pos.value.y = y
  emit("change", pos.value)
}

function handleMove(event: MouseEvent | TouchEvent) {
  event.preventDefault()
  const touches = (event as TouchEvent).touches
  const target = touches?.length ? touches[0] : (event as MouseEvent)
  newPos(
    Math.round(((clampX(target.clientX - padPos.value.x - handleCenter.value.x) / padSize.value.x) * 2 - 1) * 100),
    -Math.round(((clampY(target.clientY - padPos.value.y - handleCenter.value.y) / padSize.value.y) * 2 - 1) * 100)
  )
}

function backTowardsCenter() {
  if (pos.value.x || pos.value.y) {
    newPos(
      Math.abs(pos.value.x) < 5 ? 0 : Math.round(pos.value.x * 0.8),
      Math.abs(pos.value.y) < 5 ? 0 : Math.round(pos.value.y * 0.8)
    )
    snapBackTimer = setTimeout(backTowardsCenter, 20)
  } else {
    snapBackTimer = undefined
  }
}

function touchstart() {
  function removeHandler() {
    document.removeEventListener("mousemove", handleMove)
    document.removeEventListener("touchmove", handleMove)
    snapBackTimer = setTimeout(backTowardsCenter, 20)
  }

  snapBackTimer && clearTimeout(snapBackTimer)
  snapBackTimer = undefined
  document.addEventListener("mousemove", handleMove, { passive: false })
  document.addEventListener("touchmove", handleMove, { passive: false })
  document.addEventListener("mouseup", removeHandler, { passive: true, once: true })
  document.addEventListener("touchend", removeHandler, { passive: true, once: true })
}
</script>

<template>
  <div id="pad" ref="pad">
    <div id="pad-handle" ref="padHandle" :style="padHandleStyle" @mousedown="touchstart" @touchstart="touchstart"></div>
  </div>
</template>

<style scoped lang="scss">
#pad {
  max-width: 100vw;
  width: 200px;
  aspect-ratio: 1 / 1;
  border: 1px solid white;
  border-radius: calc(1px * v-bind(handleSize) / 2);
  background: #2d383a50;
  z-index: 9;

  &:hover {
    background: #2d383a80;
  }

  #pad-handle {
    position: absolute;
    width: calc(v-bind(handleSize) * 1px);
    height: calc(v-bind(handleSize) * 1px);
    background: #ed0a3f;
    border-radius: 50%;
    cursor: pointer;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      border-radius: 50%;
      box-shadow: inset -20px -20px 20px -20px #2d383a;
    }
  }
}
</style>
