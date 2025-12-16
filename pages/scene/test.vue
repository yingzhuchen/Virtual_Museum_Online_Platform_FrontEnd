<template>
  <div id="TEST" color="#ffffff"> </div>
</template>
<script setup lang="ts">
  import { LumaSplatsThree } from '@lumaai/luma-web'
  import {
    Scene,
    Mesh,
    SphereGeometry,
    MeshPhysicalMaterial,
    FrontSide,
    WebGLRenderer,
    PerspectiveCamera,
    AmbientLight,
    BoxGeometry,
    MeshPhongMaterial,
    DirectionalLight,
    Vector3,
  } from 'three'
  import { OrbitControls } from 'three/examples/jsm/Addons.js'
  const scene = new Scene()
  let camera: PerspectiveCamera
  let renderer: WebGLRenderer
  let ctrl: OrbitControls
  onMounted(() => {
    init()
  })

  function init() {
    var ambientLight = new AmbientLight(0xffffff, 1) // 颜色为白色，强度为0.5
    // 将环境光添加到场景中
    scene.add(ambientLight)

    renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: false }) // inner splat
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 10
    ctrl = new OrbitControls(camera, renderer.domElement)
    document.getElementById('TEST')?.appendChild(renderer.domElement)

    let environmentSplats = new LumaSplatsThree({
      // Arosa Hörnli - Switzerland
      source: 'https://lumalabs.ai/capture/da82625c-9c8d-4d05-a9f7-3367ecab438c', // disable animation for lighting capture
      loadingAnimationEnabled: false, // disable three.js shader integration for performance
      enableThreeShaderIntegration: false,
    })

    scene.add(environmentSplats) // add a refractive transmissive sphere

    environmentSplats.onLoad = () => {
      environmentSplats.captureCubemap(renderer).then((capturedTexture) => {
        scene.environment = capturedTexture
        scene.background = capturedTexture
        scene.backgroundBlurriness = 0.5
      })
    }

    let globeSplats = new LumaSplatsThree({
      // Chateau de Menthon - Annecy
      source: 'https://lumalabs.ai/capture/da82625c-9c8d-4d05-a9f7-3367ecab438c',
      enableThreeShaderIntegration: true,
      onBeforeRender: (renderer) => {
        // disable MSAA on render targets (in this case the transmission render target)
        // this improves splatting performance
        let target = renderer.getRenderTarget()
        if (target) {
          target.samples = 0
        } // only render in targets and not the canvas
        globeSplats.preventDraw = target == null
        console.log(target)
      },
    }) // disable transparency so the renderer considers it an opaque object
    // opaque objects are rendered in the transmission pass (whereas transparent objects are not)

    globeSplats.material.transparent = false

    scene.add(globeSplats) // outer splat

    let glassSphere = new Mesh(
      new SphereGeometry(10, 32, 32),
      new MeshPhysicalMaterial({
        roughness: 0,
        metalness: 0,
        transmission: 1,
        ior: 1.341,
        thickness: 1.52,
        envMapIntensity: 1.2,
        clearcoat: 1,
        side: FrontSide,
        transparent: true,
      }),
    )

    scene.add(glassSphere)

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera)
      if (globeSplats.scale.x > 0) {
        globeSplats.scale.copy(globeSplats.scale.add(new Vector3(-0.001, -0.001, -0.001)))
        glassSphere.scale.copy(globeSplats.scale.add(new Vector3(-0.001, -0.001, -0.001)))
      }
      ctrl.update()
    })
  }
</script>
