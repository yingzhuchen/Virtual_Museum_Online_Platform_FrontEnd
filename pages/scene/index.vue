<template>
  <div>
    <div class="absolute top-1/4 left-1/2 -translate-y-1/2 -translate-x-1/2 z-1">
      <div v-if="showTitle" class="background fade-animation">
        <div
          class="text-nowrap font-extrabold italic font-mono text-white text-7xl text-center px-50 py-5"
        >
          {{ sceneInfo?.name }}
        </div>
      </div>
    </div>
    <div
      id="luma-preview-scene-container"
      :class="[
        'absolute w-full h-full bg-black',
        sceneController.player?.controlMethod.value === ControlMethod.Orbit &&
          'cursor-grab active:cursor-grabbing',
      ]"
    >
    </div>

    <!-- 附近的标记点 -->
    <div
      v-if="nearestAnnotation?.userData.owner && keyBindingLayout === 'default'"
      :class="[
        'absolute top-1/2 left-1/2 -translate-y-1/2 translate-x-16',
        'bg-gradient-to-r from-blue-200 via-blue-200 to-transparent',
        'flex items-center py-2 pl-4 pr-30 select-none cursor-pointer rounded-tl-20 rounded-bl-20',
      ]"
      @click="onSelectAnnotation(nearestAnnotation)"
    >
      <img class="w-7 h-7 invert" src="~/assets/icons/icons8-f-key-50.png" />
      <span class="text-5 ml-2 text-gray-700 shrink-0">
        {{ nearestAnnotationAction }}{{ nearestAnnotation.userData.owner.name }}
      </span>
    </div>

    <div
      id="luma-preview-back-btn"
      class="absolute left-8 top-8 z-50 bg-black/35 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer"
      title="返回"
      @click="onClickBackButton"
    >
      <el-icon size="22" color="white">
        <component :is="selectedAnnotation ? Close : ArrowLeft" />
      </el-icon>
    </div>

    <annotation-info
      v-if="selectedAnnotation?.id"
      v-model:key-binding-layout="keyBindingLayout"
      :name="selectedAnnotation.name"
      :data="selectedAnnotation.data"
      :key-input-context="sceneController.inputManager?.keyInputContext"
      :scene-controller="sceneController"
      @close="onCloseAnnotationInfo"
      @show-dialog="onShowDialog"
      @hide-dialog="onHideDialog"
    />

    <keyboard-layout-hint
      id="keyboard-layout-hint"
      v-model="keyBindingLayout"
      class="z-6"
      :viewer-can-edit-scene
      :nearest-annotation
    />
    <edit-annotation
      v-if="keyBindingLayout === 'edit-annotation'"
      :scene-id="sceneId"
      :scene-controller="sceneController"
      v-model:draft="annotationDraft"
      @close="onExitEditAnnotation"
      @show-dialog="onShowDialog"
      @hide-dialog="onHideDialog"
    />
    <mini-map
      v-if="enableMiniMap"
      class="left-4/5"
      :basic-radius="6"
      :circles="circles ?? []"
      :ratio="3"
      :rotation="rotation"
    >
    </mini-map>
    <scene-info-dialog
      ref="sceneInfoDialogRef"
      @show-dialog="onShowDialog"
      @hide-dialog="onHideDialog"
      @open-setting-dialog="openSettingDialog"
      :key-input-context="sceneController.inputManager?.keyInputContext"
    />
    <setting-dialog
      :scene-controller="sceneController"
      ref="settingDialogRef"
      @hide-dialog="onHideDialog"
      @play-guide="beginnerCourcesOpen = true"
      :key-input-context="sceneController.inputManager?.keyInputContext"
    />
  </div>

  <full-map
    class="absolute left-0 top-0"
    v-model:key-binding-layout="keyBindingLayout"
    ref="fullMapRef"
    :step="80"
    :width="mapWidth"
    :height="mapHeight"
    :lineColor="'#d5d8dd'"
    :lineWidth="1"
    :edgeWidth="5"
    :edgeColor="'#514f4f'"
    :circles="circles ?? []"
    :circleRadius="20"
    :character-rotation="rotation"
    :key-input-context="sceneController.inputManager?.keyInputContext"
    :scene-controller="sceneController"
  />

  <el-tour v-model="beginnerCourcesOpen">
    <!-- TODO -->
    <el-tour-step title="教程" :target="keyboardHintLayoutElement">
      <div>1. 在这里显示可以交互的按键</div>
    </el-tour-step>
    <el-tour-step title="教程">
      <div>2. 通过键盘在场景中游览，在靠近场景标记时可以按F查看</div>

      <img width="320px" height="240px" src="/public/controlCources.png" />
      <img src="/public/nearAnnotationHint.png" />
    </el-tour-step>
    <el-tour-step title="教程">
      <div>3. 在操作过程中，双击ESC即可呼出菜单</div>

      <img src="/public/menuExample.png" />
    </el-tour-step>
  </el-tour>
</template>

<script setup lang="ts">
  import { ArrowLeft, Close } from '@element-plus/icons-vue'
  import { ElMessageBox } from 'element-plus'
  import { AnnotationType } from '~/api'
  import {
    ControlMethod,
    PlayerKeyInputState,
    SceneController,
    createSpawnPointMesh,
    saveSpawnPoint,
    removeSpawnPointMesh,
  } from '~/utils/scene'
  import {
    Annotation,
    NavigationAnnotation,
    IntroductionAnnotation,
    TransmissionAnnotation,
    type AnnotationObjectMesh,
  } from '~/utils/scene/annotation'
  import AnnotationInfo from './components/annotation-info.vue'
  import KeyboardLayoutHint, {
    type KeyBindingLayout,
  } from './components/key-binding-layout-hint.vue'
  import EditAnnotation from './components/edit-annotation.vue'
  import SceneInfoDialog from './components/scene-info-dialog.vue'
  import SettingDialog from './components/setting-dialog.vue'
  import { circles, rotation, startGetMiniMapData } from '~/utils/scene'
  import FullMap from './components/grid.vue'
  import MiniMap from './components/miniMap.vue'

  const enableMiniMap = useLocalStorage<boolean>('show-mini-map', false, { initOnMounted: true })

  // 虽然本页面实际上不需要进入动画，但是如果不设置 layoutTransition，
  // 貌似从场景列表进入本页面就不会播放动画。这里的 scene 实际上并没有对应的动画代码
  definePageMeta({
    layoutTransition: {
      name: 'scene',
      mode: 'out-in',
    },
  })

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()

  const sceneId = parseInt(route.query.id as string)
  const sceneInfo = ref<SceneWithUser>()
  let sceneController = new SceneController()
  const keyBindingLayout = ref<KeyBindingLayout>('default')
  const sceneInfoDialogRef = ref<InstanceType<typeof SceneInfoDialog>>()
  const fullMapRef = ref<InstanceType<typeof FullMap>>()
  const settingDialogRef = ref<InstanceType<typeof SettingDialog>>()
  const showTitle = ref(false)

  const viewerCanEditScene = computed(() => {
    if (!userStore.userInfo?.id) return false
    const isCreator = sceneInfo.value?.creatorId === userStore.userInfo?.id
    const isCollaborator = !!sceneInfo.value?.collaborators?.some(
      (c) => c.id === userStore.userInfo?.id,
    )
    return isCreator || isCollaborator
  })

  // 标记草稿，可以是未保存到后端的，也可以是已保存的
  const annotationDraft = shallowRef<Annotation>()

  const nearestAnnotation = shallowRef<AnnotationObjectMesh<Annotation>>()
  const nearestAnnotationAction = computed(() => {
    if (!nearestAnnotation.value) return ''
    const annotation = nearestAnnotation.value.userData.owner
    let action: string

    if (annotation instanceof NavigationAnnotation) {
      action = '进入'
    } else if (annotation instanceof TransmissionAnnotation) {
      action = '传送至'
    } else if (annotation instanceof IntroductionAnnotation) {
      action = '查看'
    } else {
      action = '查看'
    }

    if (nearestAnnotation.value.name) return `${action}：`
    return action
  })
  let fetchNearbyAnnotationInterval: number

  const selectedAnnotation = ref<Annotation>()

  const beginnerCourcesOpen = ref(false)
  const keyboardHintLayoutElement = () =>
    document.querySelector<HTMLElement>('#keyboard-layout-hint')

  function onCloseAnnotationInfo() {
    selectedAnnotation.value = undefined
    keyBindingLayout.value = 'default'
    document.body.requestPointerLock()
  }

  function onSelectAnnotation(object: AnnotationObjectMesh<Annotation>) {
    const annotation = object.userData.owner
    if (!annotation.id) return

    selectedAnnotation.value = annotation
    document.exitPointerLock()
  }

  const onSaveSpawnPoint = useDebounceFn(() => {
    saveSpawnPoint(sceneController)
  }, 350)

  function onCreateAnnotation() {
    if (!viewerCanEditScene.value || !sceneController.player || !sceneController.camera) return

    keyBindingLayout.value = 'edit-annotation'
    sceneController.player.controlMethod.value = ControlMethod.Orbit
    document.exitPointerLock()

    if (annotationDraft.value && !annotationDraft.value.id) {
      annotationDraft.value.dispose(true)
      annotationDraft.value = undefined
    }
    annotationDraft.value = sceneController.createAnnotation(AnnotationType.Introduction, {
      camera: sceneController.camera,
    })
    annotationDraft.value.add2Scene(sceneController)
    const spawnPosition = sceneController.player.geometry.end.add(
      sceneController.player
        .getForwardVector()
        .multiplyScalar(sceneController.player.defaultOrbitDistance),
    )
    annotationDraft.value.setPosition(spawnPosition.x, spawnPosition.y, spawnPosition.z)
  }

  function onEditAnnotation() {
    if (!nearestAnnotation.value || !sceneController.player) return

    annotationDraft.value = nearestAnnotation.value.userData.owner
    keyBindingLayout.value = 'edit-annotation'
    sceneController.player.controlMethod.value = ControlMethod.Orbit
    document.exitPointerLock()
  }

  function onOpenFullMap() {
    if (!circles.value) return
    fullMapRef.value?.show()
    document.exitPointerLock()
  }

  function onOpenSceneInfoDialog() {
    if (!sceneInfo.value) return
    sceneInfoDialogRef.value?.show(sceneInfo.value)
  }

  function openSettingDialog() {
    sceneInfoDialogRef.value?.close()
    settingDialogRef.value?.show()
  }

  function onShowDialog() {
    sceneController.inputManager?.keyInputContext?.stop()
  }

  function onHideDialog() {
    // 给一点时间让 dialog 关闭，否则可能会触发菜单
    // TODO: 如果修改了菜单的快捷键，这里可以不用 setTimeout
    selectedAnnotation.value = undefined
    setTimeout(() => {
      sceneController.inputManager?.keyInputContext?.start()
    }, 500)
  }

  function onExitEditAnnotation() {
    if (!sceneController.player) return
    keyBindingLayout.value = 'default'
    sceneController.player.controlMethod.value = ControlMethod.FirstPerson
    sceneController.inputManager?.transformControl.detach()
    // 如果标记还是草稿，则销毁
    if (annotationDraft.value && !annotationDraft.value?.id) {
      annotationDraft.value.dispose(true)
      annotationDraft.value = undefined
    }
  }

  function setDefaultKeyState() {
    if (!sceneController.player) return
    sceneController.inputManager?.keyInputContext?.clearState()
    sceneController.inputManager?.keyInputContext?.pushState(
      new PlayerKeyInputState(
        sceneController.player!,
        onSelectAnnotation,
        onCreateAnnotation,
        onSaveSpawnPoint,
        onOpenFullMap,
        onOpenSceneInfoDialog,
        onEditAnnotation,
      ),
    )
  }
  watch(
    () => route.query.id,
    async () => {
      try {
        sceneInfo.value = await getSceneWithUser(parseInt(route.query.id as string))
        setDefaultKeyState()
        setTimeout(() => (showTitle.value = true), 1500)
        setTimeout(() => (showTitle.value = false), 5500)

        //传送的逻辑在隔壁做完了
      } catch (e: any) {
        handleApiError('加载场景', e)
      }
    },
  )

  async function initScene() {
    if (!sceneId) {
      ElMessageBox({
        type: 'error',
        message: '场景 ID 无效',
        callback: () => {
          router.push('/')
        },
      })
      return
    }

    const container = document.getElementById('luma-preview-scene-container')
    if (!container) return

    try {
      sceneInfo.value = await getSceneWithUser(sceneId)
      useHead({
        title: sceneInfo.value.name,
      })
      await sceneController.init(container, sceneInfo.value.id)

      settingDialogRef.value?.enableAllSetting()
      setDefaultKeyState()
      startGetMiniMapData(sceneController, 2, 1, 3)
      fetchNearbyAnnotationInterval = window.setInterval(() => {
        nearestAnnotation.value = sceneController.player?.getNearestAnnotation(1) || undefined
      }, 200)
      setTimeout(() => (showTitle.value = true), 1500)
      setTimeout(() => (showTitle.value = false), 5500)
      if (viewerCanEditScene) createSpawnPointMesh(sceneController)

      //检查是否应该进行新手教程
      const isVisited = localStorage.getItem('isFirstTime')
      if (!(isVisited === 'true')) {
        // 显示新手教程
        beginnerCourcesOpen.value = true

        // 设置标记，表示用户已经访问过
        localStorage.setItem('isFirstTime', 'true')
      }
    } catch (e: any) {
      handleApiError('加载场景', e)
    }
  }

  // 页面左上角的返回按钮
  function onClickBackButton() {
    if (selectedAnnotation.value) {
      selectedAnnotation.value = undefined
      return
    } else {
      router.back()
    }
  }

  const mapHeight = ref(0)
  const mapWidth = ref(0)

  const mapResizeHandler = () => {
    mapHeight.value = window.innerHeight * 0.8
    mapWidth.value = window.innerWidth * 0.6
  }

  onMounted(() => {
    initScene()
    mapResizeHandler() // immediate
    window.addEventListener('resize', mapResizeHandler)
  })
  onUnmounted(() => {
    sceneController.destroy()
    removeSpawnPointMesh()
    fetchNearbyAnnotationInterval && clearInterval(fetchNearbyAnnotationInterval)
    window.removeEventListener('resize', mapResizeHandler)
  })
</script>
<style>
  .background {
    background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0),
      rgba(16, 41, 94, 0.75),
      rgba(16, 41, 94, 0.75),
      rgba(255, 255, 255, 0)
    );
  }
  .fade-animation {
    animation: 1s fade;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
