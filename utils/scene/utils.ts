import * as THREE from 'three'

export function getNearbyObjects(
  centerObj: THREE.Object3D | THREE.Vector3,
  targets: THREE.Object3D[],
  distance: number,
) {
  let pos1 = new THREE.Vector3()
  if (centerObj instanceof THREE.Object3D) centerObj.getWorldPosition(pos1)
  else if (centerObj instanceof THREE.Vector3) pos1 = centerObj
  let ret = []
  for (let element of targets) {
    let pos2 = new THREE.Vector3()
    element.getWorldPosition(pos2)
    if (pos1.distanceTo(pos2) <= distance) {
      ret.push(element)
    }
  }
  ret.sort((a, b) => {
    let distA = pos1.distanceTo(a.getWorldPosition(new THREE.Vector3()))
    let distB = pos1.distanceTo(b.getWorldPosition(new THREE.Vector3()))
    return distA - distB
  })
  return ret
}

//将世界坐标转换为相机坐标，此方法考虑到了相机自身的旋转
export function convertWorldToCameraSpace(
  camera: THREE.Camera,
  worldPosition: THREE.Vector3,
): THREE.Vector3 {
  // 创建一个四维向量来存储结果
  const positionCameraSpace = new THREE.Vector4(
    worldPosition.x,
    worldPosition.y,
    worldPosition.z,
    1.0,
  )
  // 获取相机的视图矩阵的逆矩阵
  const viewMatrixInverse = camera.matrixWorldInverse

  // 将世界坐标转换为相机坐标
  positionCameraSpace.applyMatrix4(viewMatrixInverse)

  // 返回转换后的坐标，作为一个新的 THREE.Vector3 对象
  return new THREE.Vector3(positionCameraSpace.x, positionCameraSpace.y, positionCameraSpace.z)
}

//将世界坐标转换为相机坐标，此方法不考虑相机自身的旋转
export function convertWorldToCameraSpaceSimple(
  camera: THREE.Camera,
  worldPosition: THREE.Vector3,
): THREE.Vector3 {
  // 获取相机的位置
  const cameraPosition = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld)

  // 计算物体相对于相机的位置
  const relativePosition = new THREE.Vector3().subVectors(worldPosition, cameraPosition)

  // 如果相机有缩放，需要考虑缩放因子
  // 假设相机缩放是一个简单的数值，而不是一个矩阵
  if (camera.scale) {
    relativePosition.divide(camera.scale)
  }

  // 返回转换后的坐标
  return relativePosition
}

export function getCameraYRotationDegrees(camera: THREE.Camera): number {
  // 获取相机的四元数
  const quaternion = camera.quaternion

  // 从四元数获取Euler角（注意：这里假设z轴和x轴的旋转不是我们关心的，因此我们直接使用0）
  const rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ').setFromQuaternion(quaternion)

  // 将y轴的弧度转换为度
  const yRotationDegrees = THREE.MathUtils.radToDeg(rotationEuler.y)

  return yRotationDegrees
}

// 获得前进方向向量
export function getForwardVector(camera: THREE.Camera) {
  let direction = new THREE.Vector3(0, 0, 0)
  camera.getWorldDirection(direction)
  if (direction.length() > 0.001) {
    // 转化为单位向量
    direction.normalize()

    return direction.clone()
  }
  return undefined
}

// 获得左右方向向量
export function getSideVector(camera: THREE.Camera) {
  let direction = new THREE.Vector3(0, 0, 0)
  camera.getWorldDirection(direction)

  if (direction.length() > 0.001) {
    // 将该向量转换为单位向量
    direction.normalize()
    direction.cross(camera.up)
    return direction
  }
  return undefined
}
