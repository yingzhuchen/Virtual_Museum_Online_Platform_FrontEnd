import * as THREE from 'three'
import { SceneController } from './scene'
import { enableFade, maskFadeIn, maskFadeOut } from './fadeInAndFadeOut'

let startPosition: THREE.Vector3 = new THREE.Vector3()
let targetPosition: THREE.Vector3 = new THREE.Vector3()
let _duration: number = 0
let timer: number = 0
let transporting: boolean = false
let _sceneController: SceneController

export function fadeInOutTransportTo(
  x: number,
  y: number,
  z: number,
  sceneController: SceneController,
  fadeInOutDuration: number = 0.8,
) {
  enableFade(sceneController)

  maskFadeIn(fadeInOutDuration)
  setTimeout(
    () => {
      sceneController.player?.geometry.end.set(x, y, z)
      maskFadeOut(fadeInOutDuration)
    },
    fadeInOutDuration * 1000 + 100,
  ) //加个一百显得自然且不容易出bug
}

export function smoothlyTransportTo(
  x: number,
  y: number,
  z: number,
  sceneController: SceneController,
  duration: number = 1,
) {
  // 确保传入的 player 是存在的
  if (!sceneController.player) return

  _sceneController = sceneController
  // 设置起始位置为目标位置，以便可以连续调用 transportTo 进行新的移动
  startPosition.copy(sceneController.player.geometry.end.clone())

  // 设置目标位置
  targetPosition.set(x, y, z)

  // 设置动画持续时间和计时器
  _duration = duration
  timer = 0
  transporting = true
  sceneController.setUpdated()
  sceneController.onUpdated.set('PlayerTransport', (deltaTime: number) => update(deltaTime))
}

function update(deltaTime: number) {
  if (transporting) {
    timer += deltaTime
    _sceneController.setUpdated()

    let t = Math.min(timer / _duration, 1) // 确保t不会超过1
    t = easeOutQuad(t)
    // 使用线性插值更新位置
    const newPos = startPosition.clone().lerp(targetPosition, t)
    _sceneController.player!.geometry.end.copy(newPos)

    // 检查是否到达目标位置或动画完成
    if (t >= 1) {
      transporting = false
      _sceneController.onUpdated.delete('PlayerTransport')
    }
  }
}

// 用于实现由快到慢的插值函数
function easeOutQuad(t: number) {
  return t * (2 - t)
}
