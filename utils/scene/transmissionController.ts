import { LumaSplatsThree } from '@lumaai/luma-web'
import { SceneController } from './scene'
import * as THREE from 'three'
import { getForwardVector } from './utils'
let splat: LumaSplatsThree
let unloading: boolean
let _duration: number
let _sceneController: SceneController
let time: number
let center: THREE.Vector3

const action = (deltaTime: number) => update(deltaTime)

/**经典玻璃珠子配置 */
let glassSphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.MeshPhysicalMaterial({
    roughness: 0,
    metalness: 0,
    transmission: 1,
    ior: 1.32,
    thickness: 1.52,
    envMapIntensity: 1.2,
    clearcoat: 1,
    side: THREE.FrontSide,
    color: 0xffffff,
    transparent: true,
  }),
)

/**先等待异步加载好新场景，然后调用{@link unloadSceneWithAnimation()} 来退出当前场景*/
export function loadNewSceneWithAnimation(
  duration: number,
  sc: SceneController,
  sceneIdOrUrl: number | string,
  x: number = 0,
  y: number = 0,
  z: number = 0,
) {
  if (unloading) throw Error('上一个splat还没销毁完毕')
  const targetSplat = sc.splat
  unloading = true
  sc.player!.enableControl.value = false
  sc.loadSplat(sceneIdOrUrl, false, () => {
    sc.camera!.position.set(x, y, z)
    console.log(x, y, z)
    sc.player!.geometry.end.copy(sc.camera!.position)
    unloadSceneWithAnimation(duration, sc, targetSplat)
  })
}

export function unloadSceneWithAnimation(
  duration: number,
  sc: SceneController,
  targetSplat: LumaSplatsThree | null = null,
) {
  if (targetSplat) {
    splat = targetSplat
  } else if (sc.splat) splat = sc.splat
  else return

  console.log(splat)
  splat.material.transparent = false
  unloading = true
  _duration = duration
  _sceneController = sc
  sc.onUpdated.set('TransmissionController', action)

  time = 0
  sc.unloadAnnotations()
  sc.scene.add(glassSphere)
  sc.setUpdated()

  if (sc.camera) {
    const forward = getForwardVector(sc.camera!)?.multiplyScalar(1.2)
    if (forward) {
      glassSphere.position.copy(sc.camera!.position.clone().add(forward))
      center = glassSphere.position.clone()
      console.log(center)
    }
  }
}

function update(deltaTime: number) {
  if (!unloading) return
  time += deltaTime
  const r = time / _duration
  _sceneController.setUpdated()
  if (r < 1) {
    // 加载完成前
    const scale = new THREE.Vector3(1 - r, 1 - r, 1 - r)
    splat.position.copy(center.clone().multiplyScalar(r))
    splat.scale.copy(scale)
    glassSphere.scale.copy(scale.multiplyScalar(1))
  } else {
    // 加载完成后
    unloading = false
    _sceneController.listAnnotations()
    _sceneController.scene.remove(splat)
    splat.dispose()
    _sceneController.scene.remove(glassSphere)
    _sceneController.player!.enableControl.value = true

    _sceneController.onUpdated.delete('TransmissionController')
  }
}
