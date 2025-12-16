<template>
  <div class="w-full my-10">
    <div v-loading="loading" class="mx-16 grid grid-cols-5 gap-5" element-loading-text="加载中...">
      <!-- 轮播图 -->
      <div class="pb-12.9 col-span-2 row-span-2">
        <el-carousel class="rounded-2 h-full" :interval="5000" height="100%">
          <el-carousel-item
            v-for="(item, key) in carousels?.data"
            class="cursor-pointer"
            :key
            @click="ElMessage.info('TODO')"
          >
            <el-image :src="item.url" fit="cover" class="h-full w-full" />
            <div v-if="item.caption" class="absolute bottom-10 left-10 text-white text-6">
              {{ item.caption }}
            </div>
          </el-carousel-item>
        </el-carousel>
        <!-- 标签栏 -->
        <div class="mt-4 grid grid-cols-6 gap-5">
          <template v-for="item in tagItems">
            <el-check-tag
              class="!py-0.5 !px-2"
              type="info"
              :checked="true"
              @click="onClickTag(item.title)"
            >
              <div class="grid grid-cols-2 grid-items-center">
                <component :is="item.icon" class="h-[24px]"></component>
                <span class="text-nowrap">{{ item.title }}</span>
              </div>
            </el-check-tag>
          </template>
        </div>
      </div>
      <!-- 场景列表 -->
      <div v-for="item in scenes" class="flex flex-col" :key="item.id">
        <!-- 包裹元素，用于控制宽高比 -->
        <div class="aspect-ratio-container">
          <el-image
            :src="item.coverUrl"
            fit="cover"
            class="h-full w-full rounded-2 cursor-pointer !absolute top-0"
            @click="enterScene(item.id)"
          >
            <template #error>
              <div
                class="bg-gray opacity-30 h-full w-full flex flex-justify-center flex-items-center"
                @click="enterScene(item.id)"
              >
                <el-icon size="32"><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>
        <div class="my-1">
          <el-link :underline="false" @click="enterScene(item.id)">
            <span class="line-clamp-1 text-3.75">
              {{ item.name }}
            </span>
          </el-link>
        </div>
        <div class="text-3.25 !block">
          <el-link
            :underline="false"
            type="info"
            @click="$router.push(`/profile?id=${item.creatorId}`)"
          >
            {{ item.creator.name }}
          </el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // 从 vicons 导入图标得一个个来，否则打包时会报错
  // @ts-ignore
  import CameraIndoorOutlined from '@vicons/material/CameraIndoorOutlined'
  // @ts-ignore
  import CameraOutdoorRound from '@vicons/material/CameraOutdoorRound'
  // @ts-ignore
  import LandscapeRound from '@vicons/material/LandscapeRound'
  import { Picture, Box, OfficeBuilding, MoreFilled } from '@element-plus/icons-vue'

  interface TagItem {
    index: number
    title: string
    icon?: any
  }

  definePageMeta({
    layout: 'header',
  })
  useHead({
    title: '场景广场',
  })

  const api = useApi()

  const tagItems: TagItem[] = [
    {
      index: 0,
      title: '物品',
      icon: Box,
    },
    {
      index: 1,
      title: '建筑',
      icon: OfficeBuilding,
    },
    {
      index: 2,
      title: '室内',
      icon: CameraIndoorOutlined,
    },
    {
      index: 3,
      title: '室外',
      icon: CameraOutdoorRound,
    },
    {
      index: 4,
      title: '风景',
      icon: LandscapeRound,
    },
    {
      index: 5,
      title: '更多',
      icon: MoreFilled,
    },
  ]

  const carousels = ref<ListCarouselImageWithSceneResponse>()
  const scenes = ref<any>([])
  const loading = ref(true)

  const enterScene = (sceneId: number) =>
    useRouter().push({ path: `/scene`, query: { id: sceneId } })

  const onClickTag = (tagName: string) =>
    useRouter().push({ path: `/search`, query: { keyword: tagName } })

  async function listScenes() {
    try {
      scenes.value = (await listSceneWithUser()).data
    } catch (err: any) {
      handleApiError('获取场景列表', err)
    }
  }

  async function recommendScenes() {
    try {
      const data = await (await api.recommendScene('userBasedRecommend')).data
      for (const s of data) {
        const userInfo = await api.getUserInfo(s.creatorId)
        scenes.value.unshift({
          ...s,
          creator: { name: userInfo.nickName || userInfo.name || s.creatorId.toString() },
        })
      }
    } catch (err: any) {
      console.error('获取推荐场景', err)
    }
  }

  // 获取轮播图
  async function listCarousel() {
    try {
      //指示器有可能溢出
      carousels.value = await listCarouselImageWithScene({ first: 5 })
    } catch (err: any) {
      handleApiError('获取轮播图', err)
    }
  }

  onMounted(async () => {
    loading.value = true
    await Promise.all([listScenes(), recommendScenes(), listCarousel()])
    loading.value = false
  })
</script>

<style scoped>
  .aspect-ratio-container {
    width: 100%;
    position: relative;
  }

  .aspect-ratio-container::before {
    display: block;
    content: '';
    width: 100%;
    padding-top: 56.25%; /* 16:9 Aspect Ratio */
  }
</style>
