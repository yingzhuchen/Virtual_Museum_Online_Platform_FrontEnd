import * as THREE from 'three'
import { SceneController } from './scene'

const maskGeometry = new THREE.PlaneGeometry(20, 20)
const maskMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0,
  depthTest: false,
})
const mask = new THREE.Mesh(maskGeometry, maskMat)
let sceneController: SceneController

let isFadingIn = false // 控制是否正在执行 fadeIn 动画
let isFadingOut = false // 控制是否正在执行 fadeOut 动画
let fadeInDuration = 1.0 // fade in 动画持续时间，单位秒
let fadeOutDuration = 1.0 // fade out 动画持续时间，单位秒
let timer = 0 // 动画开始时间
let isAnimationActive = false // 动画是否激活

const action = (deltaTime: number) => update(deltaTime)

export function enableFade(sc: SceneController) {
  sceneController = sc
  sc.camera?.add(mask)
  mask.position.set(0, 0, -1)
}

/**切换幕布状态 */
export function swapMaskState(duration: number = 1) {
  if (!isFadingIn && !isAnimationActive) {
    maskFadeIn(duration)
  } else if (!isFadingOut && !isAnimationActive) {
    maskFadeOut(duration)
  }
}

/**使黑色幕布淡入 */
export function maskFadeIn(duration: number = 1) {
  if (!isAnimationActive && sceneController) {
    sceneController.setUpdated()
    fadeInDuration = duration
    isFadingIn = true
    isFadingOut = false //只能同时有一个
    isAnimationActive = true
    timer = 0 // 记录动画开始时间
    mask.material.opacity = 0
    sceneController.onUpdated.set('FadeInAndFadeOut', action)
  }
}

/**使黑色幕布淡出 */
export function maskFadeOut(duration: number = 1) {
  if (!isAnimationActive) {
    sceneController.setUpdated()
    fadeOutDuration = duration
    isFadingIn = false //只能同时有一个
    isFadingOut = true
    isAnimationActive = true
    timer = 0 // 记录动画开始时间
    mask.material.opacity = 1
    sceneController.onUpdated.set('FadeInAndFadeOut', action)
  }
}

function update(deltaTime: number) {
  sceneController.setUpdated()
  if (isAnimationActive && sceneController) {
    timer += deltaTime
    if (isFadingIn) {
      // 执行 fade in 动画
      if (timer < fadeInDuration) {
        // 计算当前不透明度
        maskMat.opacity = timer / fadeInDuration
      } else {
        // 动画结束，设置为完全不透明
        maskMat.opacity = 1
        isAnimationActive = false // 动画完成
        sceneController.onUpdated.delete('FadeInAndFadeOut')
      }
    } else if (isFadingOut) {
      // 执行 fade out 动画
      if (timer < fadeOutDuration) {
        // 计算当前不透明度
        maskMat.opacity = 1 - timer / fadeOutDuration
      } else {
        // 动画结束，设置为完全透明
        maskMat.opacity = 0
        isAnimationActive = false // 动画完成
        sceneController.onUpdated.delete('FadeInAndFadeOut')
      }
    }
  }
}
