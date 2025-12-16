<template>
  <button
    type="button"
    :class="['hsr-button', disabled && 'opacity-60 active']"
    @click="!disabled && $emit('click')"
  >
    <div class="inner">
      <el-image :class="['icon', loading && 'animate-pulse animate-duration-1500']" :src="icon" />
      <div class="text-center w-full mr-1px select-none">{{ text }}</div>
    </div>
  </button>
</template>

<script setup lang="ts">
  import HsrButtonIconChecked from '~/assets/icons/hsr-button-icon-checked.svg'
  import HsrButtonIconEdit from '~/assets/icons/hsr-button-icon-edit.svg'

  const props = defineProps<{
    /**
     * @default success
     */
    icon: 'success' | 'edit'
    text: string
    loading?: boolean
    disabled?: boolean
  }>()

  defineEmits<{
    (e: 'click'): void
  }>()

  const icon = computed(() => {
    if (props.icon === 'edit') return HsrButtonIconEdit
    // default: success
    return HsrButtonIconChecked
  })
</script>

<style scoped>
  .hsr-button {
    padding: 10px 20px;
    border: 1px solid #f5f5f5;
    border-radius: 50px;
    background-color: #f5f5f5;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    color: rgba(0, 0, 0, 0.86);
    transition: all 0.1s ease;
    cursor: pointer;
    min-width: 120px;
    display: flex;
    padding: 2px;
    box-shadow: -1px 1px 3px 1px rgba(0, 0, 0, 0.4);
    &:hover,
    &.active {
      background-color: #e0e0e0;
      border: 1px solid #e0e0e0;
    }
    &:active {
      border: 1px solid white;
    }

    .inner {
      position: relative;
      display: flex;
      align-items: center;
      border-radius: 50px;
      width: 100%;
      padding: 2px 5px;
      border: 0.5px solid rgba(177, 177, 177, 1);
      transition: all 0.1s ease;
    }
    .icon {
      left: 6px;
      right: 20px;
      pointer-events: none;
      user-select: none;
    }
  }
</style>
