<script setup lang="ts">
const emit = defineEmits(["turn", "move", "zoom"])

const commands = {
  ArrowDown: () => emit("move", { x: 0, y: 50 }),
  ArrowUp: () => emit("move", { x: 0, y: -50 }),
  ArrowLeft: () => emit("move", { x: -50, y: 0 }),
  ArrowRight: () => emit("move", { x: 50, y: 0 }),
  ShiftArrowDown: () => emit("turn", { x: -5, y: 0 }),
  ShiftArrowUp: () => emit("turn", { x: 5, y: 0 }),
  ShiftArrowLeft: () => emit("turn", { x: 0, y: 5 }),
  ShiftArrowRight: () => emit("turn", { x: 0, y: -5 }),
  Plus: () => emit("zoom", 10),
  Minus: () => emit("zoom", -10),
} as Record<string, () => void>

const keyMap = {
  "+": "Plus",
  "-": "Minus",
}

function keydown(event: KeyboardEvent) {
  const key = keyMap[event.key as keyof typeof keyMap] || event.key
  const code = (event.shiftKey ? "Shift" : "") + key
  commands[code] && commands[code]()
}

window.addEventListener("keydown", keydown)
</script>

<template>
  <nav>
    <button id="ArrowUp" @click="commands.ArrowUp">ᐃ</button>
    <button id="ArrowLeft" @click="commands.ArrowLeft">ᐊ</button>
    <button id="ArrowRight" @click="commands.ArrowRight">ᐅ</button>
    <button id="ArrowDown" @click="commands.ArrowDown">ᐁ</button>
    <button id="Plus" @click="commands.Plus">+</button>
    <button id="Minus" @click="commands.Minus">&nbsp;</button>
  </nav>
</template>

<style scoped lang="scss">
button {
  height: 26px;
  width: 26px;
  line-height: 0px;
}

#Minus::before {
  content: "–";
  position: absolute;
  left: 7px;
  top: 10px;
}

#Plus::after,
#Minus::after {
  content: "";
  border: 1px solid #000000;
  width: 14.5px;
  height: 14.5px;
  display: inline-block;
  position: absolute;
  border-radius: 50%;
  top: 3.5px;
  left: 3.5px;
}
</style>
