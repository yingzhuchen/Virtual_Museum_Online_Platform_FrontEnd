<template>
  <div
    v-if="showSidebar"
    :class="[
      'absolute bottom-0 left-0 w-200 max-w-screen h-full flex pointer-events-none',
      brief ? 'gradient-brief' : 'gradient-full',
    ]"
  >
    <template v-if="data.type === 'introduction'">
      <!-- 简洁模式 -->
      <div v-if="brief" class="mt-auto mb-24 pl-16 pointer-events-auto w-100">
        <div class="mt-20 text-white text-27px font-bold mb-3">
          {{ name }}
        </div>
        <template v-if="data.imageUrl">
          <el-image
            class="w-full rounded"
            v-loading="!isImageLoaded"
            fit="cover"
            :src="data.imageUrl"
            @load="isImageLoaded = true"
            @error="isImageLoaded = true"
          >
            <template #error>
              <div
                class="bg-gray opacity-70 h-full w-full flex flex-col flex-justify-center flex-items-center"
              >
                <el-icon size="32"><el-icon-picture /></el-icon>
                <div>加载失败</div>
              </div>
            </template>
          </el-image>
        </template>
        <template v-else-if="data.video">
          <!-- muted = false 默认视频静音 -->
          <video :src="data.video" class="w-full rounded" autoplay controls muted="false" />
        </template>
        <div class="text-white mt-2">
          {{ data.briefIntroduction }}
        </div>
      </div>
      <!-- 显示详情 -->
      <div v-else class="w-100 pl-16 mb-24 h-full flex flex-col pointer-events-auto">
        <div class="flex items-center mt-12vh">
          <h1 class="text-white">
            {{ name }}
          </h1>
          <audio-play-button
            class="ml-4"
            v-if="data.audioUrl"
            :audio="data.audioUrl"
            :autoplay="autoplayVoice"
          ></audio-play-button>
        </div>
        <el-scrollbar class="!h-35vh text-white whitespace-pre-line" noresize>
          {{ data.introduction }}
        </el-scrollbar>
        <template v-if="data.imageUrl">
          <el-image
            class="w-full mt-6 rounded"
            v-loading="!isImageLoaded"
            fit="cover"
            :src="data.imageUrl"
            :max-scale="1.4"
            :min-scale="0.8"
            :preview-src-list="[data.imageUrl]"
            @load="isImageLoaded = true"
          >
            <template #error>
              <div
                class="h-full w-full flex flex-col flex-justify-center flex-items-center bg-gray"
              >
                <el-icon size="32"><el-icon-picture /></el-icon>
                <div>加载失败</div>
              </div>
            </template>
          </el-image>
        </template>
        <template v-else-if="data.video">
          <video :src="data.video" class="w-full mt-6 rounded" controls />
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { AnnotationData } from '~/api'
  import {
    IntroductionAnnotationInfoKeyState,
    SceneController,
    loadNewSceneWithAnimation,
    smoothlyTransportTo,
    type KeyInputContext,
  } from '~/utils/scene'
  import type { KeyBindingLayout } from './key-binding-layout-hint.vue'
  import type { Action } from 'element-plus'

  const props = defineProps<{
    data: AnnotationData
    name: string
    keyInputContext?: KeyInputContext
    sceneController: SceneController
  }>()
  const emit = defineEmits<{
    (e: 'close'): void
    (e: 'show-dialog'): void
    (e: 'hide-dialog'): void
  }>()

  const autoplayVoice = useLocalStorage<boolean>('autoplay-voice', true, { initOnMounted: true })

  const sceneApi = useApi('scene')
  const router = useRouter()
  const route = useRoute()

  const showSidebar = ref(false)
  const isImageLoaded = ref(false)
  const keyBindingLayout = defineModel<KeyBindingLayout>('keyBindingLayout')
  const brief = defineModel<boolean>('brief', {
    default: true,
  })

  async function onPressKeyF() {
    if (props.data.type === 'introduction') {
      if (!showSidebar.value) {
        props.sceneController.player!.speed = 0
        //如果在默认状态，则进入简略介绍状态
        props.keyInputContext?.pushState(
          new IntroductionAnnotationInfoKeyState(onPressKeyF, onPressKeyQ),
        )
        showSidebar.value = true
        brief.value = true
        keyBindingLayout.value = 'annotation-brief'
      } else {
        //如果在简略介绍状态，则进入详细介绍状态
        brief.value = false
        keyBindingLayout.value = 'annotation-detail'
      }
    } else if (props.data.type === 'transmission') {
      try {
        const scene = await batchGetScene(props.data.toSceneId)
        const targetAnnotation = props.data.toTransmissionAnnotationId
          ? await sceneApi.getAnnotationDetails(props.data.toTransmissionAnnotationId)
          : undefined
        emit('show-dialog')

        document.exitPointerLock()
        ElMessageBox.confirm(
          `是否要传送到${scene.name}${targetAnnotation ? `-${targetAnnotation.name}` : ''}？`,
          {
            confirmButtonText: '传送',
            cancelButtonText: '取消',
            callback: (action: Action) => {
              if (action === 'confirm') {
                if (parseInt(route.query.id as string) === scene.id) {
                  if (targetAnnotation)
                    smoothlyTransportTo(
                      targetAnnotation.positionX,
                      targetAnnotation.positionY,
                      targetAnnotation.positionZ,
                      props.sceneController,
                      1,
                    )
                } else {
                  router.push({
                    path: `/scene`,
                    query: {
                      id: scene.id,
                    },
                  })

                  if (targetAnnotation)
                    loadNewSceneWithAnimation(
                      3,
                      props.sceneController,
                      scene.id,
                      targetAnnotation.positionX,
                      targetAnnotation.positionY,
                      targetAnnotation.positionZ,
                    )
                  else loadNewSceneWithAnimation(3, props.sceneController, scene.id)
                }
              }
              emit('hide-dialog')
            },
          },
        )
      } catch (error) {
        handleApiError('获取传送信息', error)
      }
    }
  }

  function onPressKeyQ() {
    if (!brief.value) {
      brief.value = true
      keyBindingLayout.value = 'annotation-brief'
    } else {
      showSidebar.value = false
      props.sceneController.player!.speed = 10
      props.keyInputContext?.popState()
      emit('close')
    }
  }

  onMounted(() => {
    onPressKeyF()
  })
</script>

<style scoped>
  .gradient-brief {
    /* 使用线性渐变作为背景 */
    background: linear-gradient(to top right, #000000ff, #00000000 50%);
  }
  .gradient-full {
    background: linear-gradient(90deg, rgba(17, 24, 39, 0.95) -0.2%, rgba(17, 24, 39, 0) 100.4%);
  }
</style>
