<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
  defineProps<{
    cameraPosX?: number
    cameraPosY?: number
    cameraPosZ?: number
    cameraAngleX?: number
    cameraAngleY?: number
    cameraAngleZ?: number
    cameraZoom?: number
  }>(),
  {
    cameraPosX: 0,
    cameraPosY: 0,
    cameraPosZ: 0,
    cameraAngleX: 0,
    cameraAngleY: 0,
    cameraAngleZ: 0,
    cameraZoom: 0,
  },
)

const setupStyle = computed(() => {
  return {
    transform: `translate3d(${props.cameraPosX}px,${props.cameraPosY}px,${props.cameraPosZ}px)
      rotateX(${props.cameraAngleX}deg) rotateY(${props.cameraAngleY}deg) rotateZ(${props.cameraAngleZ}deg`,
  }
})
</script>

<template>
  <div id="perspective">
    <div id="camera">
      <div
        id="setup"
        :style="setupStyle"
      >
        <!-- <div id="floor" />
        <div id="directions">
          <div id="north">N</div>
          <div id="north-east">NE</div>
          <div id="east">E</div>
          <div id="south-east">SE</div>
          <div id="south">S</div>
          <div id="south-west">SW</div>
          <div id="west">W</div>
          <div id="north-west">NW</div>
        </div> -->
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
  transition: all 0.1s linear;
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
