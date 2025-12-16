export enum EditSceneFormPage {
  /** 默认的表单 */
  default,
  /** 创建模型的帮助 */
  modelHelp,
  /** 获取模型 URL 的帮助 */
  modelURLHelp,
}

export interface EditSceneFormHelpData {
  id: string
  title: string
  articles: {
    id: string
    title: string
    content: Array<{ type: 'text' | 'image'; data: string }>
  }[]
  relatedArticles: { page: EditSceneFormPage.modelHelp | EditSceneFormPage.modelURLHelp }[]
}

export const LUMA_CAPTURE_BASE_URL = 'https://lumalabs.ai/capture/'

export const ACCOUNT_PASSWORD_REGEXP = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!?\-+*/.^]).{8,25}$/

export const EL_COLOR_PICKER_PRESETS_ANNOTATION = [
  '#82C0E2', // Sky Blue
  '#8ED1C2', // Soft Green
  '#A693C2', // Muted Purple
  '#E3A6B2', // Light Coral
  '#F0B67F', // Soft Orange
  '#F6D75B', // Pale Gold
  '#7BC8A4', // Light Teal
  '#C69DF3', // Light Violet
  '#89CFF0', // Baby Blue
  '#EF798A', // Light Red
  '#DE98B3', // Light Pink
  '#E1F0C4', // Light Lime
  '#F7A699', // Soft Salmon
  '#A58CC6', // Soft Lavender
  '#C5E0A4', // Light Olive
]

export const ANNOTATION_DEFAULT_NAME = 'NewAnnotation'

export const LUMA_HELP_DOCS: Record<EditSceneFormPage, EditSceneFormHelpData> = {
  [EditSceneFormPage.default]: { id: '', articles: [], relatedArticles: [], title: '' },
  [EditSceneFormPage.modelHelp]: {
    id: 'modelHelp',
    title: '如何创建模型',
    articles: [
      {
        id: 'modelHelp-howto',
        title: '如何创建模型',
        content: [
          {
            type: 'text',
            data: '在浏览器中输入网址 http://3d.new，进入 Luma Dashboard。登录后，在网页的右上方有一个“Create”按键。',
          },
          { type: 'image', data: 'https://s21.ax1x.com/2024/06/20/pkB4P0O.png' },
          { type: 'text', data: '点击 Create 后选择您拍摄好的视频或者图片素材：' },
          { type: 'image', data: 'https://s21.ax1x.com/2024/06/20/pkB4Ehd.png' },
          { type: 'text', data: '为你即将创建的模型编辑标题，相机种类和是否公开的信息。' },
          { type: 'image', data: 'https://s21.ax1x.com/2024/06/20/pkB4Z9A.png' },
          {
            type: 'text',
            data: '相机种类分为 Normal（普通摄像机）, Fisheye（鱼眼镜头）和 Equirectangular（等距柱状投影）。使用手机、相机拍摄的视频推荐选择 Normal；对于鱼眼镜头数码单反相机、Insta360 等设备拍摄的视频，推荐选择 Fisheye 选项；对于由鱼眼镜头设备拍摄处理而成的视频（如下图所示），推荐选择 Equirectangular 模式。',
          },
          { type: 'image', data: 'https://s21.ax1x.com/2024/06/20/pkBIjhQ.png' },
          {
            type: 'text',
            data: '点击 Upload，等待上传完成后，即可在“Your Captures”中看到正在排队生成的模型。',
          },
          { type: 'image', data: 'https://s21.ax1x.com/2024/06/20/pkBIxpj.png' },
        ],
      },
      {
        id: 'modelHelp-best-practices',
        title: '最佳实践',
        content: [
          { type: 'text', data: '捕获过程：' },
          {
            type: 'text',
            data: '捕获速度：运动模糊会显著降低重建的质量。为了获得最佳效果，请缓慢移动手机，并尽量避免快速移动，尤其是旋转。',
          },
          {
            type: 'text',
            data: '场景覆盖：为了获得最佳效果，应该从尽可能多的独特视角捕捉物体或场景。此外，在拍摄时最好移动手机（在 3D 空间中），而不是从固定位置旋转手机。站在同一个地方，在一个球体中向外捕捉通常效果不佳。引导捕获模式是确保足够覆盖的好选择。',
          },
          {
            type: 'text',
            data: '对象大小：如果您的视频是针对一个特定的物体，请从各个角度（包括顶部和底部）扫描它；对于自由视角的视频来说，请确保尽可能多地扫描场景的各个面和角落。',
          },
          {
            type: 'text',
            data: '物体距离：为了获得最佳效果，在扫描时尽量保持整个物体在画面内。这样做将为 Luma AI 提供更多关于反射和物体形状的信息，从而产生更准确的重建。',
          },
          {
            type: 'text',
            data: '物体材料：目前，Luam AI 正在努力应对复杂的反射（例如，弯曲的镜面状表面），弯曲的透明物体（例如，车窗或塑料水瓶）以及非常大的无纹理表面（例如白墙）。大多数其它材料的效果都不错。',
          },
          {
            type: 'text',
            data: '捕捉环境光线水平：只要物体的纹理仍然可以识别，Luma AI 就可以在大多数照明条件下完成捕捉。但通常来说，场景内的可见程度越高越好。',
          },
          {
            type: 'text',
            data: '避开移动的物体：在捕捉过程中场景中的任何移动都可能降低最终结果的质量。例如，树叶在风中移动可能会导致细节的丢失，而在背景中走动的人可能会引入伪影。拍摄时请注意不要将手指/手臂/腿伸入画面。',
          },
          { type: 'text', data: '相机的设置：' },
          {
            type: 'text',
            data: '视频设置陷阱：如果使用视频捕获，关闭视频稳定是非常重要的，因为它会导致画面出现不稳定。这在 Android 设备上尤为重要，在 iOS 上请不要使用“HDR 视频”选项。',
          },
          {
            type: 'text',
            data: '曝光：如果你自己拍摄视频，我们建议尽可能使用固定曝光，尽管允许曝光变化对不同光线的户外场景有益。',
          },
        ],
      },
    ],
    relatedArticles: [{ page: EditSceneFormPage.modelURLHelp }],
  },
  [EditSceneFormPage.modelURLHelp]: {
    id: 'modelURLHelp',
    title: '如何获取模型 URL',
    articles: [
      {
        id: 'modelURLHelp-1',
        title: '简介：Luma AI 与模型 URL',
        content: [
          {
            type: 'text',
            data: '本产品使用 Luma AI 提供的视频生成模型服务，模型 URL 是 Luma AI 提供的视频生成模型服务中，用于唯一识别 3D 模型的关键信息。通过这个 URL，用户可以轻松加载模型并创建个性化的场景。',
          },
          {
            type: 'text',
            data: '在尝试自己创建场景之前，Luma AI 已经有许多人分享了他们创建的场景，你可以选择参阅我们的另一份文档来了解如何通过手机拍摄就生成出好用的场景，也可以继续阅读 URL 的获取方式，通过现有的场景来进行二次创作。',
          },
        ],
      },
      {
        id: 'modelURLHelp-2',
        title: '步骤一：进入你喜欢的场景',
        content: [
          { type: 'text', data: '在 Luma Capture 界面中，点击你感兴趣的场景。' },
          {
            type: 'image',
            data: 'https://s21.ax1x.com/2024/06/20/pkBh8Qx.png',
          },
          {
            type: 'text',
            data: '在这里，你可以对接下来想要放入本产品的场景进行预览，如果模型生成效果不佳，现在是发现问题并且重新来过的好时机。',
          },
        ],
      },
      {
        id: 'modelURLHelp-3',
        title: '步骤二：从网页链接获取',
        content: [
          { type: 'text', data: '确保你现在正处于某个场景的页面中。' },
          {
            type: 'text',
            data: '如果你正在使用浏览器访问 Luma AI，那么要做的就很简单了。观察浏览器上方的地址栏，这里面就包含了将模型导入到我们场景所需要的 URL。',
          },
          { type: 'image', data: 'https://s21.ax1x.com/2024/06/20/pkBh0fA.png' },
          {
            type: 'text',
            data: '将其复制并填入创建场景时所需填写的 URL 中。当弹出识别成功的提示时，便表示你已经成功了 90% 了。',
          },
          { type: 'image', data: 'https://s21.ax1x.com/2024/06/20/pkBhDSI.png' },
        ],
      },
      {
        id: 'modelURLHelp-4',
        title: '步骤三：通过封面截图来预览场景导入效果',
        content: [
          {
            type: 'text',
            data: '在新建/编辑场景界面中，我们提供了在场景中自由截图的方法来获取封面。',
          },
          { type: 'image', data: 'https://s21.ax1x.com/2024/06/20/pkBhrlt.png' },
          {
            type: 'text',
            data: '在确保 URL 已经填写好后，进入封面截图就可以在一个小窗口内以第一人称的视角来进行预览：',
          },
          { type: 'image', data: 'https://s21.ax1x.com/2024/06/20/pkBhs6P.png' },
          {
            type: 'text',
            data: '通过这种方式来确保你的场景 URL 输入正确，同时截选你最喜欢的镜头吧！',
          },
        ],
      },
    ],
    relatedArticles: [{ page: EditSceneFormPage.modelHelp }],
  },
}
