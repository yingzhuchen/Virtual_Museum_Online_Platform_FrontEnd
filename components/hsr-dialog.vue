<template>
  <div>
    <transition name="dialog-scroll" @before-enter="beforeEnter" @enter="enter" @leave="leave">
      <div
        v-if="showDialog"
        v-bind="$attrs"
        :class="['dialog-wrapper', !noPadding && 'p-5']"
        :style="{ zIndex }"
      >
        <div v-if="showClose" class="absolute top-4 right-4 z-1" @click="onClickCloseDialog">
          <el-icon-close
            class="m-auto w-6 h-6 transition-all duration-100 cursor-pointer hover:scale-110 active:scale-90"
            :color="clsBtnColor ?? 'white'"
          />
        </div>

        <template v-if="title">
          <!-- 采用绝对布局是为了避开 dialog-wrapper 的 padding -->
          <div
            class="absolute top-0 left-0 w-full bg-#303030 px-4 h-13 flex items-center text-white text-24px select-none"
          >
            {{ title }}
          </div>
          <!-- 把 body 顶起来 -->
          <div class="h-13"></div>
        </template>

        <div :class="['flex-1 w-full h-full', contentClass]">
          <slot></slot>
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div
        v-if="showDialog"
        class="dialog-backdrop"
        :style="{ zIndex: zIndex - 1 }"
        @click.self="onClickCloseDialog"
      ></div>
    </transition>
  </div>
</template>

<script setup lang="ts">
  import { useZIndex } from 'element-plus'
  import { DialogKeyState, type KeyInputContext } from '~/utils/scene'

  const { nextZIndex } = useZIndex()

  defineOptions({
    inheritAttrs: false,
  })

  const props = withDefaults(
    defineProps<{
      showClose?: boolean
      title?: string
      /** 是否禁用 wrapper 的内部填充 */
      noPadding?: boolean
      clsBtnColor?: string
      contentClass?: string
      beforeClose?: (done: () => void) => void
      keyInputContext?: KeyInputContext
    }>(),
    {
      showClose: true,
    },
  )
  const showDialog = defineModel<boolean>()
  // 兼容 Element Plus 的一些事件
  const emit = defineEmits<{
    (e: 'open'): void
    (e: 'close'): void
  }>()
  // Dialog 本体的 zIndex，遮罩比它低一层
  const zIndex = ref(nextZIndex())

  watch(showDialog, () => {
    if (showDialog.value) {
      emit('open')
      // 跟随 Element Plus 的全局 zIndex 递增
      // 每次要申请两次 zIndex，因为 dialog-backdrop 的 zIndex 是 dialog-wrapper 的 zIndex - 1
      nextZIndex()
      zIndex.value = nextZIndex()
    } else {
      emit('close')
    }
  })

  function beforeEnter(el: Element) {
    if (!(el instanceof HTMLElement)) return
    el.style.transform = 'translate(-50%, -45%) scaleX(0.2)'
    el.style.opacity = '0'
  }

  function enter(el: Element, done: () => void) {
    if (!(el instanceof HTMLElement)) return
    setTimeout(() => {
      el.style.transition = 'all 0.2s ease-in-out'
      el.style.transform = 'translate(-50%, -50%) scaleX(1)'
      el.style.opacity = '1'
      setTimeout(() => {
        el.style.transition = ''
        done()
      }, 300)
    }, 0)
  }

  function leave(el: Element, done: () => void) {
    if (!(el instanceof HTMLElement)) return
    el.style.transition = 'all 0.2s ease-in-out'
    el.style.transform = 'translate(-50%, -45%) scaleX(0.2)'
    el.style.opacity = '0'
    setTimeout(() => {
      done()
    }, 300)
  }

  function onClickCloseDialog() {
    function close() {
      showDialog.value = false
    }
    if (props.beforeClose) {
      props.beforeClose(close)
    } else {
      close()
    }
  }

  function onPressEscape() {
    onClickCloseDialog()
  }
  const state = new DialogKeyState(onPressEscape)
  // 按 Esc 关闭弹窗
  watchEffect(() => {
    if (props.showClose && showDialog.value) {
      props.keyInputContext?.pushState(state)
    } else {
      props.keyInputContext?.removeState(state)
    }
  })
</script>

<style scoped>
  .dialog-wrapper {
    position: absolute;
    display: flex;
    flex-direction: column;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 0px 35px 0px 0px;
    overflow: hidden;
    min-width: 500px;
    min-height: 300px;
    background-color: #f5f5f5;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .dialog-scroll-enter-active,
  .dialog-scroll-leave-active {
    overflow: hidden;
  }

  .dialog-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1040;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.4s;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
