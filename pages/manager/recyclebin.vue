<template>
  <div>
    <!-- header -->
    <div class="flex">
      <div class="mt-4.75 ml-13 mb-4 flex gap-x-3">
        <div class="flex flex-col gap-y-2">
          <div class="flex items-center gap-x-3">
            <el-icon size="32"><Delete /></el-icon>
            <span class="text-25px font-medium">回收站</span>
          </div>
          <div class="text-gray text-17px">已删除场景仅保留30天，逾期将永久删除。</div>
        </div>
      </div>
    </div>

    <!-- body -->
    <el-scrollbar
      max-height="500px"
      class="flex flex-col mt-5 mx-13 gap-y-4"
      v-loading="loading"
      element-loading-text="加载中..."
    >
      <div v-if="!scenes.length" class="text-center text-gray-1 flex flex-col">
        <el-image
          class="w-80 m-auto"
          src="https://demo-bucket-1325569882.cos.ap-guangzhou.myqcloud.com/background/02e2f66e41cc04746bb418ef18db9d1.png"
        />
        无删除场景
      </div>
      <div v-for="scene in scenes" class="relative flex h-41 border-1 border-black">
        <el-image class="w-50.5 h-28 rounded-1.5" :src="scene.coverUrl" fit="cover"></el-image>
        <div class="ml-5.5 flex flex-col gap-y-1">
          <div class="font-bold max-w-100 truncate text-black-1 transition-all">
            {{ scene.name }}
          </div>
          <div class="text-black-1 text-3.5 mt-1">
            {{ dayjs(scene.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </div>
        </div>
        <div class="absolute right-5 top-8">
          <el-popconfirm
            title="确定要恢复此场景吗？"
            cancel-button-text="取消"
            confirm-button-text="确认"
            width="12rem"
            confirm-button-type="danger"
            :icon="ElIconWarningFilled"
            :hide-after="0"
            @confirm="onClickRecoverScene(scene.id)"
          >
            <template #reference>
              <el-button
                class="w-26 !text-4"
                style="line-height: normal"
                :disabled="RecoverSceneId === scene.id"
                :loading="RecoverSceneId === scene.id"
                plain
              >
                恢复
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
  import { Delete } from '@element-plus/icons-vue'
  import type { SceneResponse } from '~/api/models'

  definePageMeta({
    layout: 'manager',
  })

  const userStore = useUserStore()
  const api = useApi('scene')

  const loading = ref(false)
  const RecoverSceneId = ref<number | null>(null)
  const scenes = ref<Array<SceneResponse>>([])

  async function listScene() {
    const userInfo = await userStore.userInfoLoaded
    try {
      loading.value = true
      const _scenes = await (
        await api.listSceneRaw({ userId: userInfo.id, isRecycleBin: 1 })
      ).value()
      scenes.value = _scenes.data.reverse()
    } catch (e: any) {
      await handleApiError('获取回收站列表', e)
    } finally {
      loading.value = false
    }
  }

  async function onClickRecoverScene(sceneId: number) {
    RecoverSceneId.value = sceneId
    try {
      await api.undoDeleteScene(sceneId)
      ElMessage.success('恢复成功')
      listScene()
    } catch (e: any) {
      await handleApiError('恢复场景', e)
    }
    RecoverSceneId.value = null
  }

  onMounted(() => {
    listScene()
  })
</script>
