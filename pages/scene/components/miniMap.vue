<template>
  <div class="relative top-10 left-10 w-70 h-70">
    <!-- 圆形背景 -->
    <svg class="w-full h-full rounded-full overflow-hidden" viewBox="0 0 200 200">
      <defs>
        <clipPath id="miniMapClipCircle">
          <circle cx="100" cy="100" r="95" />
        </clipPath>
      </defs>
      <circle
        class="stroke-current stroke-width-2 stroke-white fill-#C1C2C5"
        cx="100"
        cy="100"
        r="100"
      ></circle>
      <circle class="fill-#24324F" cx="100" cy="100" r="95"></circle>
      <!-- Annotations -->
      <g clip-path="url(#miniMapClipCircle)">
        <circle
          v-for="(circle, index) in circles"
          :key="index"
          :cx="(circle.x * 100) / ratio + 100"
          :cy="(circle.y * 100) / ratio + 100"
          :r="basicRadius * circle.scale * 0.5"
          :fill="circle.color"
        />
      </g>
    </svg>
    <div class="absolute top-0 left-0 w-full h-full flex">
      <el-icon class="m-auto origin-center" size="40" color="white" :style="iconStyle">
        <Position />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Position } from '@element-plus/icons-vue'

  export interface DataProps {
    circles: {
      x: number
      y: number
      scale: number
      color: string
    }[]
    basicRadius: number
    /** 比例尺 */
    ratio: number
    rotation: number
  }

  const props = defineProps<DataProps>()

  const iconStyle = computed(() => ({
    transform: `rotate(${-props.rotation - 45}deg)`,
  }))
</script>
