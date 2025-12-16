<template>
  <el-form
    class="flex h-full"
    ref="formRef"
    :model="form"
    :rules
    label-width="auto"
    label-position="left"
    hide-required-asterisk
  >
    <div class="flex flex-col m-auto w-89.25 gap-y-2">
      <el-form-item label="用户名" prop="username">
        <el-input
          v-model="form.username"
          id="username-input"
          type="text"
          placeholder="请输入"
          @keydown.enter="login"
        ></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
          show-password
          validate-event
          @keydown.enter="login"
        ></el-input>
      </el-form-item>
      <el-button type="primary" :disabled="loading" :loading @click="login"> 登录 </el-button>
      <div class="flex items-center mt-5.5">
        <el-link @click="guestLogin"> 游客登录 </el-link>
        <el-button
          class="!ml-auto"
          link
          @click="
            router.push({
              query: router.currentRoute.value.query,
              path: '/register',
            })
          "
        >
          注册新帐号
        </el-button>
      </div>
    </div>
  </el-form>
</template>

<script setup lang="ts">
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { guestUsername, guestPassword } from '~/stores/user'

  definePageMeta({
    layout: 'login-register',
  })
  useHead({
    title: '登录',
  })

  const userStore = useUserStore()
  const router = useRouter()

  const formRef = ref<FormInstance>()
  const form = reactive({
    username: '',
    password: '',
  })
  const rules: FormRules<typeof form> = {
    username: [{ required: true, message: '请输入用户名', trigger: 'change' }],
    password: [{ required: true, message: '请输入密码', trigger: 'change' }],
  }
  const loading = ref(false)

  function guestLogin() {
    form.username = guestUsername
    form.password = guestPassword
    login()
  }

  function login() {
    formRef.value?.validate(async (valid) => {
      if (!valid) return

      loading.value = true
      try {
        const api = useApi('user')
        const resp = await api.login(form)

        userStore.token = resp.token
        ElMessage({ type: 'success', message: '登录成功' })

        if (router.currentRoute.value.query.redirect) {
          router.push(router.currentRoute.value.query.redirect as string)
        } else {
          router.push('/')
        }
      } catch (error: any) {
        handleApiError('登录', error)
      }
      loading.value = false
    })
  }

  onNuxtReady(() => {
    document.getElementById('username-input')?.focus()
  })
</script>
