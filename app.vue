<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
  import { ZINDEX_INJECTION_KEY } from 'element-plus'
  import nProgress from 'nprogress'
  import 'nprogress/nprogress.css'

  useHead({
    title: 'Luma Studio',
    titleTemplate: '%s - Luma Studio',
  })

  const router = useRouter()

  nProgress.configure({ showSpinner: false })

  router.beforeEach(() => {
    nProgress.start()
  })
  router.afterEach(() => {
    nProgress.done()
  })

  // 修改组件的默认 zIndex，解决 MessageBox 和 Message 被 Dialog 遮挡的问题
  provide(ZINDEX_INJECTION_KEY, { current: -2000 })
</script>

<style>
  /* @media (max-width: 1220px) {
    body {
      width: 1220px;
      overflow-x: auto;
    }
  } */
</style>
