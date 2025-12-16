<template>
  <div>
    <!-- header -->
    <div class="flex items-center mx-13 mt-5">
      <div class="flex flex-col">
        <div class="flex items-center">
          <template v-for="(item, key) in listSceneIsPublicOptions">
            <span
              class="cursor-pointer text-gray-700 select-none px-2"
              :class="listSceneIsPublic === item.value && 'text-manager-primary'"
              @click="listSceneIsPublic = item.value"
            >
              {{ item.label }}
            </span>
            <div class="h-4 w-0.25 bg-#bbbbbb last:hidden"></div>
          </template>
        </div>
        <div class="mt-2 flex items-center shrink-0">
          <template v-for="(sceneType, key) in listSceneTypes" :key>
            <span
              :class="[
                'cursor-pointer text-gray-700 select-none px-2',
                listSceneType === key && 'text-manager-primary',
              ]"
              @click="listSceneType = key"
            >
              {{ sceneType.label }} {{ sceneType.count }}
            </span>
            <div class="h-4 w-0.25 bg-#bbbbbb last:hidden"></div>
          </template>
        </div>
      </div>

      <div class="flex items-center gap-x-2 ml-auto">
        <el-dropdown>
          <el-button class="flex w-50">
            {{ listSceneOrders[listSceneOrder] }}
            <el-icon class="!ml-18"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="(order, key) in listSceneOrders"
                :key
                @click="listSceneOrder = key"
              >
                {{ order }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- body -->
    <div
      class="flex flex-col mt-5 mx-13 gap-y-4"
      v-loading="loading"
      element-loading-text="加载中..."
    >
      <div v-if="!scenes.length" class="text-center text-gray-1 mt-10"> 暂无结果 </div>
      <div v-for="scene in scenes" class="flex items-center h-41">
        <el-image
          class="w-50.5 h-28 rounded-1.5 cursor-pointer"
          :src="scene.coverUrl"
          fit="cover"
          @click="onClickScene(scene)"
        ></el-image>
        <div class="ml-5.5 flex flex-col h-28">
          <div class="flex items-center gap-x-2">
            <span
              class="font-bold cursor-pointer max-w-100 truncate text-black-1 transition-all hover:text-manager-primary"
              @click="onClickScene(scene)"
            >
              {{ scene.name }}
            </span>
            <el-tag v-if="scene.isCollaborator">协作者</el-tag>
          </div>
          <span class="text-black-1 text-3.5 mt-1">
            {{ dayjs(scene.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </span>
          <!-- <div class="mt-auto text-gray-1">操作栏</div> -->
        </div>
        <div class="flex ml-auto">
          <el-button
            class="w-26 !text-4"
            size="large"
            style="line-height: normal"
            :icon="ElIconEditPen"
            @click="$router.push(`/manager/edit?id=${scene.id}`)"
          >
            编辑
          </el-button>
          <el-popconfirm
            v-if="!scene.isCollaborator"
            title="确定要删除此场景吗？"
            cancel-button-text="取消"
            confirm-button-text="确认"
            width="12rem"
            confirm-button-type="danger"
            :icon="ElIconWarningFilled"
            :hide-after="0"
            @confirm="onClickDeleteScene(scene.id)"
          >
            <template #reference>
              <el-button
                class="w-26 !text-4"
                size="large"
                type="danger"
                style="line-height: normal"
                :disabled="deletingSceneId === scene.id"
                :loading="deletingSceneId === scene.id"
                :icon="ElIconDelete"
                plain
              >
                删除
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ArrowDown } from '@element-plus/icons-vue'
  import type { SceneResponse } from '~/api/models'

  /** 投稿类型 */
  type ListSceneType = 'reviewing' | 'approved' | 'rejected'
  /** 投稿排序方式 */
  type ListSceneOrder = 'time-desc'

  definePageMeta({
    layout: 'manager',
  })

  const userStore = useUserStore()
  const router = useRouter()
  const api = useApi('scene')

  const loading = ref(false)
  const deletingSceneId = ref<number>()
  const listSceneTypes: Record<ListSceneType, { label: string; count: number }> = {
    reviewing: { label: '审核中', count: 0 },
    approved: { label: '已通过', count: 0 },
    rejected: { label: '未通过', count: 0 },
  }
  const listSceneOrders: Record<ListSceneOrder, string> = {
    'time-desc': '投稿时间排序',
  }

  const listSceneIsPublic = ref<boolean>()
  const listSceneType = ref<ListSceneType>('approved')
  const listSceneOrder = ref<ListSceneOrder>('time-desc')
  const scenes = ref<Array<SceneResponse & { isCollaborator: boolean }>>([])

  const listSceneIsPublicOptions = [
    { label: '全部场景', value: undefined },
    { label: '公开', value: true },
    { label: '私有', value: false },
  ]

  watch([listSceneType, listSceneOrder, listSceneIsPublic], () => {
    listScene()
  })

  // 判断用户本人是不是场景的协作者
  function isCollaborator(scene: SceneResponse) {
    const userId = userStore.userInfo?.id
    return scene.creatorId !== userId && !!scene.collaborators?.some((c) => c === userId)
  }

  async function listScene() {
    const userInfo = await userStore.userInfoLoaded

    try {
      loading.value = true
      const _scenes = await (
        await api.listSceneRaw({ userId: userInfo.id, publicMode: listSceneIsPublic.value })
      ).value()
      scenes.value = _scenes.data.map((scene) => ({
        ...scene,
        isCollaborator: isCollaborator(scene),
      }))
      listSceneTypes[listSceneType.value].count = _scenes.totalCount
    } catch (e: any) {
      await handleApiError('获取场景列表', e)
    } finally {
      loading.value = false
    }
  }

  async function onClickDeleteScene(sceneId: number) {
    deletingSceneId.value = sceneId
    try {
      await api.deleteScene(sceneId)
      ElMessage.success('删除成功')
      listScene()
    } catch (e: any) {
      await handleApiError('删除场景', e)
    }
    deletingSceneId.value = undefined
  }

  function onClickScene(scene: SceneResponse) {
    router.push(`/scene?id=${scene.id}`)
  }

  onMounted(() => {
    listScene()
  })
</script>
