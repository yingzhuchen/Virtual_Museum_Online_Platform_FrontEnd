<template>
  <div class="relative">
    <el-form
      v-if="currentPage === EditSceneFormPage.default"
      class="max-w-6xl pt-6"
      ref="formRef"
      v-loading="loadingFetchEditScene"
      :model="sceneForm"
      :rules="formRules"
      label-position="left"
      label-width="120px"
    >
      <div class="mb-10 text-5">{{ type === 'create' ? '新建场景' : '编辑场景' }}</div>
      <el-form-item label="标题" prop="name" required>
        <el-input v-model="sceneForm.name" placeholder="场景名" />
      </el-form-item>
      <el-form-item label="URL" prop="url" required>
        <el-input
          v-model="sceneForm.url"
          placeholder="请输入内容，支持粘贴链接识别"
          @paste="onPasteText"
        >
          <template #prepend>{{ LUMA_CAPTURE_BASE_URL }}</template>
        </el-input>
        <div class="flex items-center mt-2">
          <el-button
            class="!font-normal"
            type="primary"
            link
            :icon="ElIconInfoFilled"
            @click="currentPage = EditSceneFormPage.modelHelp"
          >
            {{ helpData[EditSceneFormPage.modelHelp].title }}
          </el-button>
          <el-button
            class="!font-normal"
            type="primary"
            link
            @click="currentPage = EditSceneFormPage.modelURLHelp"
          >
            {{ helpData[EditSceneFormPage.modelURLHelp].title }}
          </el-button>
        </div>
      </el-form-item>
      <el-form-item class="flex" label="封面" prop="newCoverBase64" required>
        <div
          :class="[
            'relative rounded-1 overflow-hidden',
            !!sceneCover ? 'w-45 h-25.3125' : 'w-24 h-10',
          ]"
        >
          <div v-if="sceneCover" class="w-full h-full">
            <el-image class="w-full h-full" :src="sceneCover" fit="cover"></el-image>
            <div
              class="absolute bottom-0 left-0 w-full h-5 bg-white bg-opacity-60 text-center leading-5 cursor-pointer select-none"
              @click="onClickEditCover()"
            >
              编辑封面
            </div>
          </div>
          <el-button
            v-else
            type="primary"
            class="absolute top-0 left-0"
            @click="onClickEditCover(true)"
          >
            选择封面
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="简介" prop="description" required>
        <el-input v-model="sceneForm.description" type="textarea" :rows="5" placeholder="可选" />
      </el-form-item>
      <el-form-item v-if="props.editSceneId" label="可见性" prop="isPublic" required>
        <el-switch v-model="sceneForm.isPublic" active-text="公开" inactive-text="私有" />
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <el-select-v2
          v-model="sceneForm.tags"
          :options="tags"
          placeholder="输入标签搜索"
          filterable
          remote
          :remote-method="listTags"
          :reserve-keyword="false"
          multiple
          clearable
          @change="onTagsChange"
        ></el-select-v2>
      </el-form-item>
      <el-form-item label="协作者" prop="collaboratorIds">
        <component :is="isCollaborator ? ElTooltip : 'div'" class="w-full" content="协作者不可编辑">
          <el-select-v2
            v-model="sceneForm.collaboratorIds"
            :options="userList"
            placeholder="输入用户名搜索"
            filterable
            remote
            :remote-method="listUser"
            :disabled="isCollaborator"
            :reserve-keyword="false"
            multiple
            clearable
            @change="handleUserListChange"
          ></el-select-v2>
        </component>
      </el-form-item>

      <el-form-item>
        <el-button
          class="mt-8 w-20"
          type="primary"
          size="large"
          :disabled="loading"
          :loading
          @click="editSceneId ? onSubmitEdit() : onSubmitCreate()"
        >
          {{ loading ? '保存中' : '保存' }}
        </el-button>
      </el-form-item>
    </el-form>
    <div v-else>
      <div class="sticky top-0 w-full h-14 bg-white z-1 flex items-center">
        <el-button :icon="ElIconArrowLeft" type="primary" link @click="onClickCloseHelp">
          返回
        </el-button>
      </div>
      <el-row>
        <el-col class="pr-10" ref="helpContainerRef" :span="18">
          <div
            v-for="(article, key) in helpData[currentPage].articles"
            :id="article.id"
            class="mt-10 first:mt-0"
            :key
          >
            <h3>{{ article.title }}</h3>
            <p v-for="content in article.content" :key="content.type">
              <template v-if="content.type === 'text'">{{ content.data }}</template>
              <template v-else-if="content.type === 'image'">
                <el-image
                  class="w-full"
                  :src="content.data"
                  fit="cover"
                  :preview-src-list="[content.data]"
                ></el-image>
              </template>
            </p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="sticky top-14">
            <div class="mb-2">本页目录</div>
            <el-anchor
              :container="helpContainerRef"
              direction="vertical"
              type="default"
              :offset="-100"
            >
              <el-anchor-link
                v-for="(article, key) in helpData[currentPage].articles"
                :key
                :href="`#${article.id}`"
                :title="article.title"
              ></el-anchor-link>
            </el-anchor>

            <div class="mt-4" v-if="helpData[currentPage].relatedArticles.length">
              <div class="text-4 my-2">相关文章</div>
              <el-button
                v-for="relatedArticle in helpData[currentPage].relatedArticles"
                class="!font-normal"
                :key="relatedArticle.page"
                type="primary"
                link
                @click="currentPage = relatedArticle.page"
              >
                • {{ helpData[relatedArticle.page].title }}
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    <edit-scene-cover-modal ref="sceneCoverModalRef" @update="sceneForm.newCoverBase64 = $event" />
  </div>
</template>

<script setup lang="ts">
  import { ElTooltip, type FormInstance, type FormRules } from 'element-plus'
  import EditSceneCoverModal from './edit-scene-cover-modal.vue'

  export interface SceneForm {
    /** 场景 ID。如果不为空，代表是编辑场景 */
    id?: number
    /** 创建者 ID。如果是编辑场景，此值应该不为空 */
    creatorId?: number
    /** 远程封面 URL，如果是编辑场景，此项应该不为空 */
    coverUrl: string
    /** 本地选择的新封面 */
    newCoverBase64: string
    name: string
    url: string
    description: string
    isPublic: boolean
    collaboratorIds: number[]
    tags: string[]
  }

  const props = defineProps<{
    type: 'create' | 'edit'
    /** 要编辑的场景 ID。如果传入，则为编辑场景模式。 */
    editSceneId?: number
  }>()

  const router = useRouter()
  const sceneApi = useApi('scene')
  const generalApi = useApi('general')
  const userStore = useUserStore()

  const currentPage = ref<EditSceneFormPage>(EditSceneFormPage.default)
  const sceneForm = ref<SceneForm>({
    coverUrl: '',
    newCoverBase64: '',
    name: '',
    url: '',
    description: '',
    isPublic: true,
    collaboratorIds: [],
    tags: [],
  })
  const sceneCover = computed(() => sceneForm.value.newCoverBase64 || sceneForm.value.coverUrl)
  const userList = ref<Array<{ value: number; label: string }>>([])
  const tags = ref<Array<{ value: number; label: string }>>([])
  // 筛选用户名
  const loading = ref(false)
  const formRef = ref<FormInstance>()
  const helpContainerRef = ref<HTMLElement>()
  const formRules: FormRules<typeof sceneForm> = {
    name: { required: true, message: '必填' },
    description: { required: true, message: '必填' },
    url: { required: true, message: '必填' },
    newCoverBase64: {
      required: true,
      validator: (_, value) => !!(value || sceneForm.value.coverUrl),
      message: '必填',
    },
  }
  const loadingFetchEditScene = ref(false)
  // 编辑场景模式下，是否是协作者。如果用户是协作者，权限应该比创建者少
  const isCollaborator = computed(
    () =>
      !!sceneForm.value.id &&
      !!userStore.userInfo?.id &&
      sceneForm.value.creatorId !== userStore.userInfo?.id &&
      sceneForm.value.collaboratorIds.includes(userStore.userInfo?.id),
  )

  // 文档数据，在 constants.ts 里
  const helpData = LUMA_HELP_DOCS

  // 获取要编辑的场景信息
  watch(
    () => props.editSceneId,
    async () => {
      if (props.editSceneId) {
        loadingFetchEditScene.value = true
        try {
          const editScene = await getSceneWithUser(props.editSceneId)
          const currentCollaborators = await Promise.all(
            editScene.collaborators.map((c) => batchGetUserInfo(c.id)),
          )
          userList.value = currentCollaborators.map((user) => ({
            label: user.name ?? '',
            value: user.id,
          }))
          sceneForm.value = {
            ...editScene,
            description: editScene.description ?? '',
            url: editScene.url.replace(LUMA_CAPTURE_BASE_URL, ''),
            newCoverBase64: '',
            collaboratorIds: editScene.collaborators.map((c) => c.id),
          }
        } catch (error) {
          handleApiError('获取协作者信息', error)
        } finally {
          loadingFetchEditScene.value = false
        }
      }
    },
    { immediate: true },
  )

  const sceneCoverModalRef = ref<InstanceType<typeof EditSceneCoverModal>>()

  function onPasteText(e: ClipboardEvent) {
    const clipboardData = e.clipboardData
    const pastedText = clipboardData?.getData('text').trim()

    if (pastedText?.startsWith(LUMA_CAPTURE_BASE_URL) && pastedText !== LUMA_CAPTURE_BASE_URL) {
      ElMessage.success('识别到 Luma 场景链接')
      // 立即替换会导致 input 内容重复
      setTimeout(() => {
        sceneForm.value.url = pastedText.replace(LUMA_CAPTURE_BASE_URL, '')
      }, 100)
    }
  }

  function onClickEditCover(reselectCover?: boolean) {
    if (reselectCover && !sceneForm.value.url) {
      return ElMessage.error('请先填写场景 URL')
    }
    sceneCoverModalRef.value?.show({
      sceneUrl: sceneForm.value.url,
      cover: sceneCover.value,
      reselect: reselectCover,
    })
  }

  function onTagsChange() {
    //清空tags数组
    tags.value = []
  }

  function handleUserListChange() {
    // 清空 userList 数组
    userList.value = []
  }

  const listUser = useDebounceFn(async (filterUsername: string) => {
    if (filterUsername) {
      try {
        const users = await useApi('user').getUserListByName(filterUsername)
        userList.value = users.data.map((user) => ({
          label: user.name ?? '',
          value: user.id,
        }))
      } catch (error) {
        handleApiError('搜索用户', error)
      }
    }
  }, 800)

  const listTags = useDebounceFn(async (filtertag: string) => {
    if (filtertag) {
      try {
        const tag = await useApi('scene').getTagListByName(filtertag)
        tags.value = tag.tagsList.map((tag) => ({
          value: tag.tagId,
          label: tag.tagName ?? '',
        }))
      } catch (error) {
        handleApiError('搜索tag', error)
      }
    }
  }, 800)

  async function onSubmitCreate() {
    const isFormValid = await formRef.value?.validate().catch(() => false)
    if (!isFormValid) return

    loading.value = true

    let cacheImageUrl: string
    // 上传图片
    try {
      cacheImageUrl = (
        await generalApi.uploadImage({
          type: 'sceneCover',
          image: sceneForm.value.newCoverBase64,
        })
      ).imageUrl
    } catch (error) {
      loading.value = false
      handleApiError('上传封面', error)
      return
    }

    try {
      await sceneApi.createScene({
        name: sceneForm.value.name,
        description: sceneForm.value.description,
        url: LUMA_CAPTURE_BASE_URL + sceneForm.value.url,
        collaboratorsId: sceneForm.value.collaboratorIds,
        tags: sceneForm.value.tags,
        cacheImageUrl,
      })
    } catch (error) {
      loading.value = false
      handleApiError('创建场景', error)
      return
    }

    ElMessage.success('创建场景成功')
    loading.value = false
    router.push('/manager')
  }

  async function onSubmitEdit() {
    if (!sceneForm.value?.id) return
    const isFormValid = await formRef.value?.validate().catch(() => false)

    if (!isFormValid) return

    loading.value = true

    let cacheImageUrl: string | undefined = undefined
    if (sceneForm.value.newCoverBase64) {
      try {
        cacheImageUrl = (
          await generalApi.uploadImage({
            image: sceneForm.value.newCoverBase64,
            type: 'sceneCover',
          })
        ).imageUrl
      } catch (error) {
        loading.value = false
        handleApiError('上传封面', error)
        return
      }
    }

    try {
      await sceneApi.editScene({
        id: sceneForm.value.id,
        name: sceneForm.value.name,
        description: sceneForm.value.description,
        isPublic: sceneForm.value.isPublic,
        url: LUMA_CAPTURE_BASE_URL + sceneForm.value.url,
        collaborators: sceneForm.value.collaboratorIds,
        tags: sceneForm.value.tags,
        cacheImageUrl,
      })
    } catch (error) {
      loading.value = false
      handleApiError('更新场景', error)
      return
    }

    ElMessage.success('更新场景成功')
    router.push('/manager')
    loading.value = false
  }

  function onClickCloseHelp() {
    currentPage.value = EditSceneFormPage.default
    router.replace({ ...router.currentRoute.value, hash: '' })
  }
</script>
