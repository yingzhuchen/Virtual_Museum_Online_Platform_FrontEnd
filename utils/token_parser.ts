import { jwtDecode } from 'jwt-decode'

export function parse(token?: string) {
  return jwtDecode(token ?? useUserStore()?.token)
}

const showInvalidTokenError = useDebounceFn(() => {
  ElMessage.error({ message: '解析 token 失败，请重新登录', grouping: true })
  useUserStore().token = ''
}, 500)

export function userId(token?: string): number {
  try {
    return parseInt(parse(token)?.sub as string)
  } catch (err: any) {
    showInvalidTokenError()
    return -1
  }
}
