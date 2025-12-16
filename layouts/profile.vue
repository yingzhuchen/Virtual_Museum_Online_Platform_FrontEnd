<!-- 个人资料布局 -->
<template>
  <div class="absolute w-full">
    <nav-bar :search-bar="false"></nav-bar>
  </div>
  <div class="background min-w-5xl min-h-[100vh]">
    <div class="pt-15 m-auto w-[80vw] min-w-5xl">
      <div class="flex items-center mt-4 h-[150px] w-full rounded head-bg">
        <div class="flex items-center pl-9xl">
          <el-avatar :size="80" :src="userInfo?.avatarUrl"></el-avatar>
          <div class="ml-8">
            <div class="flex items-center">
              <span class="text-[26px] text-black">{{ userInfo?.nickName }}</span>
              <span class="text-black mx-3 text-[20px] text-gray">@{{ userInfo?.name }}</span>
              <el-icon v-if="userInfo?.gender == 'male'" size="20" color="#0eb1f4" class="mt-1"
                ><Male
              /></el-icon>
              <el-icon
                v-else-if="userInfo?.gender == 'female'"
                size="20"
                color="#ff3ec9"
                class="mt-1"
                ><Female
              /></el-icon>
            </div>
            <div class="pt-3">{{ userInfo?.motto }}</div>
          </div>
        </div>
      </div>
      <div class="flex rounded">
        <el-menu @select="selectMenu" :default-active="route.path" class="w-full" mode="horizontal">
          <el-menu-item index="/profile" class="!ml-16 w-48">
            <el-icon><HomeFilled /></el-icon>
            <span>主页</span>
          </el-menu-item>
          <el-menu-item index="/profile/scenes" class="w-48">
            <el-icon><PictureRounded /></el-icon>
            <span>场景</span>
          </el-menu-item>
          <el-menu-item index="/profile/favlist" class="w-48" v-if="!route.query.id">
            <el-icon><Star /></el-icon>
            <span>收藏</span>
          </el-menu-item>
        </el-menu>
        <div
          class="flex items-center pr-12 bg-[--el-menu-bg-color] b-b-[--el-menu-border-color] b-b-solid b-b-1"
        >
          <el-button v-if="!route.query.id" @click="editProfile"> 编辑个人资料 </el-button>
          <el-button v-if="!route.query.id" @click="modifyPswd" :disabled="isGuest"> 修改密码 </el-button>
        </div>
      </div>
      <div class="mt-5">
        <slot></slot>
      </div>
    </div>
  </div>

  <el-dialog v-model="modify" width="40rem" align-center>
    <template #header>
      <div class="text-2xl text-gray-800 px-12 mt-5">修改密码</div>
    </template>
    <div class="flex justify-center items-center h-full">
      <el-form
        :label-position="'right'"
        label-width="80px"
        ref="formRef"
        :model="modifyPswdform"
        :rules
        class="mr-5"
      >
        <el-form-item class="my-5" label="旧密码" prop="oldPassword" size="large">
          <el-input
            v-model="modifyPswdform.oldPassword"
            type="password"
            placeholder="请输入旧密码"
            validate-event
            @keydown.enter="updatePassword"
            show-password
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item class="my-5" label="新密码" prop="newPassword" size="large">
          <el-input
            v-model="modifyPswdform.newPassword"
            type="password"
            placeholder="请输入新密码"
            validate-event
            @keydown.enter="updatePassword"
            show-password
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item class="my-5" label="确认密码" prop="confirmPassword" size="large">
          <el-input
            v-model="modifyPswdform.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
            validate-event
            @keydown.enter="updatePassword"
            show-password
            style="width: 320px"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button
        type="primary"
        size="default"
        :disabled="loading"
        :loading
        @click="updatePassword"
        class="mb-2"
        >修改</el-button
      >
    </template>
  </el-dialog>

  <el-dialog v-model="edit" width="40rem" align-center>
    <template #header>
      <div class="text-2xl text-gray-800 px-12 mt-5">编辑个人资料</div>
    </template>
    <div class="flex h-full px-15">
      <el-form class="w-full" :label-position="'right'" :model="editProfileform">
        <el-form-item class="my-5 flex items-center" label="头像:">
          <div class="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ml-4">
            <img
              v-if="editProfileform.avatarUrl"
              :src="editProfileform.avatarUrl"
              class="w-16 h-16 cursor-pointer"
              @click="onClickSelectImage"
            />
            <div
              v-else
              class="bg-gray-300 opacity-30 w-16 h-16 flex flex-justify-center flex-items-center cursor-pointer"
              @click="onClickSelectImage"
            >
              <el-icon color="black"><Plus /></el-icon>
            </div>
          </div>
        </el-form-item>
        <el-form-item class="my-5 flex flex-items-center" label="性别:">
          <el-radio-group v-model="editProfileform.gender" class="ml-4">
            <el-radio :value="UpdateUserInfoRequestGenderV4Compat.Male" size="large"> 男 </el-radio>
            <el-radio :value="UpdateUserInfoRequestGenderV4Compat.Female" size="large">
              女
            </el-radio>
            <el-radio :value="UpdateUserInfoRequestGenderV4Compat.Unkown" size="large">
              保密
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item class="my-5 w-full" label="昵称:" size="large">
          <el-input v-model="editProfileform.nickName" class="ml-2" clearable />
        </el-form-item>
        <el-form-item class="my-5 w-full flex items-center" label="生日:" size="large">
          <el-date-picker
            v-model="editProfileform.birthday"
            class="!w-full ml-2"
            value-format="YYYY-MM-DD"
            type="date"
          />
        </el-form-item>
        <el-form-item class="my-5 !w-full flex items-center" label="地区:" size="large">
          <el-cascader class="w-full ml-2" :options="areaOptions" v-model="selectedAddress">
          </el-cascader>
        </el-form-item>
        <el-form-item class="my-5 w-full" label="签名:" size="large">
          <el-input
            v-model="editProfileform.motto"
            class="ml-2"
            type="textarea"
            maxlength="64"
            rows="3"
            resize="none"
            clearable
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button
        class="mb-2"
        type="primary"
        size="default"
        :disabled="loading"
        :loading
        @click="updateUserInfo"
      >
        修改
      </el-button>
    </template>
  </el-dialog>

  <crop-picture ref="cropPictureRef" :aspectRatio="1" @update="onCropSuccess" />
</template>

<style scoped>
  .background {
    background: linear-gradient(
      to bottom,
      rgba(230, 230, 230, 0.6) 0%,
      rgba(235, 235, 235, 0.5) 3%,
      rgba(240, 240, 240, 0.4) 6%,
      rgba(245, 245, 245, 0.2) 8%,
      rgba(250, 250, 250, 0.1) 10%,
      rgba(255, 255, 230, 0) 12%
    );
    background-blend-mode: color-dodge;
    background-color: #f4f5f7;
    background-size: cover;
  }
  .head-bg {
    background: url('https://demo-bucket-1325569882.cos.ap-guangzhou.myqcloud.com/cat.jpg');
    background-position: center;
    background-size: cover;
  }
</style>

<script setup lang="ts">
  import type { FormInstance, FormRules, CascaderOption, UploadProps } from 'element-plus'
  import { pcTextArr } from 'element-china-area-data'
  import { Plus, HomeFilled, Star, PictureRounded } from '@element-plus/icons-vue'
  import {
    UpdateUserInfoRequestGenderV4Compat,
    type UpdateUserInfoRequest,
    type GetUserInfoResponse,
  } from '~/api'
  import { Male, Female } from '@element-plus/icons-vue/global'
  import type CropPicture from '~/components/crop-picture.vue'

  const userStore = useUserStore()
  const route = useRoute()
  const router = useRouter()
  const generalApi = useApi('general')
  const formRef = ref<FormInstance>()
  const userInfo = ref<GetUserInfoResponse | null>()
  const edit = ref(false)
  const modify = ref(false)
  const loading = ref(false)
  const selectedAddress = ref(['', ''])

  const cropPictureRef = ref<InstanceType<typeof CropPicture>>()

  const editProfileform = ref<UpdateUserInfoRequest>({
    avatarUrl: '',
    nickName: '',
    motto: '',
    gender: UpdateUserInfoRequestGenderV4Compat.Unkown,
    birthday: '',
    address: '',
  })

  const areaOptions: CascaderOption[] = pcTextArr.map((item) => ({
    label: item.label,
    value: item.value,
    children: item.children?.map((city) => ({
      label: city.label,
      value: city.value,
    })),
  }))

  function editProfile() {
    edit.value = true
  }

  const { isGuest } = storeToRefs(userStore)

  function modifyPswd() {
    if (isGuest.value) {
      return ElMessage.warning('游客无法修改密码')
    }
    modify.value = true
  }

  const modifyPswdform = reactive({
    newPassword: '',
    confirmPassword: '',
    oldPassword: '',
  })

  function validatePassword(_: any, value: any, callback: any) {
    if (value !== modifyPswdform.newPassword) {
      callback(new Error('两次输入密码不一致'))
    } else {
      callback()
    }
  }

  const rules: FormRules<typeof modifyPswdform> = {
    oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'change' }],
    newPassword: [
      {
        required: true,
        message: '请输入新密码',
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
        message: '请再次输入密码',
        trigger: 'change',
      },
      {
        validator: validatePassword,
      },
    ],
  }

  async function updatePassword() {
    const isValid = await formRef.value?.validate().catch(() => false)
    if (!isValid) return
    try {
      loading.value = true
      const api = useApi('user')
      await api.updatePassword({
        oldPassword: modifyPswdform.oldPassword,
        newPassword: modifyPswdform.newPassword,
      })
      ElMessage({ type: 'success', message: '修改成功' })
    } catch (error: any) {
      handleApiError('修改密码', error)
    } finally {
      loading.value = false
      modify.value = false
    }
  }

  async function onClickSelectImage() {
    try {
      const image = await selectFile({ maxSize: 2, accept: 'image/*', returnType: 'base64' })
      cropPictureRef.value?.show(image)
    } catch (error: any) {
      ElMessage.error(error.message)
    }
  }

  async function updateUserInfo() {
    let cacheImageUrl: string | undefined

    if (editProfileform.value.avatarUrl?.startsWith('data:image')) {
      loading.value = true
      try {
        cacheImageUrl = (
          await generalApi.uploadImage({
            type: 'avatar',
            image: editProfileform.value.avatarUrl,
          })
        ).imageUrl
      } catch (error) {
        edit.value = false
        handleApiError('上传头像', error)
        return
      } finally {
        loading.value = false
      }
    }

    try {
      loading.value = true
      const api = useApi('user')
      const { avatarUrl, ...tempInfo } = editProfileform.value
      await api.updateUserInfo({
        ...tempInfo,
        address: selectedAddress.value.join('-'),
        avatarUrl: cacheImageUrl,
      })
      ElMessage({ type: 'success', message: '修改成功' })
      await userStore.fetchUserInfo()
      userInfo.value = userStore.userInfo
    } catch (error) {
      handleApiError('修改个人资料', error)
    } finally {
      loading.value = false
      edit.value = false
    }
  }

  const selectMenu = (key: string) => router.push({ path: key, query: { id: route.query?.id } })

  function onCropSuccess(image: string) {
    editProfileform.value.avatarUrl = image
  }

  onMounted(() => {
    watch(
      () => route.query.id,
      async () => {
        const userId = Number(route.query.id)

        if (!isNaN(userId)) {
          userInfo.value = await batchGetUserInfo(userId)
        } else {
          userInfo.value = await userStore.userInfoLoaded
        }
        editProfileform.value = { ...userInfo.value }
        selectedAddress.value = userInfo.value.address?.split('-') ?? ['', '']
      },
      { immediate: true },
    )
  })
</script>
