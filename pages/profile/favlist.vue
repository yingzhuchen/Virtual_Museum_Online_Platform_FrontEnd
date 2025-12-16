<template>
  <div class="flex w-full pb-8">
    <!-- 左侧内容栏 -->
    <div class="w-70% bg-white rounded px-14 py-10">
      <div class="flex">
        <div class="text-[20px]">{{ route.query.id ? 'TA' : '我' }}的收藏夹</div>
      </div>
      <div>
        <!-- 收藏夹内容 -->
        <template v-if="!loading">
          <div v-if="curScenes.length" class="w-full mt-12 grid grid-cols-3 gap-4">
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
                      <el-link
                        :icon="Star"
                        class="!w-full"
                        :underline="false"
                        @click="delScene4Favlist(item.id)"
                      >
                        <span class="ml-2">取消收藏</span>
                      </el-link>
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
              class="w-64 h-54 m-auto"
              fit="cover"
              src="https://demo-bucket-1325569882.cos.ap-guangzhou.myqcloud.com/background/ab2ec7dc269a263de2e1dae3feafcea.png"
            />
            <span class="text-center">该收藏夹还没有内容哦~</span>
          </div> </template
        ><div v-else v-loading="loading" element-loading-text="加载中..."></div>
      </div>
    </div>
    <!-- 右侧收藏夹栏 -->
    <div class="w-30% bg-white border border-solid border-gray-200 border-1">
      <!-- 新增收藏夹 -->
      <div
        class="flex items-center pl-33% h-18 favlist-item"
        @click="dialogVisible.addFavlist = true"
      >
        <el-icon size="24"><CirclePlus /></el-icon>
        <span class="ml-2">新增收藏夹</span>
      </div>
      <!-- 收藏夹列表 -->
      <template v-for="(item, index) in favlist" :key="item.id">
        <div
          @click="clickItem(index)"
          :class="[
            'w-full flex items-center h-18',
            itemIndex == index ? 'bg-[#f1f1f1]' : 'favlist-item',
          ]"
        >
          <div class="w-[50%] flex items-center pl-33%">
            <el-icon size="24"><Folder /></el-icon>
            <span class="ml-2">{{ item.name }}</span>
          </div>
          <div class="w-[30%]" @mouseenter="item.focus = true" @mouseleave="item.focus = false">
            <span v-if="!item.focus" class="ml-4">{{ item.scenes?.length }}</span>
            <div v-else @mouseleave="btnClicked = false">
              <el-button :icon="MoreFilled" link class="ml-4" @click="btnClicked = true" />
              <transition>
                <div
                  v-if="btnClicked"
                  class="absolute flex flex-col items-center z-5 bg-white border-gray-300 rounded-2 b-solid"
                >
                  <el-button class="w-[200px] !ml-0" @click="dialogVisible.editFavlist = true"
                    >重命名</el-button
                  >
                  <el-button class="w-[200px] !ml-0" @click="delFavlist(item.name)">删除</el-button>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- 新增收藏夹对话框-->
  <el-dialog
    v-model="dialogVisible.addFavlist"
    title="新增收藏夹"
    width="450"
    align-center
    @close="favlistForm.newFavouritesName = ''"
  >
    <el-form :model="favlistForm">
      <el-form-item label="名称：" class="mt-4 mx-15">
        <el-input v-model="favlistForm.newFavouritesName" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div>
        <el-button @click="addFavlist(favlistForm)">确认</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 编辑收藏夹对话框 -->
  <el-dialog
    v-model="dialogVisible.editFavlist"
    title="重命名收藏夹"
    width="450"
    align-center
    @close="favlistForm.newFavouritesName = ''"
  >
    <el-form :model="favlistForm">
      <el-form-item label="新名称：" class="mt-4 mx-15">
        <el-input v-model="favlistForm.newFavouritesName" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div>
        <el-button @click="editFavlist(favlistForm)">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { CirclePlus, Folder, MoreFilled, Picture, Star } from '@element-plus/icons-vue'
  import type { SceneResponse } from '~/api'
  import type { FavouritesCrudRequestBody } from '~/api/models/FavouritesCrudRequestBody'
  import type { GetUserInfoResponse } from '~/api/models/GetUserInfoResponse'

  interface FavlistItem {
    name: string
    scenes: SceneResponse[]
    focus: boolean
  }

  // 右侧收藏夹列表中的更多按钮点击状态
  const btnClicked = ref(false)

  const dialogVisible = reactive({
    addFavlist: false,
    editFavlist: false,
  })
  const loading = ref(true)

  const favlistForm = reactive({ newFavouritesName: '' })

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

  const favlist = ref<FavlistItem[]>([])
  // 当前被选中的收藏夹序号
  const itemIndex = ref(0)
  // 当前收藏夹内容显示的场景列表
  const curScenes = ref<SceneResponse[]>([])

  const enterScene = (sceneId: number) =>
    useRouter().push({ path: `/scene`, query: { id: sceneId } })

  const clickItem = (index: number) => {
    itemIndex.value = index
    curScenes.value = favlist.value[index]?.scenes ?? []
  }

  let once_flag = true
  const openFavlist = () => {
    if (once_flag) {
      favlist.value.forEach((f, i) => {
        if (f.name === route.query.name) itemIndex.value = i
      })
      once_flag = false
    }
    clickItem(itemIndex.value)
  }

  async function getUserInfo() {
    const userId = Number(route.query.id)
    if (!isNaN(userId)) {
      userInfo.value = await batchGetUserInfo(userId)
    } else {
      userInfo.value = await userStore.userInfoLoaded
    }
  }

  const addFavlist = async (reqBody: FavouritesCrudRequestBody) => {
    try {
      await api.favouritesCRUD({ operation: 'Create', body: reqBody })
      ElMessage.success('创建成功')
      getFavlist()
    } catch (err: any) {
      handleApiError('创建收藏夹', err)
    } finally {
      dialogVisible.addFavlist = false
    }
  }

  const delFavlist = async (favlistName: string) => {
    try {
      await api.favouritesCRUD({
        operation: 'Delete',
        body: { existingFavouritesName: favlistName },
      })
      ElMessage.success('删除成功')
      getFavlist()
      clickItem(0)
    } catch (err: any) {
      handleApiError('删除收藏夹', err)
    }
  }

  const editFavlist = async (reqBody: FavouritesCrudRequestBody) => {
    try {
      const curFavlistName: string = favlist.value[itemIndex.value].name
      // FIXME 调用接口会遗漏参数，确定api问题
      await api.favouritesCRUD({
        operation: 'Update',
        body: { existingFavouritesName: curFavlistName, ...reqBody },
      })
      ElMessage.success('重命名成功')
      getFavlist()
    } catch (err: any) {
      handleApiError('更新收藏夹', err)
    } finally {
      dialogVisible.editFavlist = false
    }
  }

  async function getFavlist() {
    try {
      favlist.value = []
      const data = await api.favouritesCRUD({ operation: 'Read', body: null })
      for (const name of data.favouritesList) {
        const scenes = await getFavlistScenes(name)
        favlist.value.push({
          name: name,
          scenes: scenes,
          focus: false,
        })
      }
      openFavlist()
    } catch (error) {
      handleApiError('获取收藏夹', error)
    } finally {
      loading.value = false
    }
  }

  async function getFavlistScenes(favlistName: string) {
    const scenes: SceneResponse[] = []
    try {
      const data = await api.favoriteCRUD({
        operation: 'Read',
        body: { existingFavouritesName: favlistName },
      })
      for (const sceneId of data.favoriteList) {
        const scene = await useApi('scene').getScene(sceneId)
        scenes.push(scene)
      }
    } catch (err: any) {
      handleApiError('获取收藏夹内容', err)
    } finally {
      return scenes
    }
  }

  async function delScene4Favlist(sceneId: number) {
    const curFavlist = favlist.value[itemIndex.value]
    try {
      const sceneIdList = curFavlist.scenes
        .map((scene) => scene.id)
        .filter((sid) => sid !== sceneId)
      await api.favoriteCRUD({
        operation: 'Update',
        body: {
          existingFavouritesName: curFavlist.name,
          sceneIdList: sceneIdList,
        },
      })
      getFavlist()
      ElMessage.success('移除成功')
    } catch (err: any) {
      handleApiError('移除收藏夹内容', err)
    }
  }

  watch(
    () => route.query.id,
    () => {
      getUserInfo()
    },
    { immediate: true },
  )

  onMounted(() => getFavlist())
</script>

<style scoped>
  .favlist-item {
    cursor: pointer;
    &:hover {
      background-color: #f1f1f1;
      transition: 0.3s;
    }
  }
</style>
