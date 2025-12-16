import { ResponseError } from '~/api'

interface GeneralError {
  message?: string
}

interface HandleApiErrorOptions {
  /**
   * 是否弹出 Elemeng UI 的提示框
   * @default true
   */
  showElMessage?: boolean
}

/**
 * 统一处理 API 中的异常。此函数会自动将 err 输出到控制台，无需手动输出。
 * @param operation 操作名称，比如 `获取场景列表`
 * @param err
 * @returns 报错内容，不包含操作名称。
 * @example
 * ```ts
 * await handleApiError('获取场景列表', error) // 会弹窗提示 `获取场景列表失败：xxxxx`
 * ```
 */
export async function handleApiError(
  operation: string,
  err: unknown,
  options?: HandleApiErrorOptions,
): Promise<string> {
  let message: string | undefined

  if (err instanceof Response) {
    console.error(operation, err)
    try {
      message = (<GeneralError>await err.json()).message
    } catch {
      message = err.statusText
    }
  } else if (err instanceof ResponseError) {
    console.error(operation, err.response)
    try {
      message = (<GeneralError>await err.response.json()).message || err.response.statusText
    } catch {
      message = err.response.statusText
    }
  } else {
    console.error(operation, err)
    message = (<GeneralError>err)?.message
  }

  if (message?.includes('无权限或会话已过期')) {
    const userStore = useUserStore()
    userStore.token = ''
  }

  message = message || '未知错误'

  if (typeof options?.showElMessage === 'undefined' || options.showElMessage !== false) {
    ElMessage.error({ message: `${operation}失败：${message}`, duration: 5000 })
  }

  return message
}
