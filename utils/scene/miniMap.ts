import type { SceneController } from './scene'
import type { AnnotationObjectMesh, Annotation } from './annotation'
import { convertWorldToCameraSpaceSimple, getCameraYRotationDegrees } from './utils'
import * as THREE from 'three'

// 定义Circle类型
interface Circle {
  x: number
  y: number
  scale: number
  color: string // 使用颜色代码
  annotation: Annotation
}

export const circles = ref<Circle[]>()
export const rotation = ref<number>(0)

export function startGetMiniMapData(
  sceneController: SceneController,
  maxYRange: number,
  minScale: number,
  maxScale: number,
) {
  sceneController.onUpdated.set('MiniMap', () => {
    circles.value = generateCirclesFromSceneController(
      sceneController,
      maxYRange,
      minScale,
      maxScale,
    )
    rotation.value = getCameraYRotationDegrees(sceneController.camera!)
  })
}

export function stopGetMiniMapData(sceneController: SceneController) {
  sceneController.onUpdated.delete('MiniMap')
}

// 处理对象组并生成circles
function generateCirclesFromSceneController(
  sceneController: SceneController,
  maxYRange: number,
  minScale: number,
  maxScale: number,
): Circle[] {
  const circles: Circle[] = []

  for (const annotation of sceneController.annotations.value) {
    const obj = annotation.get3DObject() as AnnotationObjectMesh<Annotation>
    if (!obj) continue
    // 转换对象坐标到相机坐标
    const positionCameraSpace = convertWorldToCameraSpaceSimple(
      sceneController.camera!,
      obj.position,
    )

    // 根据y轴位置计算scale
    let scale = 1 - Math.abs(positionCameraSpace.y / maxYRange)
    scale = scale > 0 ? scale : 0 // 如果y小于minYRange，则scale为0
    scale = scale > 1 ? 1 : scale // 确保scale不会超过1
    // 根据scale调整到[minScale, maxScale]区间
    if (scale != 0) scale = minScale + scale * (maxScale - minScale)
    if (obj.material instanceof THREE.MeshBasicMaterial) {
      // 添加到circles数组
      circles.push({
        x: positionCameraSpace.x,
        y: positionCameraSpace.z,
        scale: scale,
        color: `#${obj.material?.color.getHexString() ?? 'ffffff'}`,
        annotation: obj.userData.owner,
      })
    }
  }
  // 根据scale降序排序
  return circles.sort((a, b) => a.scale - b.scale)
}
