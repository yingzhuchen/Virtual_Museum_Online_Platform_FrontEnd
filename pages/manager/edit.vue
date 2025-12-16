<template>
  <div>
    <div class="flex flex-col px-10.5 pb-6">
      <edit-scene-form type="edit" :edit-scene-id="id"></edit-scene-form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import EditSceneForm from './components/edit-scene-form.vue'

  definePageMeta({
    layout: 'manager',
  })

  const route = useRoute()
  const router = useRouter()
  const id = Number(route.query.id)

  if (!id) {
    ElMessage.error('参数异常')
    router.push('/manager')
  }
</script>
