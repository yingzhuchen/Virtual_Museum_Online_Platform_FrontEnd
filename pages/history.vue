<template>
  <div class="ml-9xl min-w-4xl max-w-[80vw]">
    <div class="mt-12 grid items-center grid-cols-2">
      <div class="ml-8 flex flex-items-center">
        <el-icon size="30px"><Clock /></el-icon>
        <span class="ml-2 text-[22px]">历史记录</span>
      </div>
      <div class="flex flex-justify-end">
        <el-input
          v-model="search"
          @keydown.prevent.enter="searchHistory"
          class="mr-4 max-w-[150px]"
          placeholder="搜索历史记录"
          :prefix-icon="Search"
        />
        <el-button @click="clearHistory">清空历史</el-button>
      </div>
    </div>
    <div class="mt-8">
      <ul v-if="history" class="list-none">
        <li v-for="record in history" :key="record.id">
          <div class="flex">
            <div class="l-info">
              <div v-if="record.timeLabel" class="time-label">
                {{ record.timeLabel }}
              </div>
              <div class="relative">
                <i class="history-red-round"></i>
                <span class="lastplay-t">
                  <!-- 今昨两天显示时分，再往前显示年月日 -->
                  {{
                    dayjs(record.time).format(
                      dayjs().startOf('day').diff(dayjs(record.time).startOf('day'), 'day') < 2
                        ? 'HH:mm'
                        : 'YYYY-MM-DD',
                    )
                  }}
                </span>
              </div>
            </div>
            <div class="r-info flex">
              <div class="max-h-[112.5px] max-w-[180px]">
                <el-image
                  @click="enterScene(record.sceneId)"
                  class="rounded-2 cursor-pointer w-45 h-25"
                  fit="cover"
                  :src="record.scene.coverUrl"
                >
                  <template #error>
                    <div
                      class="bg-gray opacity-30 h-[112.5px] w-[180px] flex flex-justify-center flex-items-center"
                      @click="enterScene(record.sceneId)"
                    >
                      <el-icon size="32"><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
              <div class="ml-6 w-full h-full flex flex-col">
                <div>
                  <el-link
                    style="font-size: 18px"
                    :underline="false"
                    @click="enterScene(record.sceneId)"
                  >
                    {{ record.scene.name }}
                  </el-link>
                </div>
                <div class="mt-2 text-[14px] text-gray">
                  {{ dayjs(record.time).format('YYYY年MM月DD日 HH:mm:ss') }}
                </div>
                <div class="text-right flex-grow-1">
                  <el-button
                    @click="deleteHistory(record.scene.creatorId, record.sceneId)"
                    :icon="Delete"
                    link
                  ></el-button>
                </div>
                <div class="pb-6.5 flex flex-items-center">
                  <el-avatar
                    @click="gotoProfile(record.scene.creatorId)"
                    size="small"
                    class="cursor-pointer"
                    :src="record.scene.creator.avatarUrl"
                  ></el-avatar>
                  <el-link
                    @click="gotoProfile(record.scene.creatorId)"
                    :underline="false"
                    class="ml-2"
                  >
                    {{ record.scene.creator.name }}
                  </el-link>
                  <template v-for="colla in record.scene.collaborators">
                    <span class="ml-3 mr-3 text-gray"> | </span>
                    <el-avatar
                      @click="gotoProfile(colla.id)"
                      size="small"
                      class="cursor-pointer"
                      :src="colla.avatarUrl"
                    ></el-avatar>
                    <el-link @click="gotoProfile(colla.id)" :underline="false" class="ml-2">
                      {{ colla.name }}
                    </el-link>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
      <div v-else class="flex w-full">
        <div class="mx-auto text-gray-1">加载中...</div>
      </div>
    </div>
    <div id="loadingListener" />
  </div>
</template>

<style scoped>
  .l-info {
    width: 66px;
    border-right: 1px solid #e5e9ef;
    overflow: visible;
    height: 151px;
    position: absolute;
  }
  .history-red-round {
    position: absolute;
    right: -5px;
    top: 80px;
    border: 5px dashed #e5e9ef;
    border-right-width: 0;
    border-left-style: solid;
    border-top-color: transparent;
    border-bottom-color: transparent;
  }
  .lastplay-t {
    color: #99a2aa;
    position: absolute;
    width: 80px;
    top: 74px;
    left: 88px;
    font-size: 14px;
  }
  .r-info {
    border-bottom: 1px solid #e5e9ef;
    margin-left: 200px;
    padding-top: 25px;
    width: 100%;
    height: 125px;
  }
  .time-label {
    position: absolute;
    right: 12px;
    background-color: #ff74a5;
    color: #fff;
    font-size: 14px;
    text-align: center;
    height: 34px;
    line-height: 36px;
    border-radius: 4px;
    padding: 0 8px;
    border: 1px solid #ff74a5;
    z-index: 998;
    white-space: nowrap;
    &::before,
    &::after {
      position: absolute;
      top: 13px;
      content: '';
      border-bottom: 5px solid transparent;
      border-top: 5px solid transparent;
      border-left: 8px solid #ff74a5;
    }
    &::before {
      right: -6px;
      z-index: 2;
    }
    &::after {
      right: -8px;
      z-index: 1;
    }
  }
</style>

<script setup lang="ts">
  import { Clock, Delete, Search, Picture } from '@element-plus/icons-vue'

  type SceneHistoryWithTimeLabel = SceneHistoryWithUser & { timeLabel?: string }

  definePageMeta({
    layout: 'header',
  })
  useHead({
    title: '历史记录',
  })

  const router = useRouter()
  const history = ref<SceneHistoryWithTimeLabel[]>([])

  const search = ref('')

  function clearHistory() {
    ElMessage({
      message: 'TODO 清空所有历史记录',
    })
  }

  function deleteHistory(userId: number, sceneId: number) {
    ElMessage({
      message: 'TODO 删除一条历史记录',
    })
  }

  const searchHistory = useThrottleFn(() => {
    if (search.value.trim() === '') {
      return
    }
    ElMessage({ message: 'TODO 根据关键词搜索历史' })
  }, 1000)

  const enterScene = (sceneId: number) => router.push({ path: `/scene`, query: { id: sceneId } })

  const gotoProfile = (userId: number) => router.push({ path: `/profile`, query: { id: userId } })

  async function loadHistory() {
    try {
      await (
        await listSceneHistory({ first: 10, after: history.value.length })
      ).data.forEach((e) =>
        history.value?.push({
          ...e,
          timeLabel: getTimeLabel(e.time),
        }),
      )
    } catch (error) {
      handleApiError('获取历史记录', error)
    }
  }

  const labelUsed = {
    today: false,
    yesterday: false,
    lastweek: false,
    weekago: false,
  }

  const getTimeLabel = (time: any) => {
    const interval = dayjs().startOf('day').diff(dayjs(time).startOf('day'), 'day')
    if (interval == 0 && !labelUsed.today) {
      labelUsed.today = true
      return '今天'
    } else if (interval == 1 && !labelUsed.yesterday) {
      labelUsed.yesterday = true
      return '昨天'
    } else if (interval > 1 && interval < 8 && !labelUsed.lastweek) {
      labelUsed.lastweek = true
      return '近 1 周'
    } else if (interval > 7 && !labelUsed.weekago) {
      labelUsed.weekago = true
      return '1 周前'
    }
  }

  onMounted(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadHistory()
        }
      })
    })
    observer.observe(document.getElementById('loadingListener') as Element)
  })
</script>
