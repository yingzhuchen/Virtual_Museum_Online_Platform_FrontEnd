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
          @keydown.enter="register"
        ></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
          show-password
          validate-event
          @keydown.enter="register"
        ></el-input>
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="请输入密码"
          show-password
          validate-event
          @keydown.enter="register"
        ></el-input>
      </el-form-item>

      <el-button type="primary" :disabled="loading" :loading @click="register"> 注册 </el-button>
      <el-button
        class="mt-5.5 self-end"
        link
        @click="
          router.push({
            path: '/login',
            query: router.currentRoute.value.query,
          })
        "
      >
        已有帐号？去登录
      </el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

  definePageMeta({
    layout: 'login-register',
  })
  useHead({
    title: '注册',
  })

  const router = useRouter()

  const formRef = ref<FormInstance>()
  const form = reactive({
    username: '',
    password: '',
    confirmPassword: '',
  })

  // 校验第二次密码是否等于第一次密码
  function validatePassword(_: any, value: any, callback: any) {
    if (value !== form.password) {
      callback(new Error('两次输入密码不一致'))
    } else {
      callback()
    }
  }

  const rules: FormRules<typeof form> = {
    username: [{ required: true, message: '请输入用户名', trigger: 'change' }],
    password: [
      {
        required: true,
        message: '请输入密码',
        trigger: 'change',
      },
      {
        pattern: ACCOUNT_PASSWORD_REGEXP,
        message: '密码复杂度要求：8~25 个字符，至少包含大小写字母、数字和特殊符号各一个',
      },
    ],
    confirmPassword: [
      {
        required: true,
        message: '请输入密码',
        trigger: 'change',
      },
      {
        validator: validatePassword,
      },
    ],
  }
  const loading = ref(false)

  function register() {
    formRef.value?.validate(async (valid) => {
      if (!valid) return

      loading.value = true
      try {
        const api = useApi('user')
        await api.register({
          username: form.username,
          password: form.password,
        })
        ElMessage({ type: 'success', message: '注册成功' })
        router.push({
          path: '/login',
          query: router.currentRoute.value.query,
        })
      } catch (error: any) {
        handleApiError('注册', error)
      } finally {
        loading.value = false
      }
    })
  }

  onNuxtReady(() => {
    document.getElementById('username-input')?.focus()
  })
</script>
