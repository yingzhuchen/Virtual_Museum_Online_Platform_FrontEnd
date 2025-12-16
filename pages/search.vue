<template>
  <div class="mx-4% flex flex-col min-w-7xl">
    <div class="mt-6 flex grid-items-center">
      <div class="text-[28px] font-bold">{{ search }}</div>
      <span class="ml-2 text-gray">的相关搜索如下：</span>
    </div>
    <template v-if="!loading">
      <div v-if="scenes.length" class="w-full mt-6 grid grid-cols-5 gap-4">
        <div v-for="item in scenes" class="flex flex-col" :key="item.id">
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
          <el-link
            class="text-3.25 !block"
            :underline="false"
            type="info"
            @click="$router.push(`/profile?id=${item.creatorId}`)"
          >
            {{ item.creator.name }}
          </el-link>
        </div>
      </div>
      <div v-else class="flex flex-col w-sm m-auto">
        <el-image
          src="https://demo-bucket-1325569882.cos.ap-guangzhou.myqcloud.com/background/02e2f66e41cc04746bb418ef18db9d1.png"
        />
        <span class="text-center">什么都没找到，换个搜索词吧~</span>
      </div> </template
    ><div v-else v-loading="loading" element-loading-text="加载中..."></div>
  </div>
</template>

<script setup lang="ts">
  import type { ListSceneWithUserResponse } from '~/composables/apiClient'

  const route = useRoute()
  const search = ref('')
  const loading = ref(true)

  definePageMeta({
    layout: 'header',
  })
  useHead({
    title: search,
  })

  const scenes = ref<ListSceneWithUserResponse['data']>([])

  const enterScene = (sceneId: number) =>
    useRouter().push({ path: `/scene`, query: { id: sceneId } })

  async function listScenes(keyword: string) {
    try {
      scenes.value = (await listSceneWithUser({ keyword: keyword })).data
      loading.value = false
    } catch (err: any) {
      handleApiError('获取场景列表', err)
    }
  }

  watch(
    () => route.query.keyword,
    () => {
      search.value = route.query.keyword as string
      if (search.value.trim() === '') {
        useRouter().push('/')
      }
      listScenes(search.value)
    },
    { immediate: true },
  )
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
