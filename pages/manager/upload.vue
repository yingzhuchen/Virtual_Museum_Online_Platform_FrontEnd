<template>
  <div>
    <div class="flex flex-col px-10.5 pb-6">
      <edit-scene-form type="create" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import EditSceneForm from './components/edit-scene-form.vue'

  definePageMeta({
    layout: 'manager',
  })
</script>
