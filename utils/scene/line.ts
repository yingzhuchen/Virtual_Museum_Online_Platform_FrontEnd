import * as THREE from 'three'
import * as INPUTMGR from './inputManager'
import type { SceneController } from './scene'
//Line2相关的代码已被删，加上之后有点混乱
export class Line {
  private geometry?: THREE.BufferGeometry
  private material = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms: {
      uTime: { value: 0 },
      width: { value: 2 },
    },
  })

  private line?: THREE.Line

  public add2Scene(scene: THREE.Scene, curve: THREE.CatmullRomCurve3) {
    var points = curve.getPoints(50)
    this.geometry = new THREE.BufferGeometry().setFromPoints(points)
    this.removeFromScene(scene)
    // var mats = [this.material, this.material2]
    this.line = new THREE.Line(this.geometry, this.material)
    scene.add(this.line)
  }

  public removeFromScene(scene: THREE.Scene) {
    if (this.line) scene.remove(this.line)
  }

  public update(deltaTime: number) {
    this.material.uniforms.uTime.value += deltaTime
  }

  public dispose() {
    if (this.geometry) {
      // 释放几何体的内存
      this.geometry.dispose()
      this.geometry = undefined // 将几何体设置为undefined，避免悬挂引用
    }
    if (this.material) {
      // 释放材质的内存
      this.material.dispose()
    }
    if (this.line) {
      // 从场景中移除线条，并释放相关资源
      this.line.geometry.dispose()
      this.line = undefined
    }
  }
}

export class Point implements INPUTMGR.TransformControlObject {
  static pointCounter: number = 0
  public cube: THREE.Mesh
  private sc: SceneController
  public enableTransformControl: boolean = true
  inputManager: INPUTMGR.InputManager
  constructor(size: number, position: THREE.Vector3, sc: SceneController) {
    this.cube = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshBasicMaterial(),
    )
    this.sc = sc
    this.cube.position.set(position.x, position.y, position.z)
    this.cube.name = 'point_' + Point.pointCounter++
    this.sc.scene.add(this.cube)
    this.inputManager = sc.inputManager!
    this.inputManager.addRaycasterDetectedObject(this)
  }

  get3DObject(): THREE.Object3D<THREE.Object3DEventMap> {
    return this.cube
  }

  public add2Scene(scene: THREE.Scene, position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
    this.sc.scene = scene
    scene.add(this.cube)
    this.cube.position.set(position.x, position.y, position.z)
  }

  public remove() {
    this.sc.scene.remove(this.cube)
    this.clearDraggingChangedEvent()
  }

  private actions: Function[] = []
  //向InputManager的Transform Control中添加一个关于这个物体的dragging-changed监听
  public addDraggingChangedEvent(action: (event: any) => void) {
    var fun = (event: any) => {
      action(event)
    }
    this.inputManager.transformControl.addEventListener('dragging-changed', fun)
    this.actions.push(fun)
  }
  //清空transfomrControl中所有关于这个物体的dragging-changed监听
  public clearDraggingChangedEvent() {
    this.actions.forEach((element) => {
      this.inputManager.transformControl.removeEventListener('dragging-changed', element())
    })
  }

  public dispose() {}
}

const vShader = `
varying vec2 vUv;
varying float vLineDistance;
uniform float width;
uniform float uTime;
void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vLineDistance = length((modelMatrix * vec4(position, 1.0)).xyz);
    float offsetX = 0.01*sin(position.x * 10.0 + uTime); // 根据sin函数计算偏移量
    float offsetZ = 0.01*sin(position.z * 10.0 + uTime); // 根据sin函数计算偏移量
    mvPosition.y += offsetX+offsetZ; // 在y轴上应用偏移量
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = mvPosition.x * 100.0;
}
`
const fShader = `
varying vec2 vUv;
varying float vLineDistance;
uniform float width;
uniform float uTime;
void main(){
    gl_FragColor = vec4(1.0);
    
}

`
