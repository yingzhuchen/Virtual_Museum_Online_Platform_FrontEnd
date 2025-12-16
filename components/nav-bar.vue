<template>
  <div
    :class="['top-0 z-50 w-full min-w-5xl', searchBar ? 'background h-30' : 'navbar sticky h-16']"
  >
    <div class="py-2">
      <div :class="['w-full h-full grid items-center', searchBar ? 'grid-cols-3' : 'grid-cols-2']">
        <div class="ml-4 flex items-center">
          <el-icon
            class="cursor-pointer"
            size="44"
            :color="searchBar ? 'white' : 'black'"
            @click="$router.push('/')"
            ><ElementPlus
          /></el-icon>
          <span
            :class="[
              'text-[22px] ml-2 font-bold cursor-pointer',
              searchBar ? 'text-white' : 'text-black',
            ]"
            @click="$router.push('/')"
          >
            Luma Studio
          </span>
        </div>
        <div v-if="searchBar" class="text-center">
          <el-input
            v-model="search"
            :class="[
              'max-w-90% h-9 hover:opacity-90 transition-all',
              CompState.isSearchInputFocused ? 'opacity-90' : 'opacity-65',
            ]"
            placeholder="请输入内容"
            clearable
            @keydown.prevent.enter="searchScene"
            @focus="CompState.isSearchInputFocused = true"
            @blur="CompState.isSearchInputFocused = false"
          >
            <template #append>
              <el-button @click="searchScene" :icon="Search" />
            </template>
          </el-input>
        </div>
        <div class="ml-auto mr-4 flex flex-justify-end items-end">
          <div
            class="relative flex w-10 h-10 mr-4"
            @mouseenter="CompState.isAvatarHovered = true"
            @mouseleave="CompState.isAvatarHovered = false"
          >
            <!-- 头像 -->
            <el-avatar
              :src="userInfo?.avatarUrl"
              :class="[
                'mr-6 transition-all my-auto z-50 w-10 h-10 shrink-0 cursor-pointer',
                CompState.isAvatarHovered && 'scale-140 translate-y-4',
              ]"
              @click="onClickAvatar"
            />
            <!-- 用户信息框 -->
            <transition name="avatar-fade" mode="out-in">
              <div
                v-if="CompState.isAvatarHovered"
                class="absolute flex flex-col px-2 pt-7 w-40 -left-17.5 bg-white rounded-2 top-10 z-10 b-1px b-solid"
                style="border-color: lightgray"
              >
                <div v-if="userInfo" class="flex flex-col items-center">
                  <div :underline="false" style="font-size: 18px" @click="onClickAvatar">
                    <div>{{ userInfo.nickName }}</div>
                  </div>
                  <div class="text-sm text-gray-1"> @{{ userInfo.name }} </div>
                </div>
                <div v-else class="text-center text-gray-1 text-sm"> 加载中 </div>
                <hr class="w-80%" style="border: 1px solid lightgray" />
                <div class="line-height-relaxed mb-10px mx-auto">
                  <el-button type="info" link :icon="ElIconLock" @click="logout">
                    退出登录
                  </el-button>
                </div>
              </div>
            </transition>
          </div>

          <el-button link @click="$router.push({ path: `/profile/favlist` })">
            <div class="flex items-center flex-col gap-y-1 mr-4 btn">
              <el-icon size="20px" :color="searchBar ? '#eeeeee' : 'black'" class="ico">
                <Star />
              </el-icon>
              <span
                :class="['text-[13px]', searchBar ? 'text-#eeeeee' : 'text-black']"
                style="margin-left: 0"
              >
                收藏
              </span>
            </div>
          </el-button>

          <div
            class="mr-4"
            @mouseenter="CompState.isHistoryHovered = true"
            @mouseleave="CompState.isHistoryHovered = false"
          >
            <el-button link @click="$router.push({ path: `/history` })">
              <div class="flex items-center flex-col gap-y-1 btn">
                <el-icon size="20px" :color="searchBar ? '#eeeeee' : 'black'" class="ico">
                  <Clock />
                </el-icon>
                <span
                  :class="['text-[13px]', searchBar ? 'text-#eeeeee' : 'text-black']"
                  style="margin-left: 0"
                >
                  历史
                </span>
              </div>
            </el-button>
            <!-- 历史记录框 -->
            <transition name="history-fade" mode="out-in">
              <div
                v-if="CompState.isHistoryHovered"
                class="absolute flex flex-col z-98 right-[10px] w-[400px]"
              >
                <div class="h-2"></div>
                <div class="bg-white rounded-2 shadow-lg">
                  <template v-for="record in history?.data.slice(0, 4)">
                    <div v-if="record?.timeLabel" class="ml-4 mt-1 py-2 text-[17px]">
                      {{ record.timeLabel }}
                    </div>
                    <div
                      class="flex px-4 py-2 cursor-pointer hover:bg-[#f2f2f2] hover:duration-300"
                      @click="enterScene(record.sceneId)"
                    >
                      <div class="max-h-[100px]">
                        <el-image
                          class="rounded-2 cursor-pointer w-36 h-20"
                          fit="cover"
                          :src="record.scene.coverUrl"
                        >
                          <template #error>
                            <div
                              class="bg-gray opacity-30 w-36 h-20 flex flex-justify-center flex-items-center"
                            >
                              <el-icon size="32"><Picture /></el-icon>
                            </div>
                          </template>
                        </el-image>
                      </div>
                      <div class="ml-6 w-full h-full flex flex-col">
                        <div>
                          <div class="line-clamp-2 text-[15px] h-[30px]">
                            {{ record.scene.name }}
                          </div>
                        </div>
                        <div class="mt-2 text-[14px] text-gray">
                          <span>{{ dayjs(record.time).fromNow() }}</span>
                          {{ dayjs(record.time).format('HH:mm:ss') }}
                        </div>
                        <div class="text-gray text-[14px]">
                          {{ record.scene.creator.name }}
                        </div>
                      </div>
                    </div>
                  </template>
                  <div
                    class="m-2 h-[32px] bg-[#F3F4F4] cursor-pointer rounded flex items-center justify-center text-gray hover:text-black hover:duration-300"
                    @click="$router.push({ path: `/history` })"
                  >
                    查看全部
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <el-button link @click="$router.push({ path: `/manager` })">
            <div class="flex items-center flex-col gap-y-1 btn">
              <el-icon size="20px" :color="searchBar ? '#eeeeee' : 'black'" class="ico">
                <PictureRounded />
              </el-icon>
              <span
                :class="['text-[13px]', searchBar ? 'text-#eeeeee' : 'text-black']"
                style="margin-left: 0"
              >
                创作中心
              </span>
            </div>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    ElementPlus,
    Search,
    Star,
    Clock,
    PictureRounded,
    Picture,
  } from '@element-plus/icons-vue'

  type SceneHistoryRecord = SceneHistoryWithUser & { timeLabel?: string }

  withDefaults(
    defineProps<{
      searchBar?: boolean
    }>(),
    { searchBar: true },
  )

  const router = useRouter()
  const userStore = useUserStore()
  const { userInfo } = storeToRefs(userStore)

  const CompState = reactive({
    isAvatarHovered: false,
    isHistoryHovered: false,
    isSearchInputFocused: false,
  })

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

  const search = ref('')
  const history = ref<any>()

  const enterScene = (sceneId: number) => router.push({ path: `/scene`, query: { id: sceneId } })

  function logout() {
    userStore.token = ''
    ElMessage({ type: 'success', message: '已退出登录' })
  }

  function searchScene() {
    if (search.value.trim() !== '')
      useRouter().push({ path: `/search`, query: { keyword: search.value } })
  }

  function onClickAvatar() {
    router.push('/profile')
  }

  async function loadHistory() {
    try {
      history.value = await listSceneHistory()
      history.value?.data.forEach((e: SceneHistoryRecord) => (e.timeLabel = getTimeLabel(e.time)))
    } catch (error) {
      handleApiError('获取历史记录', error)
    }
  }

  watch(
    () => CompState.isHistoryHovered,
    () => loadHistory(),
    { once: true },
  )
</script>

<style scoped>
  .navbar {
    background: linear-gradient(
      180deg,
      rgba(230, 230, 230, 0.6) 4%,
      rgba(235, 235, 235, 0.5) 30%,
      rgba(240, 240, 240, 0.4) 59%,
      rgba(245, 245, 245, 0.3) 69%,
      rgba(250, 250, 250, 0.2) 81%,
      rgba(255, 255, 255, 0) 99%
    );
    box-shadow: 0px -12px 20px 0px rgba(0, 0, 0, 0.35);
  }
  .background {
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent),
      url('https://demo-bucket-1325569882.cos.ap-guangzhou.myqcloud.com/5XFAzpVr.png');
    background-repeat: no-repeat;
    background-size: 100% auto;
  }
  .transition {
    transition: opacity 0.5s ease;
  }
  .fade-out {
    opacity: 0;
  }
  .btn:hover .ico {
    animation: jump 0.3s ease-in-out;
  }
  @keyframes jump {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  /* 头像框的 transition 样式 */
  .avatar-fade-enter-active,
  .avatar-fade-leave-active {
    transition:
      opacity 0.5s,
      transform 0.3s;
  }

  .avatar-fade-enter-from,
  .avatar-fade-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }

  /* 历史框的 transition 样式 */
  .history-fade-enter-active,
  .history-fade-leave-active {
    transition:
      opacity 0.5s,
      transform 0.3s;
  }

  .history-fade-enter-from,
  .history-fade-leave-to {
    opacity: 0;
  }
</style>
