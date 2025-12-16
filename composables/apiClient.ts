import {
  DefaultApi,
  Configuration,
  UserApi,
  SceneApi,
  GeneralApi,
  type HTTPHeaders,
  type ListSceneRequest,
  type SceneResponse,
  type ListScenesResponse,
  type GetUserInfoResponse,
  type GetUserSceneHistoryRequest,
  type SceneHistoryResponse,
  type ListSceneHistroyResponse,
  type CarouselImageResponse,
  type ListCarouselImageResponse,
  type ListCarouselImageRequest,
} from '~/api'

interface UseApiReturnTypes {
  default: InstanceType<typeof DefaultApi>
  user: InstanceType<typeof UserApi>
  scene: InstanceType<typeof SceneApi>
  general: InstanceType<typeof GeneralApi>
}

export type SceneWithUser = Omit<SceneResponse, 'creator' | 'collaborators'> & {
  creator: GetUserInfoResponse
  collaborators: GetUserInfoResponse[]
}
export type ListSceneWithUserResponse = Omit<ListScenesResponse, 'data'> & {
  data: SceneWithUser[]
}

export type SceneHistoryWithUser = SceneHistoryResponse & {
  scene: SceneWithUser
}
export type ListSceneHistoryWithUserResponse = Omit<ListSceneHistroyResponse, 'data'> & {
  data: SceneHistoryWithUser[]
}

export type CarouselImageWithScene = CarouselImageResponse & {
  scene: SceneWithUser
}
export type ListCarouselImageWithSceneResponse = Omit<ListCarouselImageResponse, 'data'> & {
  data: CarouselImageWithScene[]
}

export function useApi(): UseApiReturnTypes['default']
export function useApi<T extends keyof UseApiReturnTypes>(type: T): UseApiReturnTypes[T]
export function useApi<T extends keyof UseApiReturnTypes>(type?: T): UseApiReturnTypes[T] {
  const headers: HTTPHeaders = {}

  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const config = new Configuration({
    basePath: '/api',
    headers,
  })

  if (type === 'scene') return new SceneApi(config) as UseApiReturnTypes[T]
  else if (type === 'user') return new UserApi(config) as UseApiReturnTypes[T]
  return new DefaultApi(config) as UseApiReturnTypes[T]
}

/**
 * 创建一个批量加载器，用于批量请求后端接口。可以防止相同的 ID 产生重复请求。
 * @param method 后端接口的请求方法名，如 `getUserInfo`。接口需要满足：
 * 1. 第一个参数必须是要查询的 `id`
 * 2. 返回值是一个数组，且数组成员含有 `id` 字段。
 * @returns 实际的请求函数。调用时传入 ID，返回对应的数据。
 * @example
 * ```ts
 * const batchGetUserInfo = newBatchedLoader('getUserInfo')
 * const scenes = await listSceue()
 * scenes.forEach(async (s) => {
 *  s.creator = await batchGetUserInfo(s.creatorId)
 * })
 * ```
 */
function newBatchedLoader<ApiMethod extends keyof DefaultApi>(method: ApiMethod) {
  type ApiResponseData = Awaited<ReturnType<DefaultApi[ApiMethod]>> // 提取 Promise 的解析类型

  let _queue: Array<{
    id: number
    resolve: (value: ApiResponseData) => void
    reject: (reason?: any) => void
  }> = []

  const batch = useDebounceFn(() => {
    const queue = _queue
    _queue = []

    const ids = [...new Set(queue.map((q) => q.id))] // 去重，虽然每个请求单独处理，但仍然去重以避免不必要的调用

    // 创建一个请求列表，每个 ID 一个请求
    const requests = ids.map(async (id) => {
      try {
        // @ts-ignore
        const data = await useApi()[method](id)
        return { id, data } // 返回包含 ID 的数据对象，以便之后匹配
      } catch (error) {
        return { id, error } // 包含错误的情况
      }
    })

    Promise.all(requests).then((results) => {
      queue.forEach((q) => {
        const result = results.find((r) => r.id === q.id)
        if (result) {
          if ('data' in result) {
            q.resolve(result.data as ApiResponseData) // Add type assertion here
          } else if ('error' in result) {
            q.reject(result.error)
          }
        }
      })
    })
  }, 1)

  return function (id: number) {
    return new Promise<ApiResponseData>((resolve, reject) => {
      _queue.push({ id, resolve, reject })
      batch()
    })
  }
}

// loader 可以给多个工具函数使用
export const batchGetUserInfo = newBatchedLoader('getUserInfo')
export const batchGetScene = newBatchedLoader('getScene')

export async function listSceneWithUser(
  params?: ListSceneRequest,
): Promise<ListSceneWithUserResponse> {
  const api = useApi('scene')

  const scenes = await (await api.listSceneRaw(params ?? {})).value()
  const scenesWithUser = await Promise.all(
    scenes.data.map(async (scene) => {
      const creator = await batchGetUserInfo(scene.creatorId)
      const collaborators = scene.collaborators
        ? await Promise.all(scene.collaborators.map((c) => batchGetUserInfo(c)))
        : []
      return { ...scene, creator, collaborators }
    }),
  )

  return { ...scenes, data: scenesWithUser }
}

export async function getSceneWithUser(userId: number): Promise<SceneWithUser> {
  const scene = await batchGetScene(userId)
  const creator = await batchGetUserInfo(scene.creatorId)
  const collaborators = scene.collaborators
    ? await Promise.all(scene.collaborators.map((c) => batchGetUserInfo(c)))
    : []

  return { ...scene, creator, collaborators }
}

export async function listSceneHistory(
  params?: GetUserSceneHistoryRequest,
): Promise<ListSceneHistoryWithUserResponse> {
  const api = useApi('user')

  const history = await (await api.getUserSceneHistoryRaw(params ?? {})).value()
  const historyWithUser = await Promise.all(
    history.data.map(async (h) => {
      const scene = await getSceneWithUser(h.sceneId)
      return { ...h, scene }
    }),
  )

  return { ...history, data: historyWithUser }
}

export async function listCarouselImageWithScene(
  params?: ListCarouselImageRequest,
): Promise<ListCarouselImageWithSceneResponse> {
  const api = useApi('scene')
  const images = await (await api.listCarouselImageRaw(params ?? {})).value()
  const imagesWithScene = await Promise.all(
    images.data.map(async (image) => {
      const scene = await getSceneWithUser(image.sceneId)
      return { ...image, scene }
    }),
  )

  return { ...images, data: imagesWithScene }
}
