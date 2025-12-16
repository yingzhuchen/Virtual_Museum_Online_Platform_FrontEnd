<template>
  <div :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size">
      <!-- 右上角 -->
      <line
        :x1="size"
        :y1="0"
        :x2="size"
        :y2="lineLength"
        :stroke="color"
        :stroke-width="lineWidth"
      />
      <line
        :x1="size - lineLength"
        :y1="0"
        :x2="size"
        :y2="0"
        :stroke="color"
        :stroke-width="lineWidth"
      />
      <!-- 左上角 -->
      <line :x1="0" :y1="0" :x2="lineLength" :y2="0" :stroke="color" :stroke-width="lineWidth" />
      <line :x1="0" :y1="0" :x2="0" :y2="lineLength" :stroke="color" :stroke-width="lineWidth" />
      <!-- 右下角 -->
      <line
        :x1="size"
        :y1="size"
        :x2="size - lineLength"
        :y2="size"
        :stroke="color"
        :stroke-width="lineWidth"
      />
      <line
        :x1="size"
        :y1="size"
        :x2="size"
        :y2="size - lineLength"
        :stroke="color"
        :stroke-width="lineWidth"
      />
      <!-- 左下角 -->
      <line
        :x1="0"
        :y1="size"
        :x2="lineLength"
        :y2="size"
        :stroke="color"
        :stroke-width="lineWidth"
      />
      <line
        :x1="0"
        :y1="size"
        :x2="0"
        :y2="size - lineLength"
        :stroke="color"
        :stroke-width="lineWidth"
      />
    </svg>
  </div>
</template>
<script setup lang="ts">
  const props = defineProps({
    size: {
      type: Number,
      default: 200,
    },
    lineLength: {
      type: Number,
      default: 60,
    },
    color: {
      type: String,
      default: 'black',
    },
    lineWidth: {
      type: Number,
      default: 10,
    },
  })
</script>
