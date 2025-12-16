<template>
  <hsr-dialog
    class="w-70vw h-75vh"
    v-model="showDialog"
    no-padding
    :key-input-context="keyInputContext"
  >
    <div v-if="scene" class="flex h-full min-w-[50rem]">
      <div class="relative w-57% flex flex-col pb-7.5 pt-16 px-10">
        <div class="absolute bottom-1 right-3">
          <el-button link @click="emit('open-setting-dialog')">
            <el-icon size="24"><Setting /></el-icon>
            <span class="text-[20px]">设置</span>
          </el-button>
          <el-button link @click="$router.back">
            <el-icon size="24"><ExitToAppOutlined /></el-icon>
            <span class="text-[20px]">离开</span>
          </el-button>
        </div>
        <div class="flex items-center">
          <el-icon size="40px" color="rgba(17,24,39,0.95)">
            <el-icon-location-filled class="h-full w-full" />
          </el-icon>
          <span class="text-8 ml-2 w-100 line-clamp-2">{{ scene.name }}</span>
        </div>
        <div class="relative">
          <el-image
            class="mt-3.5 rounded-2 w-full h-auto"
            v-if="scene.coverUrl"
            v-loading="!isImageLoaded"
            fit="cover"
            :min-scale="0.8"
            :max-scale="1.2"
            :src="scene.coverUrl"
            :preview-src-list="[scene.coverUrl]"
            @load="isImageLoaded = true"
          ></el-image>
          <div
            class="absolute bottom-1 right-0 h-24px px-2 rounded-rb-2 bg-[rgba(255,255,255,0.2)] backdrop-blur-5px"
          >
            <div class="flex items-center">
              <el-tooltip content="点赞" placement="bottom">
                <el-icon class="cursor-pointer" color="white" size="20" @click="likeScene"
                  ><Heart v-if="likeInfo?.isLiked" />
                  <HeartOutline v-else />
                </el-icon>
              </el-tooltip>
              <span class="text-white text-18px ml-1">{{ likeInfo?.sceneLikedCount }}</span>
              <el-tooltip content="收藏" placement="bottom">
                <el-icon
                  class="cursor-pointer ml-3"
                  color="white"
                  size="20"
                  @click="dialogVisible.selectFavlist = true"
                  ><Star
                /></el-icon>
              </el-tooltip>
            </div>
          </div>
        </div>

        <div class="flex items-center mt-3.5">
          <el-icon color="#848484" size="20px" title="场景标签">
            <el-icon-price-tag rotate="45deg" />
          </el-icon>
          <el-scrollbar class="w-full ml-3">
            <div class="flex gap-x-1.2">
              <el-tag v-for="(tag, key) in scene.tags" :key type="info">
                {{ tag }}
              </el-tag>
              <el-tag v-if="!scene.tags?.length" type="info">暂无</el-tag>
            </div>
          </el-scrollbar>
        </div>

        <table class="mt-auto">
          <tr class="text-[rgba(17,24,39,0.95)]">
            <td class="w-15">创建者</td>
            <td v-if="scene.collaborators.length">协作者</td>
          </tr>
          <tr>
            <td class="text-white flex items-center">
              <el-tooltip :content="scene.creator.nickName || scene.creator.name" placement="top">
                <el-image
                  class="w-10 h-10 rounded-full cursor-pointer"
                  fit="cover"
                  :src="scene.creator.avatarUrl"
                  @click="gotoProfile(scene.creator.id)"
                  @error="scene.creator.avatarUrl = defaultAvatarUrl"
                ></el-image>
              </el-tooltip>
            </td>
            <td v-if="scene.collaborators.length" class="text-white">
              <el-scrollbar class="w-45">
                <div class="flex gap-x-1.5">
                  <el-tooltip
                    v-for="(collaborator, key) in scene.collaborators"
                    :key
                    :content="collaborator.nickName || collaborator.name"
                    placement="top"
                  >
                    <el-image
                      class="w-10 h-10 rounded-full shrink-0 cursor-pointer"
                      fit="cover"
                      :src="collaborator.avatarUrl"
                      @click="gotoProfile(collaborator.id)"
                      @error="collaborator.avatarUrl = defaultAvatarUrl"
                    ></el-image>
                  </el-tooltip>
                </div>
              </el-scrollbar>
            </td>
          </tr>
        </table>
      </div>

      <div class="w-43% bg-[rgba(46,46,46,0.95)] flex flex-col">
        <div class="flex mt-8 ml-9">
          <div
            v-for="tab in tabs"
            @click="swtchTab(tab.index)"
            :class="[
              'cursor-pointer text-24px px-4 pb-2 transition-600',
              activeTab == tab.index
                ? 'b-b-solid b-yellow text-yellow'
                : 'text-white hover:text-yellow',
            ]"
          >
            {{ tab.name }}
          </div>
        </div>
        <div class="ml-7.5 mr-9 mt-10.5">
          <template v-if="activeTab == 0">
            <el-scrollbar class="text-white whitespace-pre-line !h-45vh text-18px" noresize>
              {{ scene.description }}
            </el-scrollbar>
          </template>
          <template v-else-if="activeTab == 1">
            <el-scrollbar class="!h-45vh">
              <div v-for="item in scenes" class="flex mb-4 w-full">
                <div class="max-h-[112.5px] max-w-[180px]">
                  <el-image
                    @click="enterScene(item.id)"
                    class="rounded-2 cursor-pointer w-45 h-25"
                    fit="cover"
                    :src="item.coverUrl"
                  >
                    <template #error>
                      <div
                        class="bg-gray opacity-30 h-[112.5px] w-[180px] flex flex-justify-center flex-items-center"
                        @click="enterScene(item.id)"
                      >
                        <el-icon size="32"><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>
                <div class="ml-6 w-full h-full flex flex-col">
                  <div>
                    <el-link
                      class="!text-18px !color-white !hover:color-gray-2 whitespace-nowrap"
                      :underline="false"
                      @click="enterScene(item.id)"
                    >
                      {{ item.name }}
                    </el-link>
                  </div>
                  <div class="mt-2 text-[14px] text-gray whitespace-nowrap">
                    {{ dayjs(item.createTime).format('YYYY年MM月DD日') }}
                  </div>
                  <div class="mt-6 flex flex-items-center">
                    <el-avatar
                      @click="gotoProfile(item.creatorId)"
                      size="small"
                      class="cursor-pointer"
                      :src="item.avatarUrl"
                    ></el-avatar>
                    <el-link @click="gotoProfile(item.creatorId)" :underline="false" class="ml-2">
                      {{ item.creatorName }}
                    </el-link>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </template>
        </div>

        <hsr-button
          v-if="viewerCanEdit"
          class="absolute bottom-0 right-0 min-w-xl w-10 mb-6 mr-8"
          text="修改"
          icon="edit"
          @click="onClickEdit"
        ></hsr-button>
      </div>
    </div>
  </hsr-dialog>

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
  import { Setting, Star, Picture } from '@element-plus/icons-vue'
  import ExitToAppOutlined from '@vicons/material/ExitToAppOutlined'
  import type { LikedScene200Response, SceneResponse } from '~/api'
  import { Heart, HeartOutline } from '@vicons/ionicons5'
  import type { KeyInputContext } from '~/utils/scene'

  type SceneResponseWithAvatar = SceneResponse & { avatarUrl?: string; creatorName?: string }

  type FavlistItem = {
    name: string
    scenes: number[]
  }

  type Tab = {
    name: string
    index: number
  }

  const tabs: Tab[] = [
    {
      name: '介绍',
      index: 0,
    },
    {
      name: '相似推荐',
      index: 1,
    },
  ]

  const activeTab = ref(0)
  const swtchTab = (tabIndex: number) => {
    activeTab.value = tabIndex
    if (tabIndex == 1) getRecommendScenes()
  }

  const api = useApi('default')
  const loadingFavlist = ref(true)

  const scenes = ref<SceneResponseWithAvatar[]>([])
  const likeInfo = ref<LikedScene200Response>()
  const favlist = ref<FavlistItem[]>([])
  const favlistSelected = ref<string[]>([])
  const dialogVisible = reactive({
    selectFavlist: false,
  })

  let once_flag = false
  async function getRecommendScenes() {
    if (once_flag) return
    try {
      scenes.value = await (await api.recommendScene('itemBasedRecommend', scene.value?.id)).data
      scenes.value.forEach(async (s) => {
        const userInfo = await api.getUserInfo(s.creatorId)
        s.avatarUrl = userInfo.avatarUrl
        s.creatorName = userInfo.nickName || userInfo.name
      })
      once_flag = true
    } catch (err: any) {
      handleApiError('获取推荐场景', err)
    }
  }

  defineExpose({
    show(_scene: SceneWithUser) {
      scene.value = _scene
      showDialog.value = true
    },
    close() {
      showDialog.value = false
    },
  })
  defineProps<{ keyInputContext?: KeyInputContext }>()

  const emit = defineEmits<{
    (e: 'show-dialog'): void
    (e: 'hide-dialog'): void
    (e: 'open-setting-dialog'): void
  }>()

  const router = useRouter()
  const userStore = useUserStore()

  const showDialog = ref(false)
  const scene = ref<SceneWithUser>()
  const isImageLoaded = ref(false)
  const viewerCanEdit = computed(() => {
    const isCreator = scene.value?.creatorId === userStore.userInfo?.id
    const isCollaborator = !!scene.value?.collaborators?.some(
      (c) => c.id === userStore.userInfo?.id,
    )
    return isCreator || isCollaborator
  })

  // 默认头像
  const defaultAvatarUrl = 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png'

  const getFavlist = async () => {
    try {
      favlist.value = []
      ;(
        await api.favouritesCRUD({
          operation: 'Read',
          body: null,
        })
      ).favouritesList.forEach(async (favlistName: string) => {
        await getFavlistScenes(favlistName)
          .then((sceneIdList) => {
            favlist.value.push({
              name: favlistName,
              scenes: sceneIdList,
            })
          })
          .finally(() => (loadingFavlist.value = false))
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

  watchEffect(() => {
    if (showDialog.value) {
      isImageLoaded.value = false
    } else {
      emit('hide-dialog')
    }
  })

  function onClickEdit() {
    if (!viewerCanEdit.value || !scene.value) return
    router.push({ path: '/manager/edit', query: { id: scene.value.id } })
  }

  async function getLikes() {
    if (!scene.value) return
    try {
      likeInfo.value = await api.likedScene({ sceneId: scene.value.id, operationType: 'read' })
    } catch (err: any) {
      handleApiError('获取点赞信息', err)
    }
  }

  async function likeScene() {
    if (!scene.value) return
    try {
      likeInfo.value = await api.likedScene({
        sceneId: scene.value.id,
        operationType: likeInfo.value?.isLiked ? 'dislike' : 'like',
      })
    } catch (err: any) {
      handleApiError('点赞相关操作', err)
    }
  }

  async function addScene2Favlist() {
    try {
      favlistSelected.value.map(async (favlistName) => {
        if (!scene.value) return
        const sceneIdList = await getFavlistScenes(favlistName)
        sceneIdList.push(scene.value.id)
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

  watch(scene, () => getLikes(), { immediate: true })

  watch(
    () => dialogVisible.selectFavlist,
    async () => {
      if (dialogVisible.selectFavlist) {
        loadingFavlist.value = true
        getFavlist()
      }
    },
  )

  const enterScene = (sceneId: number) => router.push({ path: `/scene`, query: { id: sceneId } })
  const gotoProfile = (userId: number) => router.push({ path: `/profile`, query: { id: userId } })
  watch(
    () => useRoute().query,
    () => {
      window.location.reload()
    },
  )
</script>
