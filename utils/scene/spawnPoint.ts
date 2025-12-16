import * as THREE from 'three'
import type { SceneController } from './scene'
import { getForwardVector } from './utils'

let mesh: THREE.Mesh
let action = () => update()
let sceneController: SceneController | null
let geometry = new THREE.PlaneGeometry(0.05, 0.05)
let material: THREE.MeshBasicMaterial
// 加载纹理图片
let textureLoader = new THREE.TextureLoader()
textureLoader.load(
  '/spawnPoint.png',
  (texture) => {
    // 创建一个平面几何体
    // 创建材料并应用纹理
    material = new THREE.MeshBasicMaterial({ transparent: true, map: texture })
    // 创建网格
    mesh = new THREE.Mesh(geometry, material)
  },
  (error) => {
    // 纹理加载失败
    console.error('Texture failed to load:', error)
  },
)

//在出生点创建一个贴图，同时只能存在一个出生点
export function createSpawnPointMesh(sc: SceneController) {
  if (sceneController) {
    throw Error('已经存在出生点了')
  }
  //mesh已经加载过
  // 将网格添加到场景中
  sc.scene.add(mesh)
  if (sc.sceneData?.birthPosition) mesh.position.copy(sc.sceneData.birthPosition)
  sc.onUpdated.set('SpawnPoint', action)
  sceneController = sc
}

export function removeSpawnPointMesh() {
  if (!sceneController) return
  sceneController.scene.remove(mesh)
  sceneController.onUpdated.delete('SpawnPoint')
  sceneController = null
}

function update() {
  if (sceneController) {
    mesh.lookAt(
      mesh.position.clone().add(getForwardVector(sceneController.camera!)!.clone().negate()),
    )
  }
}

export async function saveSpawnPoint(sc: SceneController) {
  if (sc.sceneData) {
    sc.sceneData = await useApi('scene').editScene({
      id: sc.sceneData.id,
      birthPosition: sc.camera?.position,
      birthRotation: sc.camera?.rotation,
    })
    if (sceneController) removeSpawnPointMesh()
    createSpawnPointMesh(sc)
    ElMessage.success('出生点设置成功')
  }
}
