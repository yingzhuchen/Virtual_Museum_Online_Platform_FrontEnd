<template>
  <el-dialog
    class="!px-10 !py-7.5 !w-325 !h-170"
    v-model="dialogVisible"
    :show-close="false"
    @closed="onDialogClosed"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="flex items-center">
        <span :id="titleId" :class="['text-5', titleClass]">修改封面</span>
        <el-button class="ml-auto !text-6" :icon="ElIconClose" text @click="close"></el-button>
      </div>
    </template>

    <div class="flex">
      <!-- 裁剪区域 -->
      <div class="flex flex-col mt-7.5 w-179 h-102">
        <div class="flex items-center mb-4">
          <span class="font-bold">
            {{ isScreenshotMode ? '选取画面' : '拖拽选框裁剪 (16:9)' }}
          </span>
          <span
            v-if="isScreenshotMode || coverImage"
            class="ml-auto text-manager-primary cursor-pointer"
            @click="selectCover"
          >
            {{ isScreenshotMode ? '截取图片（快捷键 Enter）' : '更换图片' }}
          </span>
        </div>
        <div
          v-if="isScreenshotMode"
          id="screenshot-preview-container"
          class="bg-black w-full h-full flex items-center justify-center cursor-pointer"
          @click="selectCover"
        >
        </div>
        <cropper
          v-else-if="coverImage"
          class="w-179 h-102"
          :debounce="300"
          :src="coverImage"
          :stencil-props="{ aspectRatio: 16 / 9 }"
          @change="onResize"
        ></cropper>
        <div
          v-else
          class="bg-gray-100 w-full h-full flex items-center justify-center cursor-pointer"
          @click="selectCover"
        >
          请选择图片
        </div>
      </div>
      <!-- 预览区域 -->
      <div class="flex flex-col mt-7.5 ml-17.5">
        <span class="font-bold">预览封面</span>
        <el-image class="w-102.5 h-57.75 mt-4" :src="previewImg"></el-image>
      </div>
    </div>

    <div class="text-center">
      <el-button class="mt-15.5 w-34.5" size="large" type="primary" @click="onClickFinish">
        完成
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
  import { Cropper, type CropperResult } from 'vue-advanced-cropper'
  import { PlayerKeyInputState, SceneController } from '~/utils/scene'
  import 'vue-advanced-cropper/dist/style.css'

  const dialogVisible = ref(false)
  /** 截图模式，进入场景内截图 */
  const isScreenshotMode = ref(false)
  const coverImage = ref('')
  const previewImg = ref('')
  const sceneUrl = ref('')
  const sceneController = new SceneController()

  const emit = defineEmits<{
    (e: 'update', newCover: string): void
  }>()

  sceneController.settings.value.calcFps = false

  defineExpose({
    show(options: { cover?: string; sceneUrl?: string; reselect?: boolean }) {
      dialogVisible.value = true
      if (options.cover) coverImage.value = options.cover
      if (options.sceneUrl) {
        sceneUrl.value = options.sceneUrl
      }
      if (options.reselect) selectCover()
    },
  })

  watch(
    [isScreenshotMode, sceneUrl],
    async () => {
      if (isScreenshotMode.value && sceneUrl.value) {
        if (!sceneUrl.value) return
        try {
          const container = document.getElementById('screenshot-preview-container')
          if (!container) return
          await sceneController.init(container, LUMA_CAPTURE_BASE_URL + sceneUrl.value)
          sceneController.inputManager?.keyInputContext?.pushState(
            new PlayerKeyInputState(sceneController.player!),
          )
          document.addEventListener('keydown', onKeydown)
        } catch (e: any) {
          console.error(e)
          ElMessage.error(`场景加载失败：${e.message}`)
          dialogVisible.value = false
        }
      } else {
        sceneController.destroy()
        document.removeEventListener('keydown', onKeydown)
      }
    },
    { flush: 'post' }, // 等待 v-if 将 preview-container 挂载后再初始化
  )

  function onResize(event: CropperResult) {
    const img = event.canvas?.toDataURL('image/jpeg', 0.6)
    if (!img) return
    previewImg.value = img
  }

  function onDialogClosed() {
    coverImage.value = ''
    previewImg.value = ''
    sceneUrl.value = ''
    isScreenshotMode.value = false
    sceneController.destroy()
  }

  function onClickFinish() {
    if (!previewImg.value) return ElMessage.error('请选择图片')
    emit('update', previewImg.value)
    dialogVisible.value = false
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.code === 'Enter') selectCover()
  }

  async function selectCover() {
    if (isScreenshotMode.value) {
      coverImage.value = await sceneController.screenshot()
      isScreenshotMode.value = false
    } else {
      isScreenshotMode.value = true
    }
  }

  onBeforeUnmount(() => {
    sceneController.destroy()
    document.removeEventListener('keydown', onKeydown)
  })
</script>
