<template>
  <div
    class="bg-white b-[#bbbbbb] b-solid b-1px shadow-md flex items-center w-40vw px-4 py-2 hover:scale-101 transform-origin-left-center transition"
  >
    <div>
      <div class="text-20px">
        {{ title }}
      </div>
      <div v-if="subTitle" class="text-gray-1 mt-1">
        {{ subTitle }}
      </div>
    </div>
    <div class="ml-auto">
      <slot name="input"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    title: string
    subTitle?: string
  }>()
</script>
