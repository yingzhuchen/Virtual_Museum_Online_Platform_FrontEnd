<template>
  <div class="flex w-full pb-8">
    <!-- 左侧内容栏 -->
    <div class="w-70% bg-white rounded px-14 py-10">
      <!-- 置顶场景 -->
      <div v-if="stickie.length">
        <div class="text-[20px]">置顶场景</div>
        <div class="w-full mt-6 grid grid-cols-3 gap-4">
          <div v-for="item in stickie" class="flex flex-col" :key="item.id">
            <el-image
              :src="item.coverUrl"
              fit="cover"
              class="h-full w-full rounded-2 cursor-pointer"
              @click="enterScene(item.id)"
            >
              <!-- IMPROVE 用包裹元素的方式控制比例 -->
              <template #error>
                <div
                  class="bg-gray opacity-30 h-full w-full flex flex-justify-center flex-items-center"
                  style="aspect-ratio: 16/9"
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
                        :icon="Download"
                        class="!w-full"
                        :underline="false"
                        @click="delStickie(item.id)"
                      >
                        <span class="ml-2">取消置顶</span>
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
        <hr class="my-8" />
      </div>
      <!-- 我的场景 -->
      <div>
        <!-- 顶栏 -->
        <div class="flex items-center">
          <div class="text-[20px]">{{ route.query.id ? 'TA' : '我' }}的场景</div>
          <div v-if="scenes.length" class="ml-[100px] label">{{ scenes.length }}</div>
        </div>
        <!-- 场景列表 -->
        <template v-if="!loadingScenes">
          <div v-if="scenes.length" class="w-full mt-6 grid grid-cols-3 gap-4">
            <div v-for="item in scenes" class="flex flex-col" :key="item.id">
              <el-image
                :src="item.coverUrl"
                fit="cover"
                class="h-full w-full rounded-2 cursor-pointer"
                @click="enterScene(item.id)"
              >
                <!-- IMPROVE 用包裹元素的方式控制比例 -->
                <template #error>
                  <div
                    class="bg-gray opacity-30 h-full w-full flex flex-justify-center flex-items-center"
                    style="aspect-ratio: 16/9"
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
                          @click="addStickie(item.id)"
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

      <!-- 我的收藏夹 -->
      <div v-if="!route.query.id">
        <hr class="my-8" />
        <!-- 顶栏 -->
        <div class="flex items-center">
          <div class="text-[20px]">{{ route.query.id ? 'TA' : '我' }}的收藏夹</div>
          <div v-if="favlist.length" class="ml-[120px] label">{{ favlist.length }}</div>
        </div>
        <!-- 收藏夹列表 -->
        <template v-if="!loadingScenes">
          <div v-if="favlist.length" class="w-full mt-6 grid grid-cols-3 gap-4">
            <div v-for="item in favlist" class="flex flex-col">
              <el-image
                :src="item.coverUrl"
                fit="cover"
                class="h-full w-full rounded-2 cursor-pointer"
                @click="$router.push({ path: `/profile/favlist`, query: { name: item.name } })"
              >
                <template #error>
                  <!-- IMPROVE 用包裹元素的方式控制比例 -->
                  <div
                    class="bg-gray opacity-30 w-full flex flex-justify-center flex-items-center"
                    style="aspect-ratio: 16/9"
                    @click="$router.push({ path: `/profile/favlist`, query: { name: item.name } })"
                  >
                    <el-icon size="32"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="my-1">
                <el-link :underline="false" @click="ElMessage('TODO 打开收藏夹')">
                  <span class="line-clamp-1 text-3.75">
                    {{ item.name }}
                  </span>
                </el-link>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col w-sm m-auto">
            <el-image
              src="https://demo-bucket-1325569882.cos.ap-guangzhou.myqcloud.com/background/02e2f66e41cc04746bb418ef18db9d1.png"
            />
            <span class="text-center"> 暂无收藏夹 </span>
          </div>
        </template>
      </div>
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
    <template v-if="!loadingFavlist">
      <div v-if="!favlist.length" class="flex flex-col">
        <el-image
          class="w-64 m-auto"
          src="https://demo-bucket-1325569882.cos.ap-guangzhou.myqcloud.com/background/b60ee5942e1fc103d9f1ba55a1ea712.png"
        />
        <div class="flex m-auto">
          <span class="text-[15px] text-gray-1">暂无收藏夹</span>
          <el-link class="ml-2" @click="$router.push({ path: `/profile/favlist` })"
            >去创建 ></el-link
          >
        </div>
      </div>
      <el-checkbox-group v-model="favlistSelected" class="flex flex-col ml-6 mt-2">
        <el-checkbox v-for="item in favlist" :value="item.name">
          <div class="flex">
            <div class="w-[200px]">{{ item.name }}</div>
            <span>· {{ item.scenes.length }} 个内容</span>
          </div>
        </el-checkbox>
      </el-checkbox-group>
    </template>
    <template #footer>
      <el-button v-if="favlist.length" @click="addScene2Favlist">添加</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import {
    Upload,
    Setting,
    PictureRounded,
    Picture,
    MoreFilled,
    Edit,
    Star,
    Download,
  } from '@element-plus/icons-vue'
  import type { SceneResponse } from '~/api'
  import type { GetUserInfoResponse } from '~/api/models/GetUserInfoResponse'
  import type { TopSceneId } from '~/api/models/TopSceneId'

  type FavlistItem = {
    name: string
    scenes: number[]
    coverUrl?: string
  }

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

  const scenes = ref<ListSceneWithUserResponse['data']>([])
  const stickie = ref<SceneResponse[]>([])

  const favlist = ref<FavlistItem[]>([])
  const favlistSelected = ref<string[]>([])

  const loadingScenes = ref(true)
  const loadingFavlist = ref(true)

  const dialogVisible = reactive({
    selectFavlist: false,
  })

  let sceneSelected = -1

  const selectFavlist = (sceneId: number) => {
    sceneSelected = sceneId
    dialogVisible.selectFavlist = true
  }

  const enterScene = (sceneId: number) =>
    useRouter().push({ path: `/scene`, query: { id: sceneId } })

  const getFavlist = async () => {
    try {
      favlist.value = []
      ;(
        await api.favouritesCRUD({
          operation: 'Read',
          body: null,
        })
      ).favouritesList.forEach(async (favlistName: string) => {
        const sceneIdList = await getFavlistScenes(favlistName)
        if (sceneIdList.length) {
          await useApi('scene')
            .getScene(sceneIdList[0])
            .then((s) => {
              favlist.value.push({
                name: favlistName,
                scenes: sceneIdList,
                coverUrl: s.coverUrl,
              })
            })
            .finally(() => (loadingFavlist.value = false))
        }
      })
    } catch (err: any) {
      handleApiError('获取收藏夹', err)
    }
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
        // FIXME 调用接口会遗漏参数，确定api问题
        api.favoriteCRUD({
          operation: 'Update',
          body: {
            existingFavouritesName: favlistName,
            sceneIdList: sceneIdList,
          },
        })
      })
      ElMessage.success('收藏成功')
    } catch (err: any) {
      handleApiError('添加收藏夹内容', err)
    } finally {
      dialogVisible.selectFavlist = false
      favlistSelected.value = []
    }
  }

  async function listScenes() {
    try {
      let _userId = Number(route.query.id)
      if (!_userId) {
        _userId = (await userStore.userInfoLoaded).id
      }
      scenes.value = (await listSceneWithUser({ userId: _userId })).data
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
    getStickie(userInfo.value?.topSceneIdList)
  }

  async function getStickie(topSceneIdList?: TopSceneId[]) {
    if (!topSceneIdList) return
    try {
      stickie.value = []
      topSceneIdList.forEach(async (scene) => stickie.value.push(await api.getScene(scene.id)))
    } catch (err: any) {
      handleApiError('获取置顶场景', err)
    }
  }

  async function delStickie(sceneId: number) {
    try {
      const list = userInfo.value?.topSceneIdList?.slice() ?? []
      await api.updateUserInfo({ topSceneIdList: list.filter((scene) => scene.id !== sceneId) })
      ElMessage.success('场景已取消置顶')

      await userStore.fetchUserInfo()
      userInfo.value = userStore.userInfo
      getStickie(userInfo.value?.topSceneIdList)
    } catch (err: any) {
      handleApiError('场景取消置顶', err)
    }
  }

  async function addStickie(sceneId: number) {
    try {
      const list = userInfo.value?.topSceneIdList?.slice() ?? []
      for (const scene of list) {
        if (scene.id === sceneId) {
          ElMessage.warning('该场景已置顶')
          return
        }
      }
      list.push({ id: sceneId })
      await api.updateUserInfo({ topSceneIdList: list })
      ElMessage.success('置顶成功')

      await userStore.fetchUserInfo()
      userInfo.value = userStore.userInfo
      getStickie(userInfo.value?.topSceneIdList)
    } catch (err: any) {
      handleApiError('置顶场景', err)
    }
  }

  watch(
    () => dialogVisible.selectFavlist,
    async () => {
      if (dialogVisible.selectFavlist) {
        loadingFavlist.value = true
        getFavlist()
      }
    },
  )

  watch(
    () => route.query.id,
    () => {
      listScenes()
      getUserInfo()
      if (!route.query.id) getFavlist()
    },
    { immediate: true },
  )
</script>

<style scoped>
  .label {
    position: absolute;
    background-color: #f6fafb;
    border: 1px solid #ddd;
    color: #777;
    font-size: 12px;
    text-align: center;
    height: 18px;
    line-height: 18px;
    border-radius: 4px;
    padding: 0 8px;
    z-index: 2;
    white-space: nowrap;
    &::before,
    &::after {
      position: absolute;
      content: '';
    }
    &::before {
      top: 5px;
      left: -4px;
      z-index: 2;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      border-right: 5px solid #f6fafb;
    }
    &::after {
      top: 4px;
      left: -6px;
      z-index: 1;
      border-top: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-right: 6px solid #ddd;
    }
  }
</style>
