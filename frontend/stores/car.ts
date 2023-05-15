import { ref } from "vue"
import { defineStore } from "pinia"
import type { CarInfo } from "@/types"

export const useCarStore = defineStore("car", () => {
  const speed = ref(0)
  const orientation = ref(0)

  function setSpeed(newSpeed: number) {
    speed.value = newSpeed
  }

  function setOrientation(newOrientation: number) {
    orientation.value = newOrientation
  }

  function setInfo(info: CarInfo) {
    speed.value = info.speed
    orientation.value = info.orientation
  }

  return { speed, orientation, setSpeed, setOrientation, setInfo }
})
