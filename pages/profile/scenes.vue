<template>
  <div class="flex w-full pb-8">
    <!-- 左侧内容栏 -->
    <div class="w-70% bg-white rounded px-14 py-10">
      <!-- 顶栏 -->
      <div class="grid grid-cols-2 items-center">
        <div class="flex">
          <div class="text-[20px]">{{ route.query.id ? 'TA' : '我' }}的场景</div>
        </div>
        <div class="flex flex-justify-end items-end">
          <el-dropdown>
            <el-button class="flex w-[120px]">
              {{ listSceneOrders[listSceneOrder] }}
              <el-icon class="!ml-7"><ArrowDown /></el-icon>
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
          <el-input
            v-model="search"
            @keydown.prevent.enter="searchScene"
            class="max-w-[150px] ml-4"
            placeholder="输入关键词"
            :prefix-icon="Search"
          />
        </div>
      </div>
      <el-menu
        @select="selectTag"
        default-active="全部"
        class="!mt-2 !rounded !h-[32px] w-75%"
        mode="horizontal"
      >
        <el-menu-item index="全部" class="w-[80px]">
          <span>全部</span>
          <span class="ml-2">{{ scenes.length }}</span>
        </el-menu-item>
        <template v-for="value in tagScenes" :key>
          <el-menu-item :index="value[0]">
            <span>{{ value[0] }}</span>
            <span class="ml-2">{{ value[1].length }}</span>
          </el-menu-item>
        </template>
      </el-menu>
      <!-- 场景列表 -->
      <template v-if="!loadingScenes">
        <div v-if="curScenes.length" class="w-full mt-6 grid grid-cols-3 gap-4">
          <div v-for="item in curScenes" class="flex flex-col" :key="item.id">
            <el-image
              :src="item.coverUrl"
              fit="cover"
              class="h-full w-full rounded-2 cursor-pointer"
              @click="enterScene(item.id)"
            >
              <template #error>
                <div
                  class="bg-gray opacity-30 h-full w-full flex flex-justify-center flex-items-center"
                >
                  <el-icon size="32"><Picture /></el-icon>
                </div>
              </template>
            </el-image>

            <div class="my-1">
              <el-link :underline="false" @click="enterScene(item.id)">
                <span class="line-clamp-1 text-3.75">
                  {{ item.name }}
                </span>
              </el-link>
              <div class="grid grid-cols-2 items-center">
                <div class="mt-1 text-gray text-[14px]">
                  {{ dayjs(item.createTime).format('M-DD') }}
                </div>
                <div class="text-right">
                  <el-popover placement="right">
                    <template v-if="route.query.id">
                      <el-link
                        :icon="Star"
                        class="!w-full"
                        :underline="false"
                        @click="selectFavlist(item.id)"
                      >
                        <span class="ml-2">收藏场景</span>
                      </el-link>
                    </template>
                    <template v-else>
                      <el-link
                        :icon="Edit"
                        class="!w-full"
                        :underline="false"
                        @click="$router.push({ path: `/manager/edit`, query: { id: item.id } })"
                      >
                        <span class="ml-2">编辑场景</span>
                      </el-link>
                      <el-link
                        :icon="Upload"
                        class="!w-full"
                        :underline="false"
                        @click="ElMessage('TODO 置顶场景')"
                      >
                        <span class="ml-2">置顶场景</span>
                      </el-link>
                    </template>
                    <template #reference>
                      <el-button :icon="MoreFilled" link />
                    </template>
                  </el-popover>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col w-sm m-auto">
          <el-image
            src="https://demo-bucket-1325569882.cos.ap-guangzhou.myqcloud.com/background/b60ee5942e1fc103d9f1ba55a1ea712.png"
          />
          <span class="text-center">
            {{ route.query.id ? 'TA没有公开任何场景' : '还没有发布过场景哦，快去创建吧~' }}
          </span>
        </div>
      </template>
    </div>
    <!-- 右侧信息栏 -->
    <div class="w-30% ml-8">
      <div
        v-if="!route.query.id"
        class="bg-white rounded p-6 flex flex-col flex-justify-center items-center mb-8"
      >
        <div class="mb-8 flex items-center">
          <el-icon size="20px"><PictureRounded /></el-icon>
          <el-link
            :underline="false"
            class="!text-[24px] ml-6"
            @click="$router.push({ path: `/manager` })"
          >
            创作中心 >
          </el-link>
        </div>
        <el-button-group class="!w-full">
          <el-button
            :icon="Upload"
            class="w-50% !p-5"
            @click="$router.push({ path: `/manager/upload` })"
          >
            创建场景
          </el-button>
          <el-button :icon="Setting" class="w-50% !p-5" @click="$router.push({ path: `/manager` })">
            内容管理
          </el-button>
        </el-button-group>
      </div>
      <div class="bg-white rounded p-6">
        <template v-if="userInfo?.birthday || userInfo?.address">
          <div>个人资料</div>
          <hr class="my-4" />
          <div class="grid grid-cols-2">
            <!-- 个人资料信息显示 -->
            <div class="text-[13px] flex items-center" v-if="userInfo?.birthday">
              <div class="ws-nowrap">生日</div>
              <div class="ml-3">{{ userInfo.birthday }}</div>
            </div>
            <div class="text-[13px] flex items-center" v-if="userInfo?.address">
              <div class="ws-nowrap">地区</div>
              <div class="ml-3">{{ userInfo.address }}</div>
            </div>
          </div>
        </template>
        <div v-else> TA没有公布个人资料 </div>
      </div>
    </div>
  </div>

  <el-dialog v-model="dialogVisible.selectFavlist" title="选择收藏夹" width="380" align-center>
    <el-checkbox-group v-model="favlistSelected" class="flex flex-col ml-6 mt-2">
      <el-checkbox v-for="item in favlist" :value="item">
        {{ item }}
      </el-checkbox>
    </el-checkbox-group>
    <template #footer>
      <el-button @click="addScene2Favlist">确认添加</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import {
    Search,
    Upload,
    Setting,
    PictureRounded,
    Picture,
    ArrowDown,
    MoreFilled,
    Star,
    Edit,
  } from '@element-plus/icons-vue'
  import type { GetUserInfoResponse } from '~/api/models/GetUserInfoResponse'

  /** 投稿排序方式 */
  type ListSceneOrder = 'time-desc'

  definePageMeta({
    layout: 'profile',
  })
  useHead({
    title: '个人中心',
  })

  const api = useApi('default')

  const route = useRoute()
  const userStore = useUserStore()
  const userInfo = ref<GetUserInfoResponse | null>()
  const listSceneOrders: Record<ListSceneOrder, string> = {
    'time-desc': '最新投稿',
  }
  const listSceneOrder = ref<ListSceneOrder>('time-desc')

  const search = ref('')
  const scenes = ref<ListSceneWithUserResponse['data']>([])
  const tagScenes = ref<Map<string, ListSceneWithUserResponse['data']>>(new Map())
  const curScenes = ref<ListSceneWithUserResponse['data']>([])

  const favlist = ref<string[]>([])
  const favlistSelected = ref<string[]>([])

  const loadingScenes = ref(true)
  const dialogVisible = reactive({
    selectFavlist: false,
  })

  let sceneSelected = -1

  const selectFavlist = (sceneId: number) => {
    sceneSelected = sceneId
    dialogVisible.selectFavlist = true
  }

  const searchScene = () => {
    ElMessage('TODO 搜索场景')
  }

  const enterScene = (sceneId: number) =>
    useRouter().push({ path: `/scene`, query: { id: sceneId } })

  async function listScenes() {
    try {
      let _userId = Number(route.query.id)
      if (!_userId) {
        _userId = (await userStore.userInfoLoaded).id
      }
      scenes.value = (await listSceneWithUser({ userId: _userId })).data
      curScenes.value = scenes.value
      // 统计所有场景的标签
      for (const scene of scenes.value) {
        scene.tags?.forEach((tag) => {
          const tempScenes = tagScenes.value.get(tag) || []
          tempScenes.push(scene)
          tagScenes.value.set(tag, tempScenes)
        })
      }
      loadingScenes.value = false
    } catch (err: any) {
      handleApiError('获取场景列表', err)
    }
  }

  async function getUserInfo() {
    const userId = Number(route.query.id)
    if (!isNaN(userId)) {
      userInfo.value = await batchGetUserInfo(userId)
    } else {
      userInfo.value = await userStore.userInfoLoaded
    }
  }

  const selectTag = (tag: string) => {
    if (tag === '全部') {
      curScenes.value = scenes.value
    } else {
      curScenes.value = tagScenes.value.get(tag) || []
    }
  }

  const getFavlist = async () => {
    return (
      await api.favouritesCRUD({
        operation: 'Read',
        body: null,
      })
    ).favouritesList
  }

  const getFavlistScenes = async (favlistName: string) => {
    return (
      await api.favoriteCRUD({
        operation: 'Read',
        body: { existingFavouritesName: favlistName },
      })
    ).favoriteList
  }

  async function addScene2Favlist() {
    try {
      favlistSelected.value.map(async (favlistName) => {
        const sceneIdList = await getFavlistScenes(favlistName)
        sceneIdList.push(sceneSelected)
        // FIXME 调用接口会遗漏参数，疑似api问题
        api.favoriteCRUD({
          operation: 'Update',
          body: {
            existingFavouritesName: favlistName,
            sceneIdList: sceneIdList,
          },
        })
      })
    } catch (err: any) {
      handleApiError('添加收藏夹内容', err)
    } finally {
      dialogVisible.selectFavlist = false
      favlistSelected.value = []
    }
  }

  watch(
    () => dialogVisible.selectFavlist,
    async () => (favlist.value = await getFavlist()),
  )

  watch(
    () => route.query.id,
    () => {
      listScenes()
      getUserInfo()
    },
    { immediate: true },
  )
</script>
