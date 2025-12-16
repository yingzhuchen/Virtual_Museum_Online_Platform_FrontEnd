<template>
  <client-only>
    <div class="absolute bottom-0 left-0 pb-10 pl-10 w-100 el-text-white">
      <el-form
        ref="basicFormRef"
        :model="basicForm"
        :rules="formBasicRules"
        label-position="left"
        label-width="100px"
      >
        <el-form-item label="颜色" prop="color" required>
          <el-color-picker
            v-model="basicForm.color"
            placeholder="场景名"
            :predefine="EL_COLOR_PICKER_PRESETS_ANNOTATION"
          />
        </el-form-item>
        <el-form-item label="大小" prop="radius" required>
          <el-slider
            v-model="basicForm.radius"
            :min="0.01"
            :max="0.3"
            :step="0.01"
            :marks="sizeMarks"
          >
          </el-slider>
        </el-form-item>
        <div class="flex items-center mt-12.5 gap-x-2">
          <!-- 在 @focus 中移除按钮的焦点，避免用户按空格尝试向上移动时再次触发按钮点击 -->
          <el-button
            id="edit-annotation-edit-details"
            type="primary"
            @click="onClickEditDetails"
            @focus="$event.target.blur()"
          >
            编辑信息
          </el-button>
          <el-button
            type="primary"
            :loading="loadingSaveAnnotation"
            :disabled="loadingSaveAnnotation"
            @click="onClickSave"
            @focus="$event.target.blur()"
          >
            保存
          </el-button>
          <el-button
            type="danger"
            :disabled="loadingSaveAnnotation"
            @click="onCancelEdit"
            @focus="$event.target.blur()"
          >
            取消修改
          </el-button>
          <el-button
            v-if="annotationDraft?.id"
            type="danger"
            :loading="loadingDeleteAnnotation"
            :disabled="loadingDeleteAnnotation"
            @click="onClickDelete"
            @focus="$event.target.blur()"
          >
            删除
          </el-button>
        </div>
      </el-form>
    </div>

    <hsr-dialog
      class="w-50vw !min-w-160 px-10 py-6"
      v-model="showDialog"
      :before-close="beforeCloseDialog"
      title="编辑标记"
      @open="$emit('show-dialog')"
      @close="$emit('hide-dialog')"
    >
      <el-scrollbar max-height="30rem">
        <el-form
          :model="basicForm"
          :rules="formBasicRules"
          label-position="left"
          label-width="120px"
        >
          <el-form-item prop="color" required>
            <template #label>
              <span class="text-16px">标记颜色</span>
            </template>
            <el-color-picker
              v-model="basicForm.color"
              placeholder="场景名"
              :predefine="EL_COLOR_PICKER_PRESETS_ANNOTATION"
            />
          </el-form-item>
          <el-form-item prop="name" required>
            <template #label>
              <span class="text-16px">标题</span>
            </template>
            <el-input v-model="basicForm.name" />
          </el-form-item>
        </el-form>

        <el-form
          ref="dataFormRef"
          :model="dataForm"
          :rules="formDataRules"
          label-position="left"
          label-width="120px"
        >
          <el-form-item prop="type" required>
            <template #label>
              <span class="text-16px">类型</span>
            </template>
            <el-select-v2 v-model="dataForm.type" :options="annotationTypeOptions"> </el-select-v2>
          </el-form-item>
          <!-- 介绍点 -->
          <template v-if="dataForm.type === 'introduction'">
            <el-form-item prop="briefIntroduction" required>
              <template #label>
                <span class="text-16px">简介</span>
              </template>
              <el-input v-model="dataForm.briefIntroduction" placeholder="一句话介绍" />
            </el-form-item>
            <el-form-item prop="introduction" required>
              <template #label>
                <span class="text-16px">详细介绍</span>
              </template>
              <el-input type="textarea" v-model="dataForm.introduction" rows="5" resize="none" />
            </el-form-item>
            <el-form-item>
              <template #label>
                <div class="flex items-center text-16px">
                  图片/视频
                  <el-tooltip content="目前视频支持 MP4 文件" placement="top">
                    <el-icon class="ml-1" size="16" color="black">
                      <el-icon-info-filled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </template>
              <div class="flex gap-x-2 items-center">
                <el-image
                  v-if="introductionMedias?.cover"
                  class="w-240px rounded"
                  :src="introductionMedias.cover"
                  :min-scale="0.8"
                  :max-scale="1.4"
                  :preview-src-list="[introductionMedias.cover]"
                  fit="cover"
                ></el-image>
                <video
                  v-else-if="introductionMedias?.video"
                  class="w-240px rounded"
                  :src="introductionMedias.video"
                  controls
                  preload="metadata"
                ></video>
                <el-icon
                  v-if="uploadImageVideoIcon"
                  :class="uploadImageVideoIcon.loading && 'is-loading'"
                  :color="uploadImageVideoIcon.color"
                >
                  <component :is="uploadImageVideoIcon.icon" />
                </el-icon>
                <el-button
                  :type="
                    introductionMedias?.cover || introductionMedias?.video ? 'default' : 'primary'
                  "
                  @click="onClickSelectMedia('photo/video')"
                >
                  {{
                    introductionMedias?.cover || introductionMedias?.video ? '重选媒体' : '选择媒体'
                  }}
                </el-button>
                <el-button
                  v-if="introductionMedias?.cover || introductionMedias?.video"
                  type="danger"
                  :icon="ElIconDelete"
                  square
                  @click="clearImageVideo"
                />
              </div>
            </el-form-item>
            <el-form-item>
              <template #label>
                <span class="text-16px">音频 (MP3)</span>
              </template>
              <div class="flex gap-x-2 items-center">
                <audio
                  v-if="introductionMedias?.audio"
                  class="w-240px"
                  :src="introductionMedias.audio"
                  controls
                  preload="metadata"
                >
                </audio>
                <el-icon
                  v-if="uploadAudioIconColor"
                  :class="uploadAudioIconColor.loading && 'is-loading'"
                  :color="uploadAudioIconColor.color"
                >
                  <component :is="uploadAudioIconColor.icon" />
                </el-icon>
                <el-button
                  :type="introductionMedias?.audio ? 'default' : 'primary'"
                  @click="onClickSelectMedia('audio')"
                >
                  {{ introductionMedias?.audio ? '重选音频' : '选择音频' }}
                </el-button>
                <el-button
                  v-if="introductionMedias?.audio"
                  type="danger"
                  :icon="ElIconDelete"
                  square
                  @click="clearAudio"
                />
              </div>
            </el-form-item>
          </template>
          <!-- 导航点 -->
          <template v-else-if="dataForm.type === 'navigation'"> TODO </template>
          <!-- 传送点 -->
          <template v-else-if="dataForm.type === 'transmission'">
            <el-form-item label="目标场景" prop="toSceneId" required>
              <el-select-v2
                v-model="dataForm.toSceneId"
                :options="annotationToSceneIdOptions"
                remote
                filterable
                :remote-method="listScenes"
                :reserve-keyword="false"
                @change="listAnnotationTransmissionIds"
              >
              </el-select-v2>
            </el-form-item>
            <div class="flex items-center">
              <el-form-item
                class="!my-auto grow"
                label="目标传送点"
                prop="toTransmissionAnnotationId"
              >
                <el-select-v2
                  class="grow"
                  v-model="dataForm.toTransmissionAnnotationId"
                  :options="annotationToAnnotationIdOptions"
                  remote
                  filterable
                  :remote-method="listAnnotationTransmissionIds"
                  :reserve-keyword="false"
                >
                </el-select-v2>
              </el-form-item>
              <el-tooltip
                popper-class="w-80"
                v-if="toTransmissionAnnotationInfo?.annotationData.toTransmissionAnnotationId"
                placement="top"
              >
                <template #content>
                  <div class="whitespace-pre"></div>
                  此传送点目前已绑定
                  <b>
                    {{
                      [
                        toTransmissionAnnotationInfo.scene.name,
                        toTransmissionAnnotationInfo.annotationData.toTransmission?.name,
                      ].join('-')
                    }} </b
                  >，保存本标记时，将会改为与本标记双向绑定。
                </template>
                <div class="ml-1 flex text-xs items-center text-#FF8D02">
                  <el-icon class="mr-0.5" size="20px">
                    <el-icon-warning-filled />
                  </el-icon>
                  目标被占用
                </div>
              </el-tooltip>
            </div>
          </template>
        </el-form>
      </el-scrollbar>
      <div class="flex mt-5">
        <hsr-button
          class="ml-auto"
          icon="success"
          text="完成"
          @click="onClickSaveData"
        ></hsr-button>
      </div>
    </hsr-dialog>

    <crop-picture ref="cropPictureRef" :aspect-ratio="16 / 9" @update="onFinishCropImage" />
  </client-only>
</template>

<script setup lang="ts">
  import { type FormRules, type FormInstance } from 'element-plus'
  import { Color } from 'three'
  import { AnnotationType, type AnnotationResponse } from '~/api'
  import type { AnnotationIntroduction, SceneResponse } from '~/api'
  import type { AnnotationData, AnnotationTransmission } from '~/api'
  import { Annotation, SceneController } from '~/utils/scene'
  import type CropPicture from '~/components/crop-picture.vue'

  export interface Form {
    color: string
    name: string
    radius: number
  }

  enum UploadMediaStatus {
    None,
    Uploading,
    Success,
    Error,
  }

  const props = defineProps<{
    sceneId: number
    sceneController: SceneController
  }>()
  const annotationDraft = defineModel<Annotation | undefined>('draft')
  const emit = defineEmits<{
    (e: 'close'): void
    (e: 'show-dialog'): void
    (e: 'hide-dialog'): void
  }>()

  const userStore = useUserStore()

  const isFormModified = ref(false)
  const showDialog = ref(false)
  const basicForm = ref<Form>({
    color: '#ffffff',
    name: '',
    radius: 0.05,
  })
  const dataForm = ref<AnnotationData>({ type: 'introduction' })
  // basicForm 在修改后会实时显示到 annotation 里，如果用户取消编辑，要恢复到修改前的状态
  let basicFormBackup: Form = { ...basicForm.value }
  let dataFormBackup: AnnotationData = { ...dataForm.value }

  const localImage = shallowRef<Blob>()
  const localVideo = shallowRef<Blob>()
  const localAudio = shallowRef<Blob>()
  // 上传媒体的状态
  const uploadImageStatus = ref<UploadMediaStatus>(UploadMediaStatus.None)
  const uploadVideoStatus = ref<UploadMediaStatus>(UploadMediaStatus.None)
  const uploadAudioStatus = ref<UploadMediaStatus>(UploadMediaStatus.None)

  const uploadImageVideoIcon = computed(() => {
    if (
      uploadImageStatus.value === UploadMediaStatus.Uploading ||
      uploadVideoStatus.value === UploadMediaStatus.Uploading
    )
      return { color: '#FF8D02', icon: ElIconLoading, loading: true }

    if (
      uploadImageStatus.value === UploadMediaStatus.Error ||
      uploadVideoStatus.value === UploadMediaStatus.Error
    )
      return { color: '#F56C6C', icon: ElIconClose, loading: false }

    if (
      uploadImageStatus.value === UploadMediaStatus.Success ||
      uploadVideoStatus.value === UploadMediaStatus.Success
    )
      return { color: '#67C23A', icon: ElIconSuccessFilled, loading: false }
  })
  const uploadAudioIconColor = computed(() => {
    if (uploadAudioStatus.value === UploadMediaStatus.Uploading)
      return { color: '#FF8D02', icon: ElIconLoading, loading: true }
    if (uploadAudioStatus.value === UploadMediaStatus.Error)
      return { color: '#F56C6C', icon: ElIconClose, loading: false }
    if (uploadAudioStatus.value === UploadMediaStatus.Success)
      return { color: '#67C23A', icon: ElIconSuccessFilled, loading: false }
  })

  const loadingSaveAnnotation = ref(false)
  const loadingDeleteAnnotation = ref(false)
  const basicFormRef = ref<FormInstance>()
  const dataFormRef = ref<FormInstance>()
  const toTransmissionAnnotationInfo = ref<
    AnnotationResponse & {
      scene: SceneResponse
      annotationData: AnnotationTransmission & {
        toTransmission?: AnnotationResponse
      }
    }
  >()

  const cropPictureRef = ref<InstanceType<typeof CropPicture>>()

  const introductionMedias = computed(() => {
    if (dataForm.value.type === 'introduction') {
      return {
        cover: localImage.value ? URL.createObjectURL(localImage.value) : dataForm.value.imageUrl,
        video: localVideo.value ? URL.createObjectURL(localVideo.value) : dataForm.value.video,
        audio: localAudio.value ? URL.createObjectURL(localAudio.value) : dataForm.value.audioUrl,
      }
    }
  })

  const annotationTypeOptions: Array<{ value: AnnotationData['type']; label: string }> = [
    { value: 'introduction', label: '介绍点' },
    // { value: 'navigation', label: '导航点' }, // 暂时移除导航点
    { value: 'transmission', label: '传送点' },
  ]
  const annotationToSceneIdOptions = ref<Array<{ value: number; label: string }>>([])
  const annotationToAnnotationIdOptions = ref<Array<{ value: number; label: string }>>([])

  onUnmounted(() => {
    emit('hide-dialog')
  })

  const sizeMarks = {
    0.01: { style: { color: 'white' }, label: '很小' },
    0.05: { style: { color: 'white' }, label: '小' },
    0.1: { style: { color: 'white' }, label: '中' },
    0.15: { style: { color: 'white' }, label: '大' },
    0.2: { style: { color: 'white' }, label: '巨大' },
    0.25: { style: { color: 'white' }, label: '超大' },
    0.3: { style: { color: 'white' }, label: '超级大' },
  }
  const formBasicRules: FormRules<typeof basicForm> = {
    color: { required: true, message: '请选择颜色' },
    name: {
      required: true,
      message: '请填写标题',
    },
    radius: { required: true, type: 'number' },
  }
  const formDataRules = computed<FormRules<AnnotationData>>(() => {
    if (dataForm.value.type === 'introduction') {
      return {
        briefIntroduction: { required: true, message: '请填写简介' },
        introduction: { required: true, message: '请填写介绍' },
        imageUrl: {
          required: true,
          message: '请选择封面',
          validator(_, value) {
            return !!(value || localImage.value)
          },
        },
        video: { required: false },
      }
    } else if (dataForm.value.type === 'navigation') {
      return {}
    } else if (dataForm.value.type === 'transmission') {
      return {
        toSceneId: { required: true, message: '请选择目标场景' },
      }
    }
    return {}
  })

  watch(
    annotationDraft,
    () => {
      if (annotationDraft.value) {
        basicForm.value.color = '#' + annotationDraft.value.getColor().getHexString()
        basicForm.value.name = annotationDraft.value.name
        basicForm.value.radius = annotationDraft.value.getRadius()
        dataForm.value = annotationDraft.value.data
        basicFormBackup = { ...basicForm.value }
        dataFormBackup = { ...dataForm.value }
      }
    },
    { immediate: true, once: true },
  )
  // 把 basicForm 里的数据同步到 annotationDraft
  watchEffect(() => {
    // 如果弹窗处于打开状态，就不要自动同步，只有点击“完成”按钮时才同步
    if (annotationDraft.value && !showDialog.value) {
      saveBasicData()
    }
  })
  // 在弹窗内更新数据后，尝试直接关闭弹窗时应该询问用户是否要保存数据
  watch(
    [basicForm, dataForm],
    () => {
      if (showDialog.value) {
        isFormModified.value = true
      }
    },
    { deep: true },
  )
  watch(
    () => (dataForm.value as AnnotationTransmission).toTransmissionAnnotationId,
    () => {
      checkTransmissionId()
    },
  )

  function onClickEditDetails() {
    showDialog.value = true
    // 打开表单时，同步草稿的数据到表单里
    dataForm.value = annotationDraft.value?.data
      ? { ...annotationDraft.value.data }
      : { type: 'introduction' }
    nextTick(() => {
      isFormModified.value = false
    })
  }

  function onCancelEdit() {
    if (annotationDraft.value) {
      basicForm.value = basicFormBackup
      dataForm.value = dataFormBackup
      saveBasicData()
    }
    isFormModified.value = false
    emit('close')
  }

  function beforeCloseDialog(close: () => void) {
    if (!isFormModified.value) return close()
    ElMessageBox.confirm('确定要关闭吗？您所做的更改将不会同步到场景中。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        // 确认关闭，恢复已修改的数据
        dataForm.value = dataFormBackup
        basicForm.value.name = basicFormBackup.name
        isFormModified.value = false
        localImage.value = undefined
        localVideo.value = undefined
        localAudio.value = undefined
        uploadImageStatus.value = UploadMediaStatus.None
        uploadVideoStatus.value = UploadMediaStatus.None
        uploadAudioStatus.value = UploadMediaStatus.None
        close()
      })
      .catch(() => null)
  }

  // 左下角的保存按钮
  async function onClickSave() {
    // basicFormRef 绑定了页面左下角的表单，但是表单中没有设置标题，导致 Element Plus 不会校验这个字段，要手动校验
    if (!basicForm.value.name || basicForm.value.name === ANNOTATION_DEFAULT_NAME) {
      showDialog.value = true
      return ElMessage.error('请填写标题')
    }

    try {
      await basicFormRef.value?.validate()
    } catch (error: any) {
      for (let field in error) {
        ElMessage.error({ message: error[field][0].message })
        break
      }
      return
    }

    try {
      loadingSaveAnnotation.value = true
      await annotationDraft.value?.save()
      basicFormBackup = { ...basicForm.value }
      dataFormBackup = { ...dataForm.value }
      localImage.value = undefined
      localVideo.value = undefined
      localAudio.value = undefined
      uploadImageStatus.value = UploadMediaStatus.None
      uploadVideoStatus.value = UploadMediaStatus.None
      uploadAudioStatus.value = UploadMediaStatus.None
      emit('close')
    } catch (error) {
      handleApiError('保存标记', error)
    } finally {
      loadingSaveAnnotation.value = false
    }
  }

  function clearImageVideo() {
    localImage.value = undefined
    ;(dataForm.value as AnnotationIntroduction).imageUrl = undefined
    uploadImageStatus.value = UploadMediaStatus.None
    localVideo.value = undefined
    ;(dataForm.value as AnnotationIntroduction).video = undefined
    uploadVideoStatus.value = UploadMediaStatus.None
  }

  function clearAudio() {
    localAudio.value = undefined
    ;(dataForm.value as AnnotationIntroduction).audioUrl = undefined
    uploadAudioStatus.value = UploadMediaStatus.None
  }

  async function onClickDelete() {
    if (!annotationDraft.value?.id) return
    emit('show-dialog')
    ElMessageBox.confirm('确定要删除这个标记吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(async () => {
        try {
          loadingDeleteAnnotation.value = true
          await annotationDraft.value?.delete()
          annotationDraft.value = undefined
          emit('close')
        } catch (error) {
          handleApiError('删除标记', error)
        } finally {
          loadingDeleteAnnotation.value = false
          emit('hide-dialog')
        }
      })
      .catch(() => null)
  }

  async function onClickSelectMedia(type: 'photo/video' | 'audio') {
    let limits: { maxSize: number; accept: string }

    if (type === 'photo/video') {
      limits = { maxSize: 5, accept: 'image/*,video/mp4' }
    } else {
      limits = { maxSize: 20, accept: 'audio/mp3' }
    }
    try {
      const file = await selectFile({ ...limits })

      if (type === 'photo/video') {
        if (file.type.startsWith('image')) {
          cropPictureRef.value?.show(await fileToBase64(file))
          localVideo.value = undefined
          ;(dataForm.value as AnnotationIntroduction).video = undefined
          uploadVideoStatus.value = UploadMediaStatus.None
        } else {
          localVideo.value = file
          localImage.value = undefined
          ;(dataForm.value as AnnotationIntroduction).imageUrl = undefined
          uploadImageStatus.value = UploadMediaStatus.None
          uploadVideo()
        }
      } else {
        localAudio.value = file
        uploadAudio()
      }
    } catch (error: any) {
      ElMessage.error(error.message)
    }
  }

  function onFinishCropImage(_: string, image: Blob) {
    localImage.value = image
    uploadImage()
  }

  // 上传介绍点的图片
  async function uploadImage() {
    if (!localImage.value || dataForm.value.type !== 'introduction') return
    try {
      uploadImageStatus.value = UploadMediaStatus.Uploading
      const image = await useApi('scene').uploadIntroductionImage(localImage.value)
      dataForm.value.imageUrl = image.imageUrl
      uploadImageStatus.value = UploadMediaStatus.Success
      ElMessage.success('上传图片成功')
    } catch (error) {
      handleApiError('上传图片', error)
      uploadImageStatus.value = UploadMediaStatus.Error
    }
  }

  // 上传介绍点的视频
  async function uploadVideo() {
    if (!localVideo.value || dataForm.value.type !== 'introduction') return
    try {
      uploadVideoStatus.value = UploadMediaStatus.Uploading
      const video = await useApi('scene').uploadVideo(localVideo.value)
      dataForm.value.video = video.videoUrl
      uploadVideoStatus.value = UploadMediaStatus.Success
      ElMessage.success('上传视频成功')
    } catch (error) {
      handleApiError('上传视频', error)
      uploadVideoStatus.value = UploadMediaStatus.Error
    }
  }

  // 上传介绍点的音频
  async function uploadAudio() {
    if (!localAudio.value || dataForm.value.type !== 'introduction') return
    try {
      uploadAudioStatus.value = UploadMediaStatus.Uploading
      const audio = await useApi('general').uploadAudio(localAudio.value)
      dataForm.value.audioUrl = audio.audioUrl
      uploadAudioStatus.value = UploadMediaStatus.Success
      ElMessage.success('上传音频成功')
    } catch (error) {
      handleApiError('上传音频', error)
      uploadAudioStatus.value = UploadMediaStatus.Error
    }
  }

  function saveBasicData() {
    if (!annotationDraft.value) return
    annotationDraft.value.name = basicForm.value.name
    annotationDraft.value.setColor(new Color(basicForm.value.color))
    annotationDraft.value.setRadius(basicForm.value.radius)
  }

  // 保存弹窗中的数据
  async function onClickSaveData() {
    if (!annotationDraft.value) return
    if (!basicForm.value.name) {
      return ElMessage.error('请填写标题')
    }
    if (
      uploadImageStatus.value === UploadMediaStatus.Uploading ||
      uploadImageStatus.value === UploadMediaStatus.Error ||
      uploadVideoStatus.value === UploadMediaStatus.Uploading ||
      uploadVideoStatus.value === UploadMediaStatus.Error ||
      uploadAudioStatus.value === UploadMediaStatus.Uploading ||
      uploadAudioStatus.value === UploadMediaStatus.Error
    ) {
      return ElMessage.error('请等待媒体上传完成')
    }

    try {
      await dataFormRef.value?.validate()
    } catch (error: any) {
      for (let field in error) {
        ElMessage.error({ message: error[field][0].message })
        break
      }
      return
    }

    annotationDraft.value.data = dataForm.value
    saveBasicData()
    if (dataForm.value.type === 'transmission') {
      annotationDraft.value = props.sceneController.changeAnnotationType(
        AnnotationType.Transmission,
        annotationDraft.value,
      )
    }
    showDialog.value = false
  }

  async function listScenes(keyword: string) {
    try {
      const userInfo = await userStore.userInfoLoaded
      const resp = await useApi('scene').listSceneRaw({
        first: 50,
        userId: userInfo.id,
        keyword: keyword || undefined,
      })
      const body = await resp.value()
      annotationToSceneIdOptions.value = body.data.map((item) => ({
        value: item.id,
        label: (props.sceneId === item.id ? '(当前场景) ' : '') + item.name,
      }))
      // 把当前场景放到第一位
      const currentSceneIndex = annotationToSceneIdOptions.value.findIndex(
        (item) => item.value === props.sceneId,
      )
      if (currentSceneIndex !== -1) {
        const currentScene = annotationToSceneIdOptions.value.splice(currentSceneIndex, 1)
        annotationToSceneIdOptions.value.unshift(currentScene[0])
      }
    } catch (error) {
      handleApiError('获取场景列表', error)
    }
  }

  // 获取特定场景的传送点列表
  async function listAnnotationTransmissionIds() {
    if (dataForm.value.type !== 'transmission') return
    if (!dataForm.value.toSceneId)
      return ElMessage.error({ message: '请先选择目标场景', zIndex: 9999 })

    try {
      const resp = await useApi('scene').listAnnotation(dataForm.value.toSceneId)
      annotationToAnnotationIdOptions.value = resp.data
        .filter((a) => a.annotationData.type === 'transmission')
        .map((item) => ({
          value: item.annotationId,
          label: item.name,
        }))
    } catch (error) {
      handleApiError('获取传送点列表', error)
    }
  }

  // 检查目标传送点是否已经绑定了别的传送点
  async function checkTransmissionId() {
    if (dataForm.value.type !== 'transmission' || !dataForm.value.toTransmissionAnnotationId) return
    try {
      const sceneApi = useApi('scene')
      const targetInfo = await sceneApi.getAnnotationDetails(
        dataForm.value.toTransmissionAnnotationId,
      )

      if (targetInfo.annotationData.type === 'transmission') {
        toTransmissionAnnotationInfo.value = {
          ...targetInfo,
          annotationData: {
            ...targetInfo.annotationData,
            toTransmission: targetInfo.annotationData.toTransmissionAnnotationId
              ? await sceneApi.getAnnotationDetails(
                  targetInfo.annotationData.toTransmissionAnnotationId,
                )
              : undefined,
          },
          scene: await sceneApi.getScene(targetInfo.sceneId),
        }
      } else {
        toTransmissionAnnotationInfo.value = undefined
      }
    } catch (error) {
      handleApiError('检查传送点信息', error)
    }
  }
</script>

<style scoped>
  .el-text-white {
    :deep(.el-form-item__label) {
      color: white;
    }
  }
</style>
