import * as THREE from 'three'
import { SceneController } from './scene'
import {
  AnnotationType,
  type AnnotationData,
  type AnnotationIntroduction,
  type AnnotationNavigation,
  type AnnotationTransmission,
} from '~/api'
import { Line, Point } from './line'
import * as INPUTMGR from './inputManager'
import * as PLAYER from './player'

export interface CreateAnnotationOptions {
  radius?: number
  color?: THREE.Color
  widthSegments?: number
  heightSegments?: number
  camera: THREE.Camera
  id?: number
  name?: string
  description?: string
}

/** 携带在 Annotation 中的一些常用数据，提供给使用它的类 */
export interface AnnotationContext<T extends Annotation> {
  owner: T
  onClick: (ball: THREE.Object3D) => void
  onEnterHover: (ball: THREE.Object3D) => void
  onLeaveHover: (ball: THREE.Object3D) => void
}
export type AnnotationObject3D<T extends Annotation> = Omit<THREE.Object3D, 'material'> & {
  userData: AnnotationContext<T>
  material: THREE.MeshBasicMaterial
}
export type AnnotationObjectMesh<T extends Annotation> = Omit<THREE.Mesh, 'material'> & {
  userData: AnnotationContext<T>
  material: THREE.MeshBasicMaterial
}

const errNotInitialized = new Error('标记还未初始化')
const errAlreadyPicked = new Error('标记已经被捡起')
const errNotPicked = new Error('标记尚未被捡起')
const errNotInScene = new Error('标记不在场景中')

export class Annotation implements INPUTMGR.TransformControlObject, PLAYER.DistanceDetectedObject {
  public ball?: THREE.Mesh
  public name = ''
  public description = ''
  public id?: number = 0 // 后端的 annotationId
  public data: AnnotationData = { type: 'introduction' }

  /** 是否为草稿（未保存到后端）。草稿标记不会出现在 `getNearestAnnotation()` 中 */
  public isDraft = true

  private camera?: THREE.Camera
  protected sceneController?: SceneController

  public enableTransformControl: boolean = true
  private isPicked = false

  public inputManager?: INPUTMGR.InputManager
  public player?: PLAYER.Player

  constructor() {}

  public init(options: CreateAnnotationOptions) {
    const {
      radius = 0.05,
      color = new THREE.Color(0xffffff),
      widthSegments = 16,
      heightSegments = 16,
      camera,
      id,
      name,
      description,
    } = options

    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments)
    const material = new THREE.MeshBasicMaterial({
      color: color,
    })
    this.ball = new THREE.Mesh(geometry, material)
    this.name = name || ANNOTATION_DEFAULT_NAME
    this.ball.name = this.name

    this.camera = camera
    this.id = id
    if (id) {
      this.isDraft = false
    }
    this.description = description || ''
    this.registerEvent()

    return this
  }

  /** add observer */
  public add2Scene(sc: SceneController) {
    if (!this.ball) throw errNotInitialized
    sc.scene.add(this.ball)
    this.inputManager = sc.inputManager
    sc.inputManager?.addRaycasterDetectedObject(this)
    // 目前改成手动保存标记数据了
    // sc.inputManager?.transformControl.addEventListener('dragging-changed', (event) => {
    //   if (!event.value && event.target.object == this.ball) this.save()
    // })
    sc.player!.addDistanceDetectObject(this)

    this.sceneController = sc
    this.sceneController.setUpdated()
    return this
  }

  public setPosition(x: number, y: number, z: number) {
    if (!this.ball) throw errNotInitialized
    this.ball.position.set(x, y, z)
    this.sceneController?.setUpdated()
    return this
  }

  /** 捡起标记，放到视角正前方 `viewOffset` 的地方。找到合适位置后，使用 {@link drop()} 放下标记。 */
  public pickup(viewOffset: number) {
    if (this.isPicked) throw errAlreadyPicked
    if (!this.camera || !this.ball) throw errNotInitialized
    // 设置小球为摄像机的子对象，以便跟随摄像机移动

    this.ball.position.set(0, 0, -viewOffset)
    this.camera.add(this.ball)
    this.isPicked = true
  }

  /**
   * 与 {@link pickup()} 对应，把注释点放下。
   * @returns 放下后的位置
   */
  public drop() {
    if (!this.isPicked) throw errNotPicked
    if (!this.camera || !this.ball) throw errNotInitialized
    if (!this.sceneController) throw errNotInScene

    const wp: THREE.Vector3 = new THREE.Vector3()
    this.ball.getWorldPosition(wp)
    this.camera.remove(this.ball) //取消子对象
    this.ball.position.set(wp.x, wp.y, wp.z)
    this.sceneController.scene.add(this.ball) //重新固定到场景中
    this.isPicked = false

    return this.ball.position
  }

  /** 保存标记信息到后端 */
  public async save() {
    if (!this.sceneController) throw errNotInScene
    await this.sceneController.notifyAnnotationChange(this)
    this.isDraft = false
    this.sceneController.setUpdated()
  }

  public async delete() {
    if (!this.sceneController) throw errNotInScene
    await this.sceneController.notifyAnnotationDelete(this)
  }

  public setRadius(radius: number) {
    if (!this.ball) throw errNotInitialized
    const geometry = this.ball.geometry as THREE.SphereGeometry
    //计算原有顶点数
    const heightSegments = geometry.parameters.heightSegments
    const widthSegments = geometry.parameters.widthSegments
    const newGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments) // 顶点数和面数与原来相同

    // 替换小球的几何体
    this.ball.geometry.dispose() // 释放原有几何体的资源
    this.ball.geometry = newGeometry
    this.sceneController?.setUpdated()
  }

  public onClick(ball: AnnotationObject3D<Annotation>) {
    //阻断不合法的点击事件（例如当isPicked时不允许点击）
    if (ball.userData.owner.isPicked === true) {
      return
    }
  }

  public onEnterHover(ball: THREE.Object3D) {
    //阻断不合法的点击事件（例如当isPicked时不允许悬浮）
    if (ball.userData.owner.isPicked === true) {
      return
    }
  }

  public onLeaveHover(ball: THREE.Object3D) {
    //阻断不合法的点击事件（例如当isPicked时不允许悬浮）
    if (ball.userData.owner.isPicked === true) {
      return
    }
  }

  public onSelectByDistanceDetect(ball: THREE.Object3D) {}

  protected registerEvent() {
    if (!this.ball) throw errNotInitialized
    this.ball.userData.owner = this
    this.ball.userData.onClick = this.onClick
    this.ball.userData.onEnterHover = this.onEnterHover
    this.ball.userData.onLeaveHover = this.onLeaveHover
  }
  protected clearEvent() {
    if (!this.ball) throw errNotInitialized
    this.ball.userData.owner = null
    this.ball.userData.onClick = null
    this.ball.userData.onEnterHover = null
    this.ball.userData.onLeaveHover = null
  }

  public setPrecision(widthSegments: number, heightSegments: number) {
    if (!this.ball) throw errNotInitialized
    //计算原有顶点数
    const geometry = this.ball.geometry as THREE.SphereGeometry
    const newGeometry = new THREE.SphereGeometry(
      geometry.parameters.radius,
      widthSegments,
      heightSegments,
    ) // 顶点数和面数与原来相同

    // 替换小球的几何体
    this.ball.geometry.dispose() // 释放原有几何体的资源
    this.ball.geometry = newGeometry
    this.sceneController?.setUpdated()
  }

  public setColor(color: THREE.Color) {
    if (!this.ball) throw errNotInitialized
    ;(this.ball.material as THREE.MeshBasicMaterial).color.set(color)
    this.sceneController?.setUpdated()
  }

  public getWorldPosition() {
    if (!this.ball) throw errNotInitialized
    let result: THREE.Vector3 = new THREE.Vector3()
    this.ball.getWorldPosition(result)
    return result
  }

  public getColor() {
    if (!this.ball) throw errNotInitialized
    return (this.ball.material as THREE.MeshBasicMaterial).color
  }

  public getRadius() {
    if (!this.ball) throw errNotInitialized
    const geometry = this.ball.geometry as THREE.SphereGeometry
    return geometry.parameters.radius
  }

  public get3DObject(): THREE.Object3D {
    return this.ball!
  }

  public dispose(destroyBall: boolean): void {
    if (destroyBall) {
      if (this.ball && this.ball.parent) {
        // 如果小球存在且已经被添加到场景中
        this.ball.parent.remove(this.ball)
      }
      // 释放几何体资源
      if (this.ball && this.ball.geometry) {
        this.ball.geometry.dispose()
      }
      // 释放材质资源
      if (this.ball && this.ball.material) {
        // 如果材质是可 dispose 的
        if ((this.ball.material as any).dispose) {
          ;(this.ball.material as any).dispose()
        }
        this.ball.material = null! // 确保材质被移除
      }
      //移除inputMgr和player对Annotation的射线检测和距离检测
    }
    this.inputManager?.removeRaycasterDetectedObject(this)
    this.player?.removeDistanceDetectObject(this)
    this.clearEvent()
    this.ball = null! // 清除球的引用
    this.sceneController?.setUpdated()
  }

  public static copy<T extends Annotation>(classType: new () => T, annotation: Annotation) {
    if (annotation) {
      let newAnnotation = new classType()
      newAnnotation.ball = annotation.ball
      annotation.dispose(false)
      newAnnotation.data = annotation.data
      newAnnotation.id = annotation.id
      newAnnotation.name = annotation.name
      newAnnotation.description = annotation.description
      newAnnotation.player = annotation.player
      newAnnotation.sceneController = annotation.sceneController
      annotation.player?.addDistanceDetectObject(newAnnotation)
      newAnnotation.inputManager = annotation.inputManager
      annotation.inputManager?.addRaycasterDetectedObject(annotation)
      newAnnotation.camera = annotation.camera
      newAnnotation.isDraft = annotation.isDraft
      //释放资源但不销毁
      //重新注册
      newAnnotation.registerEvent()
      return newAnnotation
    }
    throw '传个null是什么意思呢？'
  }
}

export class IntroductionAnnotation extends Annotation {
  public data: AnnotationIntroduction = {
    type: AnnotationType.Introduction,
  }

  public onClick(ball: AnnotationObjectMesh<IntroductionAnnotation>): void {
    super.onClick(ball)
  }
}

export class NavigationAnnotation extends Annotation {
  public data: AnnotationNavigation = {
    type: AnnotationType.Navigation,
  }
  public guideLine?: Line
  public catmullRomCurve3?: THREE.CatmullRomCurve3

  public points: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1)]
  public pointsMesh: Point[] = []

  public lineShowed = false
  public pointShowed = false

  //点击时打开line
  public onClick(ball: AnnotationObjectMesh<NavigationAnnotation>): void {
    super.onClick(ball)
    ball.userData.owner.catmullRomCurve3 = new THREE.CatmullRomCurve3(ball.userData.owner.points)
    ball.userData.owner.showGuideLine()
  }

  //显示导航线
  public showGuideLine() {
    if (this.lineShowed || !this.catmullRomCurve3 || this.points.length === 0) {
      return
    }

    this.lineShowed = true
    this.guideLine = new Line()
    this.guideLine.add2Scene(this.sceneController!.scene, this.catmullRomCurve3)
    this.showPoints()
    this.sceneController?.setUpdated()
  }
  public showPoints() {
    if (this.pointShowed || this.points.length === 0) {
      return
    }
    this.pointsMesh.forEach((element) => {
      element.remove()
    })
    this.pointsMesh = []
    this.points.forEach((element) => {
      const newPt = new Point(0.1, element, this.sceneController!)
      newPt.addDraggingChangedEvent((event) => {
        if (!event.value && event.target.object == newPt.cube) {
          this.updatePoints()
        }
      })
      this.pointsMesh.push(newPt)
    })
    this.sceneController?.setUpdated()
  }

  private updatePoints() {
    this.points = []
    this.pointsMesh.forEach((element) => {
      this.points.push(element.cube.position)
    })
    this.catmullRomCurve3 = new THREE.CatmullRomCurve3(this.points)
    this.guideLine?.add2Scene(this.sceneController!.scene, this.catmullRomCurve3)
    this.sceneController?.setUpdated()
  }

  public updated(deltaTime: number): void {
    if (this.lineShowed) {
      this.guideLine?.update(deltaTime)
    }
    this.sceneController?.setUpdated()
  }
}

export class TransmissionAnnotation extends Annotation {
  public data: AnnotationTransmission = {
    type: AnnotationType.Transmission,
    toSceneId: 0,
    toTransmissionAnnotationId: 0,
  }
  public toSceneID: number = -1
}
