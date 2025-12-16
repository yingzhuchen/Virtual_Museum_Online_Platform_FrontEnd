import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { LumaSplatsThree } from '@lumaai/luma-web'
import {
  Annotation,
  NavigationAnnotation,
  IntroductionAnnotation,
  type CreateAnnotationOptions,
  TransmissionAnnotation,
} from './annotation'
import { EffectComposer, Pass } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'
import { Player } from './player'
import { AnnotationType, type SceneResponse } from '~/api'
import { getCrosshairShaderPass } from './crosshair'
import { InputManager } from './inputManager'
import { FXAAShader, SSAARenderPass } from 'three/examples/jsm/Addons.js'

//控制

export interface SceneControllerSettings {
  calcFps?: boolean
}

const outputPass = new OutputPass()

export class SceneController {
  public renderer?: THREE.WebGLRenderer
  public camera?: THREE.PerspectiveCamera
  public scene = new THREE.Scene()
  private animationId = 0
  private clock?: THREE.Clock
  public splat?: LumaSplatsThree
  public inputManager?: InputManager

  /**其他自定义组件的update接口 */
  public onUpdated = new Map<string, Function>()

  private container?: HTMLElement
  public readonly canvasId = `luma-scene-canvas-${randomString(6)}`
  /** 场景数据。只有使用场景 ID 初始化场景并获取成功之后，此属性才不为空。 */
  public sceneData?: SceneResponse
  /** 场景链接。只有在使用 url 初始化场景之后，此属性才不为空。 */
  public url?: string

  /**渲染 */
  public composer?: EffectComposer
  private renderPass?: RenderPass
  private antiAliasingPass?: Pass
  private crosshairPass?: ShaderPass

  public annotations = ref<Annotation[]>([]) as Ref<Annotation[]>

  private stats?: Stats
  /** 0: fps, 1: ms, 2: memory */
  private statsPanelId = 0

  public readonly settings = ref<SceneControllerSettings>({
    calcFps: true,
  })
  private stopWatchSettings?: ReturnType<typeof watch>
  private canvasResizeObserver?: ResizeObserver

  /** 当前 Scene 是否已经被销毁。如果为 true，则 animate 函数应该停止渲染。 */
  private _destroyed = true
  /** 为了节约功耗，在用户不操作时暂停场景渲染。此变量提供给 {@link setUpdated()} 和 {@link animate()} 使用 */
  private _hasUpdate = false
  /** 一开始 Luma 加载场景时因该保持渲染 */
  private _lumaLoadingAnimationFinished = false

  public player?: Player

  public async init(container: HTMLElement, sceneIdOrUrl: number | string) {
    let url: string
    if (typeof sceneIdOrUrl === 'number') {
      this.sceneData = await batchGetScene(sceneIdOrUrl)
      url = this.sceneData.url
    } else {
      url = this.url = sceneIdOrUrl
    }
    if (!(await SceneController.isValidLumaURL(url))) {
      throw new Error('链接无效')
    }
    this.clock = new THREE.Clock()
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    })
    this.container = container
    this.scene = new THREE.Scene()
    this.stats = new Stats()
    // 设置设备像素比。通常用于HiDPI设备防止模糊输出canvas
    this.renderer.setPixelRatio(window.devicePixelRatio)
    // 设置渲染的宽高
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x000000, 1.0)

    this.renderer.domElement.id = this.canvasId
    container.appendChild(this.renderer.domElement)

    // camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.001,
      100,
    )
    this.camera.position.set(0, 0, 0)
    this.camera.rotation.order = 'YXZ'
    this.scene.add(this.camera)

    //添加后处理渲染通道
    //renderPass -> antiAliasingPass -> crosshairPass -> outputPass
    this.composer = new EffectComposer(this.renderer)
    this.renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(this.renderPass)

    //crosshair
    //SMAA抗锯齿
    //应用后处理通道后，原本renderer的抗锯齿会被覆盖掉，需要在添加其他效果前先对场景进行抗锯齿
    this.antiAliasingPass = new SMAAPass(
      container.clientWidth * this.renderer.getPixelRatio(),
      container.clientHeight * this.renderer.getPixelRatio(),
    )
    this.composer.addPass(this.antiAliasingPass)
    //通过后处理通道，向屏幕添加一个准星滤镜
    this.crosshairPass = getCrosshairShaderPass(
      this.renderer,
      container.clientWidth,
      container.clientHeight,
    )
    //解决添加后处理之后场景变暗的问题
    this.composer.addPass(outputPass)

    // player
    this.player = new Player(this, container)
    // inputManager
    this.inputManager = new InputManager(this)
    this.inputManager.init()

    //events
    this.canvasResizeObserver = new ResizeObserver(this.onResize)
    this.canvasResizeObserver.observe(container)

    this.stopWatchSettings = watch(
      this.settings,
      (newValue) => {
        if (newValue.calcFps) {
          this.showStatsPanel()
        } else {
          this.destroyStatsPanel()
        }
      },
      { deep: true },
    )
    if (this.settings.value.calcFps) {
      this.showStatsPanel()
    }
    this._destroyed = false
    this.animate()

    //load splats
    this.listAnnotations()
    this.loadSplat(url)
    if (this.sceneData?.birthPosition) {
      this.player.geometry.end.copy(this.sceneData.birthPosition)
      this.camera.position.copy(this.sceneData.birthPosition)
    }
    if (this.sceneData?.birthRotation)
      this.camera.rotation.set(
        this.sceneData.birthRotation.x,
        this.sceneData.birthRotation.y,
        this.sceneData.birthRotation.z,
      )
  }

  private animate = () => {
    if (this._destroyed) return

    // 时间片段
    const deltaTime = Math.min(0.05, this.clock!.getDelta())

    const hasInputUpdate = this.inputManager?.update(deltaTime)
    const shouldUpdate = !this._lumaLoadingAnimationFinished || this._hasUpdate || hasInputUpdate
    this._hasUpdate = false

    if (shouldUpdate) {
      this.onUpdated.forEach((update) => {
        update(deltaTime)
      })

      this.stats?.begin()
      //将应用完全部渲染通道的渲染结果覆盖到canvas上
      this.composer!.render(deltaTime)
      this.stats?.end()
    }

    requestAnimationFrame(this.animate)
  }

  /**
   * 销毁场景
   */
  public destroy() {
    this._destroyed = true
    this.canvasResizeObserver?.disconnect()
    this.stopWatchSettings?.()
    document.exitPointerLock()

    cancelAnimationFrame(this.animationId)
    this.destroyStatsPanel()
    this.scene?.clear()
    this.renderPass?.dispose()
    this.crosshairPass?.dispose()
    this.composer?.dispose()
    // 加这一行会触发 Uncaught TypeError: Failed to execute 'shaderSource' on 'WebGL2RenderingContext': parameter 1 is not of type 'WebGLShader'.
    // 原因暂时未知，所以先不加
    // this.renderer?.forceContextLoss()
    this.renderer?.dispose()
    this.splat?.dispose()
    this.player?.dispose()
    this.inputManager?.dispose()
    this.splat = undefined
    this.sceneData = undefined
    this.url = undefined
  }

  /** 获取当前 renderer 画面的 Base64 字符串 */
  public async screenshot(): Promise<string> {
    if (!this.renderer || !this.crosshairPass || !this.container) return ''

    this.renderer.setPixelRatio(window.devicePixelRatio * 4)
    this.composer?.removePass(this.crosshairPass)
    this.setUpdated()
    // 等下一帧渲染完毕
    await new Promise((r) => requestAnimationFrame(r))

    const img = this.renderer.domElement.toDataURL()

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.composer?.insertPass(this.crosshairPass, this.composer.passes.indexOf(outputPass))

    return img
  }

  public setCrosshairVisable(visible: boolean) {
    if (!this.renderer || !this.crosshairPass || !this.container) return
    const index = this.composer?.passes.indexOf(this.crosshairPass)
    if (visible && index == -1) {
      this.composer?.addPass(this.crosshairPass)
    } else if (!visible && index != -1) {
      this.composer?.removePass(this.crosshairPass)
    }
  }

  /**销毁当前保存在sceneController里面的splat */
  public unloadSplat() {
    if (this.splat) {
      this.scene.remove(this.splat)
      this.splat.dispose()
    }
  }

  /**加载splat ,如果新的sceneId和旧的不同则会执行batchGetScene，如果传入的是url就会直接加载
   * 此方法不会 不会 不会 销毁旧的splat
   */
  public async loadSplat(
    SceneIdOrUrl: string | number,
    add2SceneImmediately = true,
    onAfterLoad: Function | null = null,
  ) {
    let url: string
    if (typeof SceneIdOrUrl == 'number') {
      if (this.sceneData?.id != SceneIdOrUrl) this.sceneData = await batchGetScene(SceneIdOrUrl)
      url = this.sceneData.url
    } else {
      url = SceneIdOrUrl
    }

    this.splat = new LumaSplatsThree({
      source: url,
      particleRevealEnabled: true,
      loadingAnimationEnabled: false,
      enableThreeShaderIntegration: true,
    })
    if (this.sceneData) {
      this.splat.name = this.sceneData.name
    }

    this.splat.material.transparent = true
    // Luma 在点云显示完之后就会触发 onLoad，但是后续还有材质和天空的动画，所以这里等几秒钟
    this.splat.onLoad = () => {
      //渲染环境光
      // this.splat!.captureCubemap(this.renderer!).then((capturedTexture) => {
      //   this.scene.environment = capturedTexture
      //   this.scene.background = capturedTexture
      //   this.scene.backgroundBlurriness = 0.5
      // })
      if (onAfterLoad) onAfterLoad()
      if (!add2SceneImmediately) this.scene.add(this.splat!)
      setTimeout(() => {
        this._lumaLoadingAnimationFinished = true
      }, 8_000)
    }
    if (add2SceneImmediately) this.scene.add(this.splat!)
  }

  public setAntiAliasing(type: string) {
    if (!this.composer) return
    if (this.antiAliasingPass) this.composer.removePass(this.antiAliasingPass)

    switch (type) {
      case 'smaa':
        this.antiAliasingPass = new SMAAPass(window.innerWidth, window.innerHeight)
        this.composer.insertPass(
          this.antiAliasingPass,
          this.composer.passes.indexOf(this.renderPass!) + 1,
        )
        break
      case 'ssaa':
        this.antiAliasingPass = new SSAARenderPass(this.scene, this.camera!)
        this.composer.insertPass(
          this.antiAliasingPass,
          this.composer.passes.indexOf(this.renderPass!) + 1,
        )
        break
      case 'msaa':
        break //renderer本身自带msaa抗锯齿
      case 'fxaa':
        const FXAAPass = new ShaderPass(FXAAShader)
        this.antiAliasingPass = FXAAPass
        this.composer.insertPass(
          this.antiAliasingPass,
          this.composer.passes.indexOf(this.renderPass!) + 1,
        )
    }
  }

  //#region Annotations

  // TODO: 可以考虑把 annotation 相关东西抽象成单独的 manager

  /**销毁所有Annotation */
  public unloadAnnotations() {
    this.annotations.value.forEach((a) => {
      a.dispose(true)
    })
    this.annotations.value = []
  }

  public createAnnotation(type: AnnotationType, options?: CreateAnnotationOptions) {
    let newAnnotation: Annotation

    switch (type) {
      default:
        newAnnotation = new Annotation()
        break
      case AnnotationType.Introduction:
        newAnnotation = new IntroductionAnnotation()
        break
      case AnnotationType.Navigation:
        newAnnotation = new NavigationAnnotation()
        break
      case AnnotationType.Transmission:
        newAnnotation = new TransmissionAnnotation()
        break
    }
    options && newAnnotation.init(options)

    return newAnnotation
  }

  public changeAnnotationType(type: AnnotationType, annotation: Annotation) {
    let newAnnotation: Annotation
    switch (type) {
      default:
        newAnnotation = Annotation.copy(Annotation, annotation)
        break
      case AnnotationType.Introduction:
        newAnnotation = Annotation.copy(IntroductionAnnotation, annotation)
        break
      case AnnotationType.Navigation:
        newAnnotation = Annotation.copy(NavigationAnnotation, annotation)
        break
      case AnnotationType.Transmission:
        newAnnotation = Annotation.copy(TransmissionAnnotation, annotation)
        break
    }
    const index = this.annotations.value.findIndex((element) => {
      return annotation === element
    })
    if (index !== -1) {
      this.annotations.value[index] = newAnnotation
    } else {
      this.annotations.value.push(newAnnotation)
    }
    return newAnnotation
  }

  /** 获取标记列表并显示在场景中 */
  public async listAnnotations() {
    if (!this.sceneData?.id || !this.camera) return
    try {
      const annotations = await useApi('scene').listAnnotation(this.sceneData?.id)
      this.annotations.value.forEach((a) => a.dispose(true))
      annotations.data.forEach((annotation) => {
        const newAnnotation = this.createAnnotation(annotation.annotationData.type, {
          ...annotation,
          camera: this.camera!,
          id: annotation.annotationId,
          color: new THREE.Color(annotation.color),
          radius: annotation.radius,
          heightSegments: 16,
          widthSegments: 16,
        })
          .add2Scene(this)
          .setPosition(annotation.positionX, annotation.positionY, annotation.positionZ)
        newAnnotation.data = annotation.annotationData
        this.annotations.value.push(newAnnotation)
      })
    } catch (error) {
      handleApiError('加载标记列表', error)
    }
  }

  public async notifyAnnotationChange(annotation: Annotation) {
    if (!this.sceneData?.id) return

    const api = useApi('scene')
    const position = annotation.getWorldPosition()
    const color = `#${annotation.getColor().getHexString()}`
    const radius = annotation.getRadius()
    const name = annotation.name

    // 假如 ID 存在，说明这个注释已经存在数据库里，需要更新
    if (annotation.id) {
      const resp = await api.editAnnotation({
        annotationId: annotation.id,
        positionX: position.x,
        positionY: position.y,
        positionZ: position.z,
        annotationData: annotation.data,
        name,
        color,
        radius,
      })
      annotation.data = resp.annotationData // 上传后图片链接会变，需要更新
    }
    // 否则，说明注释还没有保存到后端
    else {
      const resp = await api.addAnnotation({
        name,
        positionX: position.x,
        positionY: position.y,
        positionZ: position.z,
        sceneId: this.sceneData.id,
        annotationData: annotation.data,
        color,
        radius,
      })
      annotation.id = resp.annotationId
      // 上传后图片链接会变，需要更新
      annotation.data = resp.annotationData
      this.annotations.value.push(annotation)
    }
  }

  public async notifyAnnotationDelete(annotation: Annotation) {
    const api = useApi('scene')
    if (annotation.id) {
      await api.removeAnnotation(annotation.id)
    }
    annotation.dispose(true)
    const index = this.annotations.value.findIndex((element) => {
      return annotation === element
    })
    if (index !== -1) {
      this.annotations.value.splice(index, 1)
    }
  }

  //#endregion

  /** 标志场景中有些操作被更新了，{@link animate()} 时需要重新渲染 */
  public setUpdated() {
    this._hasUpdate = true
  }

  public showStatsPanel() {
    if (!this.container) return
    if (!this.stats) this.stats = new Stats()
    this.stats.dom.style.left = '5.4rem'
    this.stats.dom.style.top = '1.8rem'
    this.stats.dom.onclick = (e) => {
      this.statsPanelId++
      if (this.statsPanelId === 3) this.statsPanelId = 0
      this.stats?.showPanel(this.statsPanelId)
    }
    document.body.appendChild(this.stats.dom)
    this.stats.showPanel(this.statsPanelId)
  }

  public destroyStatsPanel() {
    // console.log(this.stats)
    this.stats?.dom.remove()
    delete this.stats
  }

  // 在需要被其他函数调用的地方使用箭头函数，保证 this 指向正确
  private onResize = () => {
    // TODO: 准心也要刷新
    this.camera!.aspect = this.container!.clientWidth / this.container!.clientHeight
    this.camera!.updateProjectionMatrix()
    this.renderer!.setSize(this.container!.clientWidth, this.container!.clientHeight)
    this.setUpdated()
  }

  // 工具函数

  /** 检查 Luma 场景链接是否合法且存在 */
  static async isValidLumaURL(uuidOrUrl: string) {
    try {
      if (uuidOrUrl.startsWith(LUMA_CAPTURE_BASE_URL)) {
        uuidOrUrl = uuidOrUrl.slice(LUMA_CAPTURE_BASE_URL.length)
      }
      const resp = await fetch(
        `https://webapp.engineeringlumalabs.com/api/v3/captures/${uuidOrUrl}/public`,
      )

      return (await resp.json()).status === 'success'
    } catch (e: any) {
      console.error('SceneController.isValidLumaURL() error:', e.message)
      return false
    }
  }
}
