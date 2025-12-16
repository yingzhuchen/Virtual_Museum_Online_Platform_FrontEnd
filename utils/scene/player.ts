import * as THREE from 'three'
import { Capsule } from 'three/examples/jsm/math/Capsule.js'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { getNearbyObjects } from './utils'
import type { Annotation, AnnotationObjectMesh } from './annotation'
import type { SceneController } from './scene'

export enum ControlMethod {
  FirstPerson,
  Orbit,
}

export interface DistanceDetectedObject {
  player?: Player
  get3DObject(): THREE.Object3D
}

export class Player {
  public friction = 10
  public speed = 10
  public geometry: Capsule
  public velocity: THREE.Vector3
  public direction: THREE.Vector3
  /** 是否允许场景的鼠标输入。在拖拽标记等操作中，需要临时禁用场景的鼠标输入 */
  public enableControl = ref<boolean>(true)
  public controlMethod = ref<ControlMethod>(ControlMethod.FirstPerson)

  private orbitControl: OrbitControls
  private stopWatchControl?: ReturnType<typeof watch>
  private stopWatchEnableControl?: ReturnType<typeof watch>
  public defaultOrbitDistance = 2 // 设置摄像机正对着的位置的距离

  //#region用于相机平滑移动
  private smoothMoving: boolean = false
  private smoothMovingTarget: THREE.Vector3 = new THREE.Vector3()
  private currDirection = new THREE.Vector3()
  private smoothMovingDuration = 0.7
  private currentTime = 0
  //#endregion
  private distanceDetectedObjects: DistanceDetectedObject[] = []

  constructor(
    private sceneController: SceneController,
    canvas: HTMLElement,
  ) {
    ;(this.geometry = new Capsule(new THREE.Vector3(0, -0.1, 0), new THREE.Vector3(0, 0, 0), 0.1)),
      (this.velocity = new THREE.Vector3())
    this.direction = new THREE.Vector3()
    this.orbitControl = new OrbitControls(sceneController.camera!, canvas)
    this.orbitControl.addEventListener('change', () => {
      this.sceneController.setUpdated()
    })
    this.orbitControl.enabled = false
    this.orbitControl.enableDamping = true

    this.stopWatchControl = watch(
      this.controlMethod,
      (newValue) => {
        if (!this.orbitControl) return
        if (newValue === ControlMethod.Orbit) {
          this.updateOrbitTargetToCameraLookAt()
          this.orbitControl.enabled = true
        } else if (newValue === ControlMethod.FirstPerson) {
          this.orbitControl.enabled = false
        }
      },
      { deep: true },
    )
    this.stopWatchEnableControl = watch(this.enableControl, (newValue) => {
      if (this.controlMethod.value === ControlMethod.Orbit) {
        this.orbitControl.enabled = newValue
      } else {
        this.orbitControl.enabled = false
      }
    })
  }

  public update(deltaTime: number): boolean {
    if (!this.enableControl.value) return false
    if (this.controlMethod.value === ControlMethod.Orbit) {
      //轨道（环绕）控制方式下，控制玩家几何体与相机位置同步
      const hasUpdate = this.orbitControl?.update()
      this.geometry.end.copy(this.sceneController.camera!.position)
      return hasUpdate
    } else {
      //通过速度、方向计算出几何体在单位时间内的位移，然后把相机位置与几何体同步
      let hasUpdate = false
      const damping = Math.exp(-this.friction * deltaTime) - 1
      this.velocity.addScaledVector(this.velocity, damping)
      // 如果速度小于 10 的 -3 次方，则将速度置为 0
      if (this.velocity.length() < 1e-3) {
        this.velocity.set(0, 0, 0)
      } else {
        hasUpdate = true
      }
      hasUpdate = this.doLookAtSmoothly(deltaTime) || hasUpdate
      const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime)

      if (Math.abs(this.friction) < 0.001) this.velocity = new THREE.Vector3()

      this.geometry.translate(deltaPosition)
      this.sceneController.camera!.position.copy(this.geometry.end)

      return hasUpdate
    }
  }

  //平滑地使得相机看向某个位置，仅在第一人称视角下可用
  public lookAtSmoothly(target: THREE.Vector3, duration: number = 0.3) {
    this.smoothMoving = true
    this.smoothMovingTarget = target
    this.currentTime = 0
    this.smoothMovingDuration = duration
  }
  // 更新相机位置和朝向
  private doLookAtSmoothly(deltaTime: number) {
    if (this.smoothMoving) {
      this.currentTime += deltaTime
      if (this.currentTime <= this.smoothMovingDuration) {
        // 计算目标朝向
        // 插值计算朝向
        let interpolatedDirection = new THREE.Vector3().copy(
          this.getForwardVector().add(this.sceneController.camera!.position),
        )
        interpolatedDirection.lerp(
          this.smoothMovingTarget,
          this.currentTime / this.smoothMovingDuration,
        )

        // 更新相机位置和朝向
        this.sceneController.camera!.lookAt(interpolatedDirection)
      } else {
        // 动画结束
        this.smoothMoving = false
        this.sceneController.camera!.lookAt(this.smoothMovingTarget)
      }
      return true
    }
    return false
  }
  public dispose() {
    this.stopWatchControl?.()
    this.stopWatchEnableControl?.()
    this.orbitControl.dispose()
  }

  public addDistanceDetectObject(obj: DistanceDetectedObject) {
    this.distanceDetectedObjects.push(obj)
    obj.player = this
  }
  public removeDistanceDetectObject(obj: DistanceDetectedObject) {
    this.distanceDetectedObjects.splice(this.distanceDetectedObjects.indexOf(obj))
    obj.player = this
  }
  /** 获取最近的Annotation，不包括草稿 */
  public getNearestAnnotation(distance: number): AnnotationObjectMesh<Annotation> | undefined {
    const list: THREE.Object3D[] = []
    this.distanceDetectedObjects.forEach((element) => {
      list.push(element.get3DObject())
    })
    const result = (
      getNearbyObjects(this.geometry.end, list, distance) as AnnotationObjectMesh<Annotation>[]
    ).filter((item) => !item.userData.owner.isDraft)
    return result[0]
  }

  /** 更新控制器的环绕点为摄像机正对着的位置 */
  private updateOrbitTargetToCameraLookAt() {
    const cameraDirection = new THREE.Vector3()
    this.sceneController.camera!.getWorldDirection(cameraDirection) // 获取摄像机的朝向

    const cameraPosition = this.sceneController.camera!.position.clone() // 获取摄像机的位置
    const targetPosition = cameraPosition
      .clone()
      .add(cameraDirection.multiplyScalar(this.defaultOrbitDistance))

    this.orbitControl?.target.copy(targetPosition) // 更新控制器的环绕点位置
  }

  //#region 计算相机相关的一系列向量

  // 获得前进方向向量
  public getForwardVector() {
    this.sceneController.camera!.getWorldDirection(this.direction)
    // 转化为单位向量
    this.direction.normalize()

    return this.direction
  }

  // 获得左右方向向量
  public getSideVector() {
    this.sceneController.camera!.getWorldDirection(this.direction)

    // 将该向量转换为单位向量
    this.direction.normalize()
    this.direction.cross(this.sceneController.camera!.up)

    return this.direction
  }
  //#endregion
}
