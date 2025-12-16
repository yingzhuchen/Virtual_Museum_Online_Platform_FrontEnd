<template>
  <div
    v-if="fullMapVisible"
    class="absolute w-full h-full top-0 left-0 z-5"
    style="background: rgba(0, 0, 0, 0.3)"
  >
    <div
      class="absolute mt-25 ml-30 overflow-hidden z-10 bg-[#24324f]"
      :style="{ width: `${props.width}px`, height: `${props.height}px` }"
      @mousedown="startDrag"
      @mousemove="drag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
      @wheel="onWheel"
      @click="gridOnClick"
    >
      <svg
        class="absolute transition-all z-0 bg-#fefefa"
        :style="{
          transform: `scale(${svgScale})`,
          width: `${props.width}px`,
          height: `${props.height}px`,
        }"
      >
        <line
          v-for="line in gridLines.verticle"
          :key="line.id"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          :stroke="lineColor"
          :stroke-width="lineWidth"
        />
        <line
          v-for="line in gridLines.horizontal"
          :key="line.id"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          :stroke="lineColor"
          :stroke-width="lineWidth"
        />
        <circle
          v-for="(circle, index) in circles"
          class="cursor-pointer"
          :key="index"
          :cx="circle.x * 100 + circleOffsetX + props.width / 2"
          :cy="circle.y * 100 + circleOffsetY + props.height / 2"
          :r="circleRadius / svgScale"
          :fill="circle.color"
          stroke="gray"
          stroke-width="1"
          @click.stop="circleOnClick(circle, index)"
        ></circle>
      </svg>
      <svg
        class="absolute z-1"
        :style="{ width: `${props.width}px`, height: `${props.height}px` }"
        pointer-events="none"
      >
        <line
          v-for="line in boundLines"
          :key="line.id"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          :stroke="edgeColor"
          :stroke-width="edgeWidth * 2"
        />
      </svg>
      <Position class="z-3" :style="iconStyle" />
      <grid-selecter
        v-if="showGridSelecter"
        class="absolute top-0 left-0 z-0.5"
        :size="circleRadius * 2 + 20"
        :lineLength="circleRadius - 3"
        :color="'grey'"
        :style="gridSelecterStyle"
      ></grid-selecter>
    </div>
    <!-- 直接运算出div距离屏幕左侧的位置。 +120是因为左半边又一个ml-30，即120px -->
    <div
      class="absolute mt-25 mx-16 z-50 text-white"
      :style="{
        top: 0,
        left: `${props.width + 120}px`,
        height: `${props.height}px`,
      }"
    >
      <div v-if="infoVisible">
        <template v-if="annotationInfo.type === 'introduction'">
          <div class="text-[26px] mb-4">介绍点</div>
          <div class="text-[20px] mb-4">位置：{{ annotationInfo?.name }}</div>
          <div v-if="annotationInfo.imageUrl">
            <el-image
              :src="annotationInfo.imageUrl"
              :preview-src-list="[annotationInfo.imageUrl]"
              :max-scale="1.4"
              :min-scale="0.8"
              fit="cover"
              class="w-full rounded mb-3"
            />
          </div>
          <div v-else-if="annotationInfo.video">
            <!-- muted = false 默认视频静音 -->
            <video
              :src="annotationInfo.video"
              class="w-full rounded mb-3"
              autoplay
              controls
              muted="false"
            />
          </div>
          <div class="text-[18px]">{{ annotationInfo?.introduction }}</div>
          <!-- TODO icon改为icons-vue/Position -->
          <hsr-button
            class="min-w-xl w-10 mt-12"
            text="去这里"
            icon="success"
            @click="TransportToTargetPosition(annotationInfo.targetPosition)"
          ></hsr-button>
        </template>
        <template v-else-if="annotationInfo.type === 'transmission'">
          <div class="text-[26px] mb-4">传送点</div>
          <div class="text-[20px] mb-4">位置：{{ annotationInfo?.name }}</div>
          <div class="text-[18px]"
            >将传送到：{{ transmissionInfo?.toScene
            }}{{ transmissionInfo?.toAnnotation ? `-${transmissionInfo.toAnnotation}` : '' }}</div
          >
          <hsr-button
            class="min-w-xl w-10 mt-12"
            text="去这里"
            icon="success"
            @click="TransportToTargetPosition(annotationInfo.targetPosition)"
          ></hsr-button>
        </template>
        <template v-else>
          <!-- TODO 异常情况 -->
        </template>
      </div>
      <div v-else>
        <div class="bg-[#282828] b-white b-solid b-1px rounded-[30px] w-77 h-12.5 flex items-center justify-between px-4">
          <div class="text-center text-[24px] text-white flex-1">选择标记</div>
          <div class="text-[24px] text-gray">></div>
          <div class="text-[24px] text-white">></div>
        </div>

        <el-scrollbar
          :height="props.height - 88"
          class="mt-8 bg-[#eeeeee] w-85 border border-solid border-gray-200 border-1"
        >
          <div
            v-for="(circle, index) in circles"
            :key="index"
            class="flex flex-col"
            :class="selected === index ? 'bg-[#282828] text-white' : 'bg-white text-[#282828]'"
          >
            <div
              class="flex p-4 cursor-pointer b-color-[#bbbbbb] b-solid b-1px"
              @click="selectCircle(index)"
            >
              <div class="my-2 flex items-center">
                <div class="text-[20px] mx-4">✦</div>
                <div class="text-[20px] line-clamp-1">
                  {{ circle.annotation.name }}
                </div>
              </div>
            </div>

            <transition name="expand">
              <div v-if="selected === index" class="bg-[#eeeeee]">
                <div v-if="circle.annotation.data.type === 'introduction'">
                  <div
                    v-if="circle.annotation.data.briefIntroduction"
                    class="text-18px px-8 pt-4 text-[#817E7E] line-clamp-3"
                  >
                    {{ circle.annotation.data.briefIntroduction }}
                  </div>
                  <div
                    v-if="circle.annotation.data.imageUrl"
                    class="flex justify-center py-2 px-8 w-80%"
                  >
                    <el-image
                      class="rd-tr-16px"
                      v-if="circle.annotation.data.imageUrl"
                      :src="circle.annotation.data.imageUrl"
                      :min-scale="0.8"
                      :max-scale="1.4"
                      :preview-src-list="[circle.annotation.data.imageUrl]"
                    />
                  </div> </div
                ><div v-else-if="circle.annotation.data.type === 'transmission'" class="my-1">
                  <div class="text-18px px-8 pt-4 text-[#817E7E]">
                    目标场景：{{ sceneNames.get(circle.annotation.data.toSceneId) }}
                  </div>
                </div>
                <div class="flex justify-end">
                  <hsr-button
                    class="min-w-xl w-10 m-3"
                    text="查看"
                    icon="success"
                    @click="
                      TransportToTargetPosition({
                        x: circle.annotation.getWorldPosition().x,
                        y: circle.annotation.getWorldPosition().y,
                        z: circle.annotation.getWorldPosition().z,
                      })
                    "
                  ></hsr-button></div
              ></div>
            </transition>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Position } from '@element-plus/icons-vue'
  import GridSelecter from './gridSelecter.vue'
  import type { KeyBindingLayout } from './key-binding-layout-hint.vue'
  import {
    Annotation,
    FullMapKeyState,
    IntroductionAnnotation,
    KeyInputState,
    SceneController,
    TransmissionAnnotation,
    fadeInOutTransportTo,
    type KeyInputContext,
    circles,
  } from '~/utils/scene'
  import {
    type AnnotationIntroduction,
    type AnnotationResponse,
    type AnnotationTransmission,
  } from '~/api'

  const annotations = ref<AnnotationResponse[]>([])
  const selected = ref<number | null>(null)

  type Circle = {
    x: number
    y: number
    color: string
    annotation: Annotation
  }
  export interface DataProps {
    step: number
    lineColor: string
    width: number
    height: number
    edgeWidth: number
    edgeColor: string

    circles: Circle[] //内有Annotation信息
    circleRadius: number

    characterRotation: number
    keyInputContext?: KeyInputContext
    sceneController?: SceneController
  }

  defineExpose({
    show() {
      fullMapVisible.value = true
      if (!props.keyInputContext) return
      //将原有的所有inputState暂存，只应用fullMap的inputState
      let tmpState = props.keyInputContext.popState()
      while (tmpState) {
        originKeyStatesStack.push(tmpState)
        tmpState = props.keyInputContext.popState()
      }
      props.keyInputContext?.pushState(new FullMapKeyState(onPressKeyQ))
      keyBindingLayout.value = 'minimap'
    },
  })

  const fullMapVisible = ref(false)

  type Line = { id: string; x1: number; y1: number; x2: number; y2: number }
  type GridLines = { verticle: Line[]; horizontal: Line[] }

  const api = useApi('scene')
  const route = useRoute()

  const props = defineProps<DataProps>()
  const lineWidth = defineModel<number>('lineWidth', { default: 1 })

  //左下键位提示
  const keyBindingLayout = defineModel<KeyBindingLayout>('keyBindingLayout')
  const originKeyStatesStack: KeyInputState[] = []

  //缩放
  const svgScale = ref(1)
  //网格 当宽高不是step的整数倍时，需要额外补齐一格
  const extendX = computed(() => (props.step - (props.width % props.step)) % props.step)
  const extendY = computed(() => (props.step - (props.height % props.step)) % props.step)

  //网格
  const gridLines = ref<GridLines>({ verticle: [], horizontal: [] })
  const boundLines = computed<Line[]>(() => [
    { id: 'UpperBound', x1: 0, y1: 0, x2: props.width, y2: 0 },
    { id: 'LowerBound', x1: 0, y1: props.height, x2: props.width, y2: props.height },
    { id: 'LeftBound', x1: 0, y1: 0, x2: 0, y2: props.height },
    { id: 'RightBound', x1: props.width, y1: 0, x2: props.width, y2: props.height },
  ])

  ///拖拽相关参数
  const dragging = ref(false)
  const lastX = ref(0)
  const lastY = ref(0)
  const circleOffsetX = ref(10)
  const circleOffsetY = ref(0)

  //annotation信息
  const annotationInfo = ref<any>()
  const transmissionInfo = ref<any>()
  const infoVisible = ref(false)

  //selecter参数
  const showGridSelecter = ref(false)
  const selectedCircle = ref(-1)

  const iconStyle = computed(() => ({
    width: `${40}px`,
    height: `${40}px`,
    color: 'yellow',
    transform: `translate(${svgScale.value * circleOffsetX.value + props.width / 2 - 20}px, ${svgScale.value * circleOffsetY.value + props.height / 2 - 20}px)
      rotate(${-props.characterRotation - 45}deg)`,
    // 如果想要平滑效果，建议只匹配要平滑的效果，不要匹配 transform 或者 all，不然拖动会一卡一卡的（动画没播完被取消了）
    // transition: 'transform 1s ease-in-out',
  }))
  const gridSelecterStyle = computed(() => ({
    //基于圆的位置移动selecter，然后因为圆心坐标和selecter的原点坐标不重合，所以进行了一个转换
    transform: `translate(
        ${svgScale.value * (circleOffsetX.value + 100 * props.circles[selectedCircle.value].x) - (props.circleRadius + 10) + props.width / 2}px,
       ${svgScale.value * (circleOffsetY.value + 100 * props.circles[selectedCircle.value].y) - (props.circleRadius + 10) + props.height / 2}px)`,
    // 如果想要平滑效果，建议只匹配要平滑的效果，不要匹配 transform 或者all，不然拖动会一卡一卡的（动画没播完被取消了）))
    // transition: 'transform 1s ease-in-out',
  }))

  onMounted(() => {
    watch(
      () => route.query.id,
      async () => {
        const sceneId = parseInt(route.query.id as string)
        if (!sceneId) return
        try {
          const resp = await useApi('scene').listAnnotation(sceneId)
          annotations.value = resp.data
        } catch (error) {
          handleApiError('获取标记列表', error)
        }
      },
      { immediate: true },
    )
    watch(
      () => [props.step, props.width, props.height],
      () => {
        createGrid()
      },
      { immediate: true },
    )
  })

  //初始化网格，将线条绘制到svg中
  function createGrid() {
    let lines: GridLines = { verticle: [], horizontal: [] }
    for (let x = 0; x <= props.width + extendX.value; x += props.step) {
      for (let y = 0; y <= props.height + extendY.value; y += props.step) {
        lines.verticle.push({
          id: `${x}-${y}`,
          x1: x,
          y1: 0,
          x2: x,
          y2: props.height + extendY.value,
        })
        lines.verticle.push({
          id: `${x}-${y}Extend`,
          x1: x,
          y1: -props.height - extendY.value,
          x2: x,
          y2: 0,
        })

        lines.horizontal.push({
          id: `${y}-${x}`,
          x1: 0,
          y1: y,
          x2: props.width + extendX.value,
          y2: y,
        })
        lines.horizontal.push({
          id: `${y}-${x}Extend`,
          x1: -props.width - extendX.value,
          y1: y,
          x2: 0,
          y2: y,
        })
      }
    }
    gridLines.value = lines
  }

  //#region 拖拽
  const startDrag = (e: MouseEvent) => {
    dragging.value = true
    lastX.value = e.clientX
    lastY.value = e.clientY
  }

  //处理网格的移动和标记点的移动
  const drag = (e: MouseEvent) => {
    if (dragging.value) {
      const dx = (e.clientX - lastX.value) / svgScale.value
      const dy = (e.clientY - lastY.value) / svgScale.value

      //更新标记位置
      circleOffsetX.value += dx
      circleOffsetY.value += dy
      //更新网格
      gridLines.value.horizontal.forEach((line) => {
        line.x1 += dx
        line.x2 += dx
        if (line.x2 < 0) {
          line.x1 += (props.width + extendX.value) * 2
          line.x2 += (props.width + extendX.value) * 2
        } else if (line.x1 > props.width + extendX.value) {
          line.x1 -= (props.width + extendX.value) * 2
          line.x2 -= (props.width + extendX.value) * 2
        }

        line.y1 += dy
        line.y2 += dy
        if (line.y1 < 0) {
          line.y1 = line.y2 += props.height + extendY.value
        } else if (line.y1 > props.height + extendY.value) {
          line.y1 = line.y2 -= props.height + extendY.value
        }
      })
      gridLines.value.verticle.forEach((line) => {
        line.x1 += dx
        line.x2 += dx
        if (line.x1 < 0) {
          line.x1 = line.x2 += props.width + extendX.value
        } else if (line.x1 > props.width + extendX.value) {
          line.x1 = line.x2 -= props.width + extendX.value
        }

        line.y1 += dy
        line.y2 += dy
        if (line.y2 < 0) {
          line.y1 += (props.height + extendY.value) * 2
          line.y2 += (props.height + extendY.value) * 2
        } else if (line.y1 > props.height + extendY.value) {
          line.y1 -= (props.height + extendY.value) * 2
          line.y2 -= (props.height + extendY.value) * 2
        }
      })
      lastX.value = e.clientX
      lastY.value = e.clientY
    }
  }

  const stopDrag = () => {
    dragging.value = false
  }
  //#endregion

  //滚动缩放
  const onWheel = (e: WheelEvent) => {
    const delta = e.deltaY / 1000
    let after = svgScale.value - delta
    let afterLineWidth = lineWidth.value + delta

    if (after > 2) after = 2
    else if (after < 1) after = 1
    if (afterLineWidth > 1) afterLineWidth = 1
    else if (afterLineWidth < 0.1) afterLineWidth = 0.1

    svgScale.value = after
    lineWidth.value = afterLineWidth
  }

  //点击事件
  function circleOnClick(circle: Circle, index: number) {
    selected.value = index
  }

  function gridOnClick() {
    selectedCircle.value = -1
    infoVisible.value = false
  }

  // 通过AnnotationID获取Annotation信息并且显示在界面上
  const getAnnotationInfo = async (annotation: Annotation) => {
    try {
      if (annotation instanceof IntroductionAnnotation) {
        const data: AnnotationIntroduction = annotation.data
        annotationInfo.value = {
          type: 'introduction',
          name: annotation.name,
          briefIntroduction: data.briefIntroduction,
          introduction: data.introduction,
          video: data.video,
          imageUrl: data.imageUrl,
          targetPosition: {
            x: annotation.getWorldPosition().x,
            y: annotation.getWorldPosition().y,
            z: annotation.getWorldPosition().z,
          },
        }
      } else if (annotation instanceof TransmissionAnnotation) {
        annotationInfo.value = {
          type: 'transmission',
          name: annotation.name,
          targetPosition: {
            x: annotation.getWorldPosition().x,
            y: annotation.getWorldPosition().y,
            z: annotation.getWorldPosition().z,
          },
        }
        transmissionInfo.value = {}

        const toScene = await api.getScene(annotation.data.toSceneId)
        transmissionInfo.value.toScene = toScene.name
        transmissionInfo.value.toSceneId = toScene.id
        if (annotation.data.toTransmissionAnnotationId) {
          const toAnnotation = await api.getAnnotationDetails(
            annotation.data.toTransmissionAnnotationId,
          )
          transmissionInfo.value.toAnnotation = toAnnotation.name
          transmissionInfo.value.targetPosition = {
            x: toAnnotation.positionX,
            y: toAnnotation.positionY,
            z: toAnnotation.positionZ,
          }
        }
      }
    } catch (err: any) {
      handleApiError('获取标记信息', err)
    } finally {
      infoVisible.value = true
    }
  }

  // Q退出地图
  function onPressKeyQ() {
    CloseFullMap()
  }
  function CloseFullMap() {
    fullMapVisible.value = false
    //复原原本的InputStates
    props.keyInputContext?.popState()
    while (originKeyStatesStack.length > 0) {
      props.keyInputContext?.pushState(originKeyStatesStack.pop()!)
    }
    keyBindingLayout.value = 'default'
  }

  function TransportToTargetPosition(targetPosition: { x: number; y: number; z: number }) {
    fadeInOutTransportTo(
      targetPosition.x,
      targetPosition.y,
      targetPosition.z,
      props.sceneController!,
      0.8,
    ) //也可以用smoothlyTransportTo
    CloseFullMap()
  }

  function selectCircle(index: number) {
    if (selected.value != index) {
      selected.value = index
    } else {
      selected.value = null
    }
  }

  let taskId: any
  const sceneNames = new Map()

  function getSceneInfo() {
    if (!circles.value) return
    circles.value?.forEach(async (circle) => {
      const data = circle.annotation.data as AnnotationTransmission
      const toSceneId = data.toSceneId
      if (toSceneId) {
        const scene = await useApi().getScene(toSceneId)
        sceneNames.set(toSceneId, scene.name)
      }
    })
    clearInterval(taskId)
  }

  onMounted(() => (taskId = setInterval(() => getSceneInfo(), 1000)))
</script>

<style scoped>
  .expand-enter-active,
  .expand-leave-active {
    max-height: 35vh;
    overflow: hidden;
    transition: max-height 0.5s ease-in;
  }
  .expand-enter-from,
  .expand-leave-to {
    max-height: 0;
    transition: max-height 0.5s ease-out;
  }
  .expand-leave-to {
    transition-duration: 0s;
  }
</style>
