<!-- 场景详情页左下角的键位提示  -->
<template>
  <div class="absolute bottom-8 left-10">
    <div class="flex items-center gap-x-5">
      <div v-for="(item, i) in keys" class="flex items-center" :key="i">
        <div v-if="Array.isArray(item.icon)" class="flex items-center">
          <template v-for="icon in item.icon">
            <img class="w-8 h-8" :src="icon" />
            <div class="last:hidden text-white mx-0.5">/</div>
          </template>
        </div>
        <img v-else class="w-8 h-8" :src="item.icon" />
        <span class="text-white ml-1">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import KeyEsc from '~/assets/icons/icons8-esc-100.png'
  import KeyM from '~/assets/icons/icons8-m-key-100.png'
  import KeyB from '~/assets/icons/icons8-b-key-100.png'
  import KeyO from '~/assets/icons/icons8-o-key-100.png'
  import KeyQ from '~/assets/icons/icons8-q-key-100.png'
  import KeyF from '~/assets/icons/icons8-f-key-100.png'
  import KeyE from '~/assets/icons/icons8-e-key-100.png'
  import type { Annotation, AnnotationObjectMesh } from '~/utils/scene'

  export type KeyBindingLayout =
    | 'default'
    | 'minimap'
    | 'annotation-brief'
    | 'annotation-detail'
    | 'edit-annotation'

  interface KeyBindingOption {
    icon: string | string[]
    name: string
    invisible?: boolean
  }

  const props = defineProps<{
    /** 当前用户是否可以编辑场景 */
    viewerCanEditScene: boolean
    /** 最近的 Annotation */
    nearestAnnotation?: AnnotationObjectMesh<Annotation>
  }>()

  const keyBindingLayout = defineModel<KeyBindingLayout>({ default: 'default' })

  const keys = computed(() => {
    let options: KeyBindingOption[]

    if (keyBindingLayout.value === 'default') {
      options = [
        {
          icon: KeyEsc,
          name: '菜单',
        },
        {
          icon: KeyM,
          name: '地图',
        },
        {
          icon: KeyB,
          name: '新增标记',
          invisible: !props.viewerCanEditScene,
        },
        {
          icon: KeyO,
          name: '保存出生点',
          invisible: !props.viewerCanEditScene,
        },
        {
          icon: KeyE,
          name: '编辑标记',
          invisible: !(props.nearestAnnotation && props.viewerCanEditScene),
        },
      ]
    } else if (keyBindingLayout.value === 'minimap') {
      options = [
        {
          icon: [KeyQ, KeyM],
          name: '关闭',
        },
      ]
    } else if (keyBindingLayout.value === 'annotation-brief') {
      options = [
        {
          icon: KeyQ,
          name: '关闭',
        },
        {
          icon: KeyF,
          name: '更多信息',
        },
      ]
    } else if (keyBindingLayout.value === 'annotation-detail') {
      options = [
        {
          icon: KeyQ,
          name: '返回',
        },
      ]
    } else {
      options = []
    }

    return options.filter((option) => !option.invisible)
  })
</script>
