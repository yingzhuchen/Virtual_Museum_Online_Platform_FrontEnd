import * as THREE from 'three'
import { SceneController } from './scene'
import { ControlMethod } from './player'
import { TransformControls } from 'three/examples/jsm/Addons.js'

import { KeyInputContext, KeyInputState } from './inputState'

///接受射线检测的对象
///注：如果3DObject没有name，则InputManager不会处理这个物体
export interface RaycasterDetectedObject {
  inputManager?: InputManager
  get3DObject(): THREE.Object3D
}

///使用TransformControl组件控制的对象
export interface TransformControlObject extends RaycasterDetectedObject {
  ///是否接受TransformControl
  enableTransformControl: boolean
}

const filterdObjectName = ['', 'X', 'Y', 'Z', 'XY', 'XZ', 'YZ', 'DELTA', 'XYZ', 'XYZE', 'AXIS']

export class InputManager {
  private hoveredObject: THREE.Object3D | null = null
  private sceneController: SceneController
  public transformControl: TransformControls
  public sensitivity = 1.25

  private mouseX: number = 0
  private mouseY: number = 0
  public keyStates: Record<string, boolean> = {}
  private raycasterDetectedObjects: RaycasterDetectedObject[] = []

  //键盘输入状态管理器，执行setState以切换键盘模式
  public keyInputContext?: KeyInputContext

  constructor(sceneController: SceneController) {
    this.sceneController = sceneController
    this.transformControl = new TransformControls(
      sceneController.camera!,
      sceneController.renderer!.domElement,
    )
    sceneController.scene.add(this.transformControl)
  }

  public init() {
    this.transformControl.addEventListener('change', () => {
      this.sceneController.setUpdated()
    })
    this.transformControl.addEventListener('dragging-changed', (event) => {
      this.sceneController.player!.enableControl.value = !event.value
    })
    this.keyInputContext = new KeyInputContext()

    document.addEventListener('click', this.onMouseClicked)
    document.addEventListener('mousedown', this.onMousedown)
    document.addEventListener('mouseup', this.onMouseUp)
    document.addEventListener('mousemove', this.onMousemove)
    document.addEventListener('keydown', this.onKeydown)
    document.addEventListener('keyup', this.onKeyup)
  }

  //添加物体到射线检测列表
  public addRaycasterDetectedObject(obj: RaycasterDetectedObject) {
    obj.inputManager = this
    this.raycasterDetectedObjects.push(obj)
  }
  //从射线检测列表移除物体
  public removeRaycasterDetectedObject(obj: RaycasterDetectedObject) {
    const index = this.raycasterDetectedObjects.indexOf(obj)
    if (index > -1) {
      this.raycasterDetectedObjects.splice(index, 1)
    }
  }

  public dispose() {
    this.keyStates = {}
    this.keyInputContext?.clearState()
    document.removeEventListener('mousedown', this.onMouseClicked)
    document.removeEventListener('mousedown', this.onMousedown)
    document.removeEventListener('mouseup', this.onMouseUp)
    document.removeEventListener('mousemove', this.onMousemove)
    document.removeEventListener('keydown', this.onKeydown)
    document.removeEventListener('keyup', this.onKeyup)
  }

  //执行鼠标click事件检测
  private soluteMouseClick(x: number, y: number) {
    const raycaster = new THREE.Raycaster()

    // 更新Raycaster的射线方向
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.sceneController!.camera!)

    // 计算物体和射线的交集
    const intersects = raycaster.intersectObjects(this.sceneController!.scene!.children, true)

    if (!intersects.length) return

    let firstObject: THREE.Object3D | null = null

    for (let index = 0; index < intersects.length; index++) {
      let flag = true
      for (const element of filterdObjectName) {
        if (element === intersects[index]?.object.name) {
          flag = false
          break // 退出循环
        }
      }
      if (flag) {
        firstObject = intersects[index]!.object
        break
      }
    }
    if (!firstObject) return

    for (let element of this.raycasterDetectedObjects) {
      //检查类型并且触发对应事件
      if (firstObject == element.get3DObject()) {
        element.get3DObject()?.userData.onClick?.(element.get3DObject())

        //检查是否可以TransformControl
        const tcObject = element as TransformControlObject
        //在环绕视角下，且物体允许被拖拽移动
        if (
          this.sceneController.player?.controlMethod.value === ControlMethod.Orbit &&
          tcObject.enableTransformControl &&
          this.transformControl?.object !== tcObject.get3DObject()
        ) {
          if (this.transformControl?.object) this.transformControl.detach()
          this.transformControl?.attach(tcObject.get3DObject())
        }

        break
      }
    }
  }

  //执行鼠标悬浮事件检测
  private soluteMouseHover(x: number, y: number) {
    const raycaster = new THREE.Raycaster()
    // 更新射线投射器的原点和方向
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.sceneController!.camera!)

    // 检测射线与场景中物体的相交
    const intersects = raycaster.intersectObjects(this.sceneController!.scene!.children, true)

    // 检查是否有新的悬停对象
    if (intersects.length <= 0) return

    let firstObject: THREE.Object3D | null = null
    for (let index = 0; index < intersects.length; index++) {
      let flag = true
      for (const element of filterdObjectName) {
        if (element === intersects[index]?.object.name) {
          flag = false
          break // 退出循环
        }
      }
      if (flag) {
        firstObject = intersects[index]!.object
        break
      }
    }
    if (this.hoveredObject !== firstObject) {
      // 如果当前对象与之前的对象不同，触发进入事件
      if (firstObject) {
        for (let i = 0; i < this.raycasterDetectedObjects!.length; i++) {
          const element = this.raycasterDetectedObjects![i]
          // 检查类型并且触发对应事件
          // enter事件
          if (firstObject == element?.get3DObject()) {
            element.get3DObject().userData.onEnterHover?.(element.get3DObject())
            break
          }
        }

        //leave事件
        try {
          this.hoveredObject?.userData.onLeaveHover?.(this.hoveredObject)
        } catch (e) {}
      }
      // 更新悬停对象
      this.hoveredObject = firstObject
    }
    // 如果没有交点，且之前有悬停对象，触发离开事件
    else if (intersects.length === 0 && this.hoveredObject) {
      try {
        this.hoveredObject?.userData.onLeaveHover(this.hoveredObject)
      } catch (e) {}
      this.hoveredObject = null
    }
  }

  //#region 鼠标事件
  private onMousedown = (e: MouseEvent) => {
    const target = e.target as Element
    if (target.id !== this.sceneController!.canvasId) {
      return
    }
    if (this.sceneController!.player!.controlMethod.value == ControlMethod.FirstPerson) {
      document.body.requestPointerLock()
    } else {
      document.exitPointerLock()
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (this.transformControl?.object) this.transformControl.detach()
  }

  private onMouseClicked = (e: MouseEvent) => {
    const target = e.target as Element
    if (
      target.id !== this.sceneController.canvasId &&
      target.id !== '' &&
      target.id !== 'luma-preview-scene-container'
    ) {
      return
    }
    // FIXME: 在编辑标记模式中，应该只能拖动当前编辑的标记
    if (this.sceneController!.player!.controlMethod.value == ControlMethod.FirstPerson) {
      if (document.pointerLockElement === document.body) {
        this.soluteMouseClick(0, 0) //直接把屏幕中心坐标传入
      }
    } else {
      this.soluteMouseClick(this.mouseX, this.mouseY)
    }
  }

  private onMousemove = (e: MouseEvent) => {
    // 当鼠标在锁定状态时
    if (document.pointerLockElement === document.body) {
      this.sceneController!.camera!.rotation.y -= (e.movementX * this.sensitivity) / 600
      this.sceneController!.camera!.rotation.x -= (e.movementY * this.sensitivity) / 600
      this.sceneController.setUpdated()

      this.soluteMouseHover(0, 0) //直接传入屏幕中心坐标
    } else {
      const target = e.target as Element
      if (target.id === this.sceneController!.canvasId) {
        this.mouseX = (e.clientX / window.innerWidth) * 2 - 1
        this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1
      }
    }
  }
  //#endregion

  //#region 键盘事件
  private onKeydown = (e: KeyboardEvent) => {
    this.keyStates[e.code] = true
  }

  private onKeyup = (e: KeyboardEvent) => {
    delete this.keyStates[e.code]
  }

  //#endregion

  public update(deltaTime: number) {
    const hasPlayerUpdate = this.sceneController!.player!.update(deltaTime)
    const hasKeyUpdate = this.keyInputContext?.doHandleKey(deltaTime, this.keyStates)
    return hasPlayerUpdate || !!hasKeyUpdate
  }
}
