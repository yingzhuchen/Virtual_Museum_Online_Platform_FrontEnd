<template>
  <client-only>
    <el-dialog v-model="dialogVisible" width="50%" align-center>
      <template #header>
        <div class="text-24px text-gray-800 ml-4">裁切图片</div>
      </template>
      <div class="flex justify-center items-center">
        <cropper
          class="w-150 h-100"
          :src="sourceImage"
          :debounce="300"
          :stencil-props="{
            aspectRatio: props.aspectRatio,
          }"
          image-restriction="stencil"
          @change="onResize"
        />
      </div>
      <template #footer>
        <el-button
          type="primary"
          size="default"
          class="m-auto"
          :disabled="!previewBlob"
          @click="finish"
          >确认</el-button
        >
      </template>
    </el-dialog>
  </client-only>
</template>

<script setup lang="ts">
  import { Cropper, type CropperResult } from 'vue-advanced-cropper'
  import 'vue-advanced-cropper/dist/style.css'

  const props = defineProps<{
    aspectRatio: number
  }>()

  defineExpose({
    show(imageUrl: string) {
      sourceImage.value = imageUrl
      dialogVisible.value = true
    },
  })

  const dialogVisible = ref(false)
  const sourceImage = ref('')
  const previewImg = ref('')
  const previewBlob = shallowRef<Blob>()

  const emit = defineEmits<{
    (e: 'update', newCoverBase64: string, newCoverBlob: Blob): void
  }>()

  function onResize(event: CropperResult) {
    previewBlob.value = undefined
    event.canvas?.toBlob(
      (blob) => {
        console.log('resize', blob)
        if (!blob) return ElMessage.error('图片裁切失败')
        previewBlob.value = blob
      },
      'image/jpeg',
      0.6,
    )
    const img = event.canvas?.toDataURL('image/jpeg', 0.6)

    if (!img) return
    previewImg.value = img
  }

  function finish() {
    if (!previewImg.value) return ElMessage.error('请选择图片')
    emit('update', previewImg.value, previewBlob.value!)
    dialogVisible.value = false
  }
</script>
