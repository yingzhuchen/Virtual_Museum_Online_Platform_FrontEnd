import { ControlMethod, type Player } from './player'
import { TransmissionAnnotation, type Annotation, type AnnotationObjectMesh } from './annotation'

//键盘输入事件基类
export class KeyInputState {
  // 全部 handler 共同维护一份按键状态
  static handledKeys: Record<string, boolean> = {}

  public doHandleKey(
    deltaTime: number,
    keys: Record<string, boolean>,
    context: KeyInputContext,
  ): boolean {
    let handled = false
    // 遍历所有按键
    for (const keyName in keys) {
      if (keys[keyName] && !KeyInputState.handledKeys[keyName]) {
        // 按键被按下，并且尚未处理
        handled = this.handleKeyClick(keys, context) || handled
      }
    }

    handled = this.handleKeyPress(deltaTime, keys, context) || handled

    return handled
  }

  public handleKeyClick(key: Record<string, boolean>, context: KeyInputContext): boolean {
    return false
  }
  public handleKeyPress(
    deltaTime: number,
    key: Record<string, boolean>,
    context: KeyInputContext,
  ): boolean {
    return false
  }
}

//键盘输入事件的状态处理器
export class KeyInputContext {
  private states: KeyInputState[] = []
  private enabled = true

  /** 添加一个键位处理器。 */
  pushState(state: KeyInputState) {
    this.states.push(state)
  }

  /** 移除全部键位处理器 */
  clearState() {
    this.states = []
  }

  /**
   * 移除特定的键位处理器
   * @returns 对应的键位是否存在且移除成功。如果是，返回 `true`，否则返回 `false`。
   **/
  removeState(state: KeyInputState) {
    const index = this.states.indexOf(state)

    if (index !== -1) {
      this.states.splice(index, 1)
      return true
    }
    return false
  }

  /** 替换掉现有的某个键位处理器。如果 `searchValue` 不在当前的处理器列表中，则不会替换。 */
  replaceState(searchValue: KeyInputState, replaceValue: KeyInputState) {
    const index = this.states.indexOf(searchValue)

    if (index !== -1) {
      this.states[index] = replaceValue
      return true
    }
    return false
  }

  popState() {
    return this.states.pop()
  }

  stop() {
    this.enabled = false
  }

  start() {
    this.enabled = true
  }

  doHandleKey(deltaTime: number, keys: Record<string, boolean>): boolean {
    let handled = false
    if (!this.enabled) return handled
    if (this.states.length) {
      handled = this.states[this.states.length - 1]?.doHandleKey(deltaTime, keys, this) || false
    }
    for (const keyName in KeyInputState.handledKeys) {
      if (!keys[keyName] && KeyInputState.handledKeys[keyName]) {
        delete KeyInputState.handledKeys[keyName]
      }
    }
    for (const keyName in keys) {
      if (keys[keyName]) KeyInputState.handledKeys[keyName] = true
    }
    return handled
  }
}

//场景内默认状态（WASD控制移动）
export class PlayerKeyInputState extends KeyInputState {
  constructor(
    public player: Player,
    private onSelectAnnotation?: (annotation: AnnotationObjectMesh<Annotation>) => void,
    private onCreateAnnotation?: () => void,
    private onSaveSpawnPoint?: () => void,
    private onOpenFullMap?: () => void,
    private onOpenSceneInfoDialog?: () => void,
    private onEditAnnotation?: () => void,
  ) {
    super()
  }

  public override handleKeyClick(keys: Record<string, boolean>, context: KeyInputContext): boolean {
    if (keys['KeyF']) {
      const nearestAnnotation = this.player.getNearestAnnotation(1)
      if (!nearestAnnotation) return false
      // 只有传送点执行lookSmoothly，其他的暂时不执行。
      // TODO: lookSmoothly的逻辑可以考虑移到onSelecetAnnotation里面执行，但是现在的写法改起来不方便
      this.onSelectAnnotation?.(nearestAnnotation)
      if (nearestAnnotation.userData.owner.data.type === 'transmission')
        this.player.lookAtSmoothly(nearestAnnotation.position)
      return true
    } else if (keys['KeyB']) {
      this.onCreateAnnotation?.()
      return true
    } else if (keys['KeyO']) {
      this.onSaveSpawnPoint?.()
      return true
    } else if (keys['KeyM']) {
      this.onOpenFullMap?.()
      return true
    } else if (keys['Escape']) {
      this.onOpenSceneInfoDialog?.()
      return true
    } else if (keys['KeyE']) {
      this.onEditAnnotation?.()
      return true
    }
    return false
  }

  public override handleKeyPress(
    deltaTime: number,
    keys: Record<string, boolean>,
    context: KeyInputContext,
  ): boolean {
    const speedDelta = deltaTime * this.player.speed * Math.exp(-this.player.friction / 20)
    let verticleSpeed = 0
    let handled = false

    if (keys['KeyW']) {
      // 摁下W，改变水平方向的向量， multiplyScalar 乘积
      this.player.velocity.add(this.player.getForwardVector().multiplyScalar(speedDelta))
      handled = true
    }

    if (keys['KeyS']) {
      this.player.velocity.add(this.player.getForwardVector().multiplyScalar(-speedDelta))
      handled = true
    }

    if (keys['KeyA']) {
      this.player.velocity.add(this.player.getSideVector().multiplyScalar(-speedDelta))
      handled = true
    }

    if (keys['KeyD']) {
      this.player.velocity.add(this.player.getSideVector().multiplyScalar(speedDelta))
      handled = true
    }
    if (keys['Space']) {
      verticleSpeed += deltaTime * this.player.speed
      handled = true
    }

    if (keys['ShiftLeft']) {
      verticleSpeed += -deltaTime * this.player.speed
      this.player.controlMethod.value = ControlMethod.FirstPerson
      handled = true
    }
    if (verticleSpeed != 0) {
      this.player.velocity.y = verticleSpeed
    }
    return handled
  }
}

/**
 * 介绍点的按键处理
 */
export class IntroductionAnnotationInfoKeyState extends KeyInputState {
  constructor(
    private onPressKeyF: () => void,
    private onPressKeyQ: () => void,
  ) {
    super()
  }

  public override handleKeyClick(keys: Record<string, boolean>, _: KeyInputContext) {
    if (keys['KeyQ']) {
      this.onPressKeyQ()
      return true
    } else if (keys['KeyF']) {
      this.onPressKeyF()
      return true
    }
    return false
  }
}

export class FullMapKeyState extends KeyInputState {
  constructor(private onClickCloseMap: () => void) {
    super()
  }

  public override handleKeyClick(keys: Record<string, boolean>, _: KeyInputContext) {
    if (keys['KeyQ'] || keys['KeyM']) {
      this.onClickCloseMap()
      return true
    }
    return false
  }
}

export class DialogKeyState extends KeyInputState {
  constructor(private onClickCloseDialog: () => void) {
    super()
  }

  public override handleKeyClick(keys: Record<string, boolean>, _: KeyInputContext) {
    if (keys['Escape']) {
      this.onClickCloseDialog()
      return true
    }
    return false
  }
}
