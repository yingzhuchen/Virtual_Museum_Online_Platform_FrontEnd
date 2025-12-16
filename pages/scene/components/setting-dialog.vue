<template>
  <hsr-dialog
    class="w-70vw h-75vh"
    v-model="showDialog"
    no-padding
    cls-btn-color="black"
    :key-input-context="keyInputContext"
  >
    <div class="flex h-full min-w-[50rem]">
      <el-menu
        class="w-20% h-full pt-15vh"
        background-color="#2e2e2e"
        active-text-color="#ffca42"
        text-color="#fff"
        :default-active="curIndex"
        @select="swtchPage"
      >
        <el-menu-item index="1" class="!h-21">
          <div class="ml-4">
            <el-icon size="20px"><picture-rounded /></el-icon>
            <span class="ml-2 text-24px">图像</span>
          </div>
        </el-menu-item>
        <el-menu-item index="2" class="!h-21">
          <div class="ml-4">
            <el-icon size="20px"><switch-filled /></el-icon>
            <span class="ml-2 text-24px">控制</span>
          </div>
        </el-menu-item>
        <el-menu-item index="3" class="!h-21">
          <div class="ml-4">
            <el-icon size="20px"><more-filled /></el-icon>
            <span class="ml-2 text-24px">其他</span>
          </div>
        </el-menu-item>
      </el-menu>
      <div class="w-75% h-full pt-10vh pl-16">
        <el-scrollbar class="w-full">
          <template v-if="curIndex == '1'">
            <div class="text-28px font-semibold">基础选项</div>
            <hsr-input
              title="画面预设"
              sub-title="我们为您准备了多套配置选项，可直接使用。"
              class="mt-6"
            >
              <template #input>
                <el-select
                  v-model="graphicPreset"
                  placeholder="选择"
                  class="!w-24"
                  @change="setGraphicPreset"
                >
                  <el-option
                    v-for="item in graphicPresets"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </template>
            </hsr-input>
            <hsr-input title="显示准星" class="mt-6">
              <template #input>
                <el-switch v-model="showCrosshair" @change="setCrosshairVisible" />
              </template>
            </hsr-input>

            <div class="flex items-center mt-12">
              <div class="text-28px font-semibold cursor-pointer" @click="expandOpts = !expandOpts"
                >进阶选项</div
              >
              <el-icon class="ml-2 cursor-pointer" size="24" @click="expandOpts = !expandOpts">
                <arrow-down-bold v-if="expandOpts" />
                <arrow-right-bold v-else />
              </el-icon>
            </div>
            <transition name="fade">
              <div v-if="expandOpts">
                <hsr-input
                  title="抗锯齿"
                  sub-title="高质量的多采样抗锯齿，可平滑图像中锯齿状边缘的外观。"
                  class="mt-6"
                >
                  <template #input>
                    <el-select
                      v-model="antiAliasing"
                      placeholder="选择"
                      class="!w-24"
                      @change="setAntiAliasing(true)"
                    >
                      <el-option
                        v-for="item in antiAliasingOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </template>
                </hsr-input>
                <hsr-input title="分辨率" class="mt-6">
                  <template #input>
                    <el-select
                      v-model="screenResolution"
                      placeholder="选择"
                      class="!w-24"
                      @change="setScreenResolution(true)"
                    >
                      <el-option
                        v-for="item in screenResolutionOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </template>
                </hsr-input>
                <hsr-input title="显示帧率" class="mt-6">
                  <template #input>
                    <el-switch v-model="showFrameRate" @change="setFrameRateVisible" />
                  </template>
                </hsr-input> </div
            ></transition>
          </template>
          <template v-else-if="curIndex == '2'">
            <hsr-input title="鼠标灵敏度" class="mt-16">
              <template #input>
                <div class="flex w-400px items-center">
                  <el-slider
                    v-model="mouseSensitivity"
                    :format-tooltip="formatTooltip"
                    :step="5"
                    :min="30"
                    :max="70"
                    @change="setMouseSensitivity"
                  />
                  <span class="ml-6">{{ (mouseSensitivity / 50).toFixed(1) }}</span>
                </div>
              </template>
            </hsr-input>
            <hsr-input title="移动速度" class="mt-8">
              <template #input>
                <div class="flex w-400px items-center">
                  <el-slider
                    v-model="movementSpeed"
                    :format-tooltip="formatTooltip"
                    :step="5"
                    :min="30"
                    :max="70"
                    @change="setMovementSpeed"
                  />
                  <span class="ml-6">{{ (movementSpeed / 50).toFixed(1) }}</span>
                </div>
              </template>
            </hsr-input>
            <hsr-input title="视角" class="mt-8">
              <template #input>
                <el-switch
                  active-text="环绕视角"
                  inactive-text="第一人称"
                  v-model="viewMode"
                  @change="setViewMode"
                />
              </template>
            </hsr-input>
          </template>
          <template v-else-if="curIndex == '3'">
            <hsr-input title="查看介绍点时自动播放语音" class="mt-16">
              <template #input>
                <el-switch v-model="autoplayVoice" />
              </template>
            </hsr-input>
            <hsr-input title="显示小地图" class="mt-8">
              <template #input>
                <el-switch v-model="showMiniMap" />
              </template>
            </hsr-input>
            <hsr-input title="新手指引" class="mt-8">
              <template #input>
                <hsr-button class="min-w-xl w-10" icon="success" text="查看" @click="playGuide" />
              </template>
            </hsr-input>
          </template>
          <div class="h-160px" />
        </el-scrollbar>
      </div>
    </div>
  </hsr-dialog>
</template>

<script setup lang="ts">
  import {
    PictureRounded,
    SwitchFilled,
    MoreFilled,
    ArrowDownBold,
    ArrowRightBold,
  } from '@element-plus/icons-vue'
  import { ControlMethod, KeyInputContext, type SceneController } from '~/utils/scene'

  const props = defineProps<{
    sceneController: SceneController
    keyInputContext?: KeyInputContext
  }>()

  const showDialog = ref(false)
  const expandOpts = ref(false)

  const showCrosshair = useLocalStorage<boolean>('show-crosshair', true, { initOnMounted: true })
  const showFrameRate = useLocalStorage<boolean>('show-frame-rate', true, { initOnMounted: true })
  const graphicPreset = useLocalStorage<string>('graphic-preset', 'high', { initOnMounted: true })
  const antiAliasing = useLocalStorage<string>('anti-aliasing', 'msaa', { initOnMounted: true })
  const mouseSensitivity = useLocalStorage<number>('mouse-sensitivity', 50, { initOnMounted: true })
  const movementSpeed = useLocalStorage<number>('movement-speed', 50, { initOnMounted: true })
  const viewMode = useLocalStorage<boolean>('view-mode', false, { initOnMounted: true })
  const autoplayVoice = useLocalStorage<boolean>('autoplay-voice', true, { initOnMounted: true })
  const showMiniMap = useLocalStorage<boolean>('show-mini-map', false, { initOnMounted: true })
  const screenResolution = useLocalStorage<number>('screen-resolution', 1.0, {
    initOnMounted: true,
  })

  const graphicPresets = [
    {
      value: 'ultimate',
      label: '极高',
    },
    {
      value: 'high',
      label: '高',
    },
    {
      value: 'medium',
      label: '中',
    },
    {
      value: 'low',
      label: '低',
    },
    {
      value: 'custom',
      label: '自定义',
    },
  ]

  const antiAliasingOptions = [
    {
      value: 'msaa',
      label: 'MSAA',
    },
    {
      value: 'fxaa',
      label: 'FXAA',
    },
    {
      value: 'smaa',
      label: 'SMAA',
    },
    {
      value: 'ssaa',
      label: 'SSAA',
    },
  ]

  const screenResolutionOptions = [
    {
      value: 2.0,
      label: '2.0',
    },
    {
      value: 1.5,
      label: '1.5',
    },
    {
      value: 1.0,
      label: '1.0',
    },
    {
      value: 0.6,
      label: '0.6',
    },
  ]

  defineExpose({
    show() {
      showDialog.value = true
    },
    enableAllSetting() {
      setCrosshairVisible()
      setAntiAliasing()
      setScreenResolution()
      setFrameRateVisible()
      setMouseSensitivity()
      setMovementSpeed()
      setViewMode()
    },
  })
  const emit = defineEmits<{
    (e: 'hide-dialog'): void
    (e: 'play-guide'): void
  }>()

  watchEffect(() => {
    if (!showDialog.value) {
      emit('hide-dialog')
    }
  })

  const formatTooltip = (val: number) => {
    if (val < 40) {
      return '较慢'
    } else if (val < 50) {
      return '慢'
    } else if (val == 50) {
      return '中等'
    } else if (val <= 60) {
      return '快'
    } else {
      return '较快'
    }
  }

  const curIndex = ref('1')
  const swtchPage = (index: string) => (curIndex.value = index)

  function setGraphicPreset() {
    if (graphicPreset.value === 'ultimate') {
      antiAliasing.value = 'ssaa'
      screenResolution.value = 2.0
    } else if (graphicPreset.value === 'high') {
      antiAliasing.value = 'msaa'
      screenResolution.value = 1.5
    } else if (graphicPreset.value === 'medium') {
      antiAliasing.value = 'smaa'
      screenResolution.value = 1.0
    } else if (graphicPreset.value === 'low') {
      antiAliasing.value = 'fxaa'
      screenResolution.value = 0.6
    }
    setAntiAliasing()
    setScreenResolution()
  }

  function setCrosshairVisible() {
    // 设置是否显示准星
    props.sceneController.setCrosshairVisable(showCrosshair.value)
  }

  function setAntiAliasing(customized?: boolean) {
    if (customized) graphicPreset.value = 'custom'
    // 设置抗锯齿
    props.sceneController.setAntiAliasing(antiAliasing.value)
  }

  function setScreenResolution(customized?: boolean) {
    if (customized) graphicPreset.value = 'custom'
    // 设置分辨率
    props.sceneController.renderer?.setPixelRatio(screenResolution.value)
    props.sceneController.setUpdated()
  }

  function setFrameRateVisible() {
    // 设置是否显示FPS
    if (showFrameRate.value) props.sceneController.showStatsPanel()
    else props.sceneController.destroyStatsPanel()
  }

  function setMouseSensitivity() {
    //  设置鼠标灵敏度
    props.sceneController.inputManager!.sensitivity = mouseSensitivity.value / 50
  }

  function setMovementSpeed() {
    // 设置移速
    props.sceneController.player!.speed = movementSpeed.value / 3
  }

  function setViewMode() {
    // 设置视角
    if (viewMode.value) props.sceneController.player!.controlMethod.value = ControlMethod.Orbit
    else viewMode.value
    props.sceneController.player!.controlMethod.value = ControlMethod.FirstPerson
  }

  function playGuide() {
    // 播放新手指引
    showDialog.value = false //先退出菜单
    emit('play-guide')
  }
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    max-height: 50vh;
    overflow: hidden;
    transition: max-height 0.5s ease-in;
  }
  .fade-enter-from,
  .fade-leave-to {
    max-height: 0;
    transition: max-height 0.5s ease-out;
  }
</style>
