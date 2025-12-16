import * as THREE from 'three'
import { SceneController } from './scene'
//别用这个了，不是很好用的样子
let sceneController: SceneController | null
const elementsMap = new Map<HTMLElement, { x: number; y: number; z: number }>()

const action = (deltaTime: number) => update(deltaTime)

export function enableHudService(sc: SceneController) {
  sceneController = sc
  sc.onUpdated.set('HUD', action)
}

export function disableUpdateElement() {
  if (!sceneController) return
  sceneController.onUpdated.delete('HUD')
  sceneController = null
}

export function bindElementToScene(x: number, y: number, z: number, hudElement: HTMLElement) {
  // 如果Map中没有这个element，添加到Map中
  if (!elementsMap.has(hudElement)) {
    elementsMap.set(hudElement, { x: x, y: y, z: z })
    document.getElementById(sceneController?.canvasId!)?.appendChild
  }
}

export function removeElementFromScene(hudElement: HTMLElement) {
  elementsMap.delete(hudElement)
}

function update(deltaTime: number) {
  if (!sceneController) return
  if (!sceneController.camera) return
  elementsMap.forEach((value, key) => {
    // 将 HUD 元素投影到屏幕空间
    const vector = new THREE.Vector3(value.x, value.y, value.z)
    vector.project(sceneController!.camera!)

    const x1 = (vector.x * 0.5 + 0.5) * window.innerWidth
    const y1 = (vector.y * -0.5 + 0.5) * window.innerHeight

    key.style.position = 'absolute'
    key.style.left = `${x1}px`
    key.style.top = `${y1}px`
  })
}
