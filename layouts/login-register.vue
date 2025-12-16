<!-- 登录和注册页的布局 -->
<template>
  <div class="h-screen">
    <div class="bg-primary w-2/3 h-full float-left flex items-center">
      <div class="m-auto flex items-center">
        <el-icon size="144" color="white"><ElementPlus /></el-icon>
        <h1 class="text-white text-[72px] ml-8">Luma Studio</h1>
      </div>
    </div>
    <div class="w-1/3 h-full float-right">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElementPlus } from '@element-plus/icons-vue'
</script>
