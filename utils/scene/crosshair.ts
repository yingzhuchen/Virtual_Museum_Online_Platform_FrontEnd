import { Camera } from '@element-plus/icons-vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

export var crosshairTexture: THREE.Texture

export function getCrosshairShaderPass(
  renderer: THREE.WebGLRenderer,
  viewWidth: number,
  viewHeight: number,
) {
  const scene = new THREE.Scene()

  // camera
  const camera = new THREE.PerspectiveCamera(75, viewWidth / viewHeight, 0.1, 100)
  camera.position.set(0, 0, 0)
  camera.rotation.order = 'YXZ'
  scene.add(camera)

  const renderTarget = new THREE.WebGLRenderTarget(viewWidth, viewHeight)
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const verticalGeometry = new THREE.BoxGeometry(0.01, 0.001, 0.0001)
  const horizontalGeometry = new THREE.BoxGeometry(0.001, 0.01, 0.0001)

  const renderedMesh = new THREE.Mesh(verticalGeometry, material)
  const mesh2 = new THREE.Mesh(horizontalGeometry, material)

  camera.add(renderedMesh)
  renderedMesh.add(mesh2)
  renderedMesh.position.set(0, 0, -0.2)

  renderer.setRenderTarget(renderTarget)
  renderer.render(scene, camera)
  crosshairTexture = renderer.getRenderTarget()!.texture
  renderer.setRenderTarget(null)

  return new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        crosshair: { value: crosshairTexture },
        tInput: { value: null },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D crosshair;
        uniform sampler2D tInput;
        varying vec2 vUv;
        void main() {
          vec3 cp = texture2D(crosshair, vUv).rgb;
          vec4 color = texture2D(tInput, vUv);
          if(cp.r >= 0.9999 && cp.g >= 0.9999 && cp.b >= 0.9999){
              float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722)); // 计算亮度
              float whiteDotThreshold = 0.8; // 白点的亮度阈值，可以根据需要调整
              
              if (brightness > whiteDotThreshold) {
                  gl_FragColor = vec4(0.0, 0.0, 0.0, color.a); // 较亮的点替换为黑色
                  } 
              else {
                  gl_FragColor = vec4(1.0, 1.0, 1.0, color.a); // 较暗的点替换为白色
              }
          }
          else{
              gl_FragColor = color;
          }
        }
      `,
      depthTest: false,
    }),
    'tInput',
  )
}
