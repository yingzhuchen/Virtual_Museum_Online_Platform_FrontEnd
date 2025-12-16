<!-- 创作中心布局（顶栏 + 侧栏） -->
<template>
  <div class="h-screen w-screen min-w-360 flex flex-col">
    <nav-bar :search-bar="false"></nav-bar>

    <div class="flex grow overflow-x-hidden">
      <div class="w-68.75 shrink-0">
        <client-only>
          <el-menu class="w-full h-full flex flex-col items-center" :default-active="index">
            <el-button
              class="mt-11.5 mb-4.25 mx-auto !text-white !w-46.5 !h-14 !text-4.5 !bg-manager-primary"
              :icon="ElIconUploadFilled"
              @click="$router.push('/manager/upload')"
            >
              创建
            </el-button>

            <component
              v-for="item in menuItems"
              class="w-full"
              :is="'children' in item ? ElSubMenu : ElMenuItem"
              :key="item.index"
              :index="item.index"
              @click="onClickMenuItem(item)"
            >
              <template #title>
                <span
                  :class="[
                    'text-4 text-center w-full',
                    'children' in item && 'ml-6',
                    index === item.index ? 'text-manager-primary font-bold' : 'text-black',
                  ]"
                >
                  {{ item.title }}
                </span>
              </template>

              <template v-if="'children' in item">
                <el-menu-item
                  v-for="child in item.children"
                  :key="child.index"
                  :index="child.index"
                  @click="onClickMenuItem(child)"
                >
                  <span
                    :class="[
                      'text-center w-full text-4',
                      index === item.index ? 'text-manager-primary font-bold' : 'text-gray-1',
                    ]"
                  >
                    {{ child.title }}
                  </span>
                </el-menu-item>
              </template>
            </component>
          </el-menu>
        </client-only>
      </div>

      <div class="bg-#fafafa grow flex py-6.25 px-11.25">
        <div class="bg-white w-full h-full rounded-3.5 overflow-y-auto">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMenuItem, ElSubMenu } from 'element-plus'

  interface PathMenuItem {
    index: string
    title: string
    path: string
  }

  interface ChildrenMenuItem {
    index: string
    title: string
    children: PathMenuItem[]
  }

  type MenuItem = PathMenuItem | ChildrenMenuItem

  const router = useRouter()
  const route = useRoute()

  const menuItems: MenuItem[] = [
    {
      index: '1',
      title: '内容管理',
      path: '/manager',
    },
    {
      index: '2',
      title: '回收站',
      path: '/manager/recyclebin',
    },
  ]
  const index = computed(() => menuItems.find((i) => 'path' in i && i.path === route.path)?.index)

  function onClickMenuItem(item: MenuItem) {
    if ('children' in item) {
      if (!item.children.length) return
      // 只有在展开菜单时才跳转到第一个子菜单
      if (!index.value?.startsWith(item.index)) router.push(item.children[0].path)
    } else {
      router.push(item.path)
    }
  }
</script>
