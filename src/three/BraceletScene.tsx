import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

import { BEADS } from '../beads'
import { useStore } from '../store'

import {
  gemMaterial,
  metalMat,
  lavaMats,
  goldMat,
  MM_TO_UNITS,
  preloadVeraroLogo, // <-- load in component
  makeLogoAlphaTexture, // (used for slate overlay plane)
  roundedCubeGeo,
} from './materials'

import type { Bead, BeadId, SpacerBead } from '../types'

// ----------------- utils / dispose -----------------
const disposeMaterial = (m?: THREE.Material | THREE.Material[]) => {
  if (!m) return
  Array.isArray(m) ? m.forEach((mat) => mat.dispose()) : m.dispose()
}
const disposeObject = (root: THREE.Object3D) => {
  root.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.geometry.dispose()
      disposeMaterial(node.material)
    } else if (node instanceof THREE.InstancedMesh) {
      node.geometry.dispose()
      disposeMaterial(node.material)
    } else if (node instanceof THREE.Line || node instanceof THREE.LineSegments) {
      node.geometry.dispose()
      disposeMaterial(node.material)
    } else if (node instanceof THREE.Points) {
      node.geometry.dispose()
      disposeMaterial(node.material)
    } else if (node instanceof THREE.Sprite) {
      disposeMaterial(node.material)
    }
  })
}

// ---------- camera fit ----------
function stableRingRadiusUnits(bracelet: BeadId[]) {
  const Cmm = circumferenceFrom(bracelet)
  const C = Cmm * MM_TO_UNITS
  return C / (2 * Math.PI)
}
function maxBeadSizeMM(bracelet: BeadId[]) {
  let m = 6
  for (const id of bracelet) {
    const b = BEADS[id]
    if (b.kind === 'spacer') m = Math.max(m, b.sizeMM ?? 6)
    else if (b.sizeMM) m = Math.max(m, b.sizeMM)
  }
  return m
}
function computeFitDistance(
  ringRadiusUnits: number,
  maxBeadSizeMMVal: number,
  cameraAspect: number,
  cameraFov: number,
  padding = 1.25,
  extraMarginMM = 2
) {
  const beadHalf = (maxBeadSizeMMVal * MM_TO_UNITS) / 2
  const margin = (extraMarginMM * MM_TO_UNITS) / 2
  const R = ringRadiusUnits + beadHalf + margin
  const vFov = THREE.MathUtils.degToRad(cameraFov)
  const fitHeightDistance = R / Math.sin(vFov / 2)
  const fitWidthDistance = R / Math.sin(Math.atan(Math.tan(vFov / 2) * cameraAspect))
  const distance = Math.max(fitHeightDistance, fitWidthDistance) * padding
  return { distance, R }
}
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function snapCameraToDistance(
  distance: number,
  R: number,
  camera: THREE.PerspectiveCamera,
  controls?: OrbitControls
) {
  const target = controls?.target ?? new THREE.Vector3(0, 0, 0)
  const dir = new THREE.Vector3().subVectors(camera.position, target).normalize()
  camera.position.copy(target).addScaledVector(dir, distance)
  camera.near = Math.max(0.01, distance - R * 2)
  camera.far = distance + R * 4
  camera.updateProjectionMatrix()
  controls?.update()
}

function circumferenceFrom(bracelet: BeadId[]) {
  return Math.max(
    120,
    bracelet.reduce((s, id) => {
      const d = BEADS[id]
      if (d.kind === 'spacer') return s + d.thicknessMM
      return s + d.sizeMM
    }, 0)
  )
}

// ---- gem brightness RNG (unchanged) ----
const GEM_BRIGHTNESS_RANGE: Record<string, [number, number]> = {
  whitejade: [0.92, 1.08],
  malachite: [0.8, 1.2],
  larvikite: [0.8, 1.2],
  tigereye: [0.8, 1.2],
  bronzite: [0.8, 1.2],
  rubyinzoisite: [0.9, 1.1],
  quartz: [0.65, 1.2],
  mapstone: [0.8, 1.1],
  carved: [0.95, 1.05],
}
function rangeFor(id: string): [number, number] {
  const key = Object.keys(GEM_BRIGHTNESS_RANGE).find((k) => id.startsWith(k))
  return key ? GEM_BRIGHTNESS_RANGE[key] : [0.95, 1.05]
}
function randomIn([lo, hi]: [number, number]) {
  return lo + Math.random() * (hi - lo)
}

// --- Slate material w/ vignette ---
function createSlatePhysicalMaterial(opts: {
  slateMap: THREE.Texture
  uniforms: {
    uGain: { value: number }
    uRadius: { value: number }
    uFeather: { value: number }
  }
  roughness?: number
  metalness?: number
}) {
  const { slateMap, uniforms, roughness = 0.9, metalness = 0.0 } = opts
  const params: THREE.MeshPhysicalMaterialParameters = {
    map: slateMap,
    roughness,
    metalness,
    transparent: false,
    clearcoat: 0.0,
    depthWrite: true,
  }
  const mat = new THREE.MeshPhysicalMaterial(params)
  mat.userData.uniforms = uniforms
  mat.onBeforeCompile = (shader) => {
    mat.userData.shader = shader
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vWorldPos;
        `
      )
      .replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        `
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vWorldPos;
        uniform float uGain;
        uniform float uRadius;
        uniform float uFeather;
        `
      )
      .replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        float d = length(vWorldPos.xz);
        float vignette = 1.0 - smoothstep(uRadius, uRadius + uFeather, d);
        diffuseColor.rgb *= vignette * uGain;
        diffuseColor.a   *= vignette;
        `
      )
  }
  mat.envMapIntensity = 0.05
  mat.specularIntensity = 0.2
  mat.ior = 1.2
  mat.roughness = Math.min(0.98, mat.roughness + 0.05)
  mat.color.multiplyScalar(0.9)
  return mat
}

// ------------- only slate texture here -------------
const texSlate = new THREE.TextureLoader().load('/textures/slate-surface.jpg')
texSlate.wrapS = texSlate.wrapT = THREE.RepeatWrapping
texSlate.colorSpace = THREE.SRGBColorSpace
texSlate.anisotropy = 8

// -------------------- COMPONENT --------------------
export function BraceletScene() {
  const ref = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  const bracelet = useStore((s) => s.bracelet)
  const [ready, setReady] = useState(false)

  // ✅ preload Veraro logo INSIDE component, then rebuild cubes
  const logoTexRef = useRef<THREE.CanvasTexture>()
  const [logoReady, setLogoReady] = useState(false)

  useEffect(() => {
    let mounted = true
    preloadVeraroLogo().then((t) => {
      if (!mounted) return
      logoTexRef.current = t
      setLogoReady(true)
    })
    return () => {
      mounted = false
    }
  }, [])

  const texCache = useRef(new Map<string, THREE.Texture | null | undefined>()).current

  const planeMeshRef = useRef<THREE.Mesh | null>(null)
  const logoMeshRef = useRef<THREE.Mesh | null>(null)
  const planeUniformsRef = useRef({
    uGain: { value: 1.5 },
    uRadius: { value: 2.0 },
    uFeather: { value: 4.0 },
  })

  // slate overlay logo controls
  const LOGO_SCALE = 0.07
  const LOGO_OPACITY = 0.06

  // stable per-slot props (spin + brightness)
  const prevBraceletRef = useRef<BeadId[]>([])
  const slotPropsRef = useRef<Map<number, { spin: number; bright: number }>>(new Map())

  // --- CAMERA FIT STATE / ANIMATION ---
  const lastFitKeyRef = useRef<string>('')
  const firstFitDoneRef = useRef(false)
  const fitAnimRef = useRef<{
    active: boolean
    from: number
    to: number
    R: number
    start: number
    duration: number
    dir: THREE.Vector3
    target: THREE.Vector3
  } | null>(null)

  const startFitAnimation = useCallback((toDistance: number, R: number, durationMs: number) => {
    const cam = cameraRef.current
    const ctrls = controlsRef.current
    if (!cam) return

    const target = (ctrls?.target ?? new THREE.Vector3(0, 0, 0)).clone()
    const from = cam.position.distanceTo(target)
    if (durationMs <= 0 || Math.abs(toDistance - from) < 1e-4) {
      snapCameraToDistance(toDistance, R, cam, ctrls ?? undefined)
      fitAnimRef.current = null
      return
    }

    const dir = new THREE.Vector3().subVectors(cam.position, target).normalize()
    fitAnimRef.current = {
      active: true,
      from,
      to: toDistance,
      R,
      start: performance.now(),
      duration: durationMs,
      dir,
      target,
    }
  }, [])

  const doStableFit = useCallback(
    (durationMs = 450) => {
      const cam = cameraRef.current
      if (!cam) return
      const ringR = stableRingRadiusUnits(useStore.getState().bracelet)
      const maxMM = maxBeadSizeMM(useStore.getState().bracelet)
      const key = `${ringR.toFixed(4)}|${maxMM}|${cam.aspect.toFixed(4)}|${cam.fov}`
      if (lastFitKeyRef.current !== key) {
        const { distance, R } = computeFitDistance(ringR, maxMM, cam.aspect, cam.fov, 1.25, 2)
        if (!firstFitDoneRef.current) {
          startFitAnimation(distance, R, 0)
          firstFitDoneRef.current = true
        } else {
          startFitAnimation(distance, R, durationMs)
        }
        lastFitKeyRef.current = key
      }
    },
    [startFitAnimation]
  )

  useEffect(() => {
    if (!ready) return
    const prev = prevBraceletRef.current
    const map = slotPropsRef.current
    for (let idx = 0; idx < bracelet.length; idx++) {
      const id = bracelet[idx]
      if (prev[idx] !== id || !map.has(idx)) {
        const [lo, hi] = rangeFor(id)
        map.set(idx, { spin: (Math.random() * 2 - 1) * Math.PI, bright: randomIn([lo, hi]) })
      }
    }
    for (const key of Array.from(map.keys())) {
      if (key >= bracelet.length) map.delete(key)
    }
    prevBraceletRef.current = bracelet.slice()
  }, [bracelet, ready])

  // auto-update vignette radius/feather from bracelet size
  const updatePlaneFalloff = useCallback(() => {
    const uniforms = planeUniformsRef.current
    const C = circumferenceFrom(useStore.getState().bracelet) * MM_TO_UNITS
    const ringR = C / (2 * Math.PI)
    uniforms.uRadius.value = ringR * 1.35
    uniforms.uFeather.value = ringR * 2.4
  }, [])

  useEffect(() => {
    if (ready) {
      updatePlaneFalloff()
      doStableFit(450)
    }
  }, [bracelet, ready, updatePlaneFalloff, doStableFit])

  // ---------- build bracelet meshes ----------
  useEffect(() => {
    if (!groupRef.current || !sceneRef.current || !ready) return
    const group = groupRef.current

    // clear group
    while (group.children.length) {
      const obj = group.children.pop()!
      disposeObject(obj)
    }

    const circumference = circumferenceFrom(bracelet)
    const radius = (circumference / (2 * Math.PI)) * MM_TO_UNITS

    const placeSpacer = (bead: SpacerBead, ang: number) => {
      const t = bead.thicknessMM * MM_TO_UNITS
      const outerR = (bead.sizeMM / 2) * MM_TO_UNITS
      const innerR = (2 / 2) * MM_TO_UNITS
      const halfT = t / 2
      const pts: THREE.Vector2[] = []
      pts.push(new THREE.Vector2(innerR, -halfT))
      pts.push(new THREE.Vector2(outerR - halfT, -halfT))
      const steps = 64
      for (let i2 = 0; i2 <= steps; i2++) {
        const phi = -Math.PI / 2 + (i2 / steps) * Math.PI
        const r = outerR - halfT + halfT * Math.cos(phi)
        const z = halfT * Math.sin(phi)
        pts.push(new THREE.Vector2(r, z))
      }
      pts.push(new THREE.Vector2(innerR, halfT))
      const g = new THREE.LatheGeometry(pts, 256)
      g.computeVertexNormals()
      g.center()
      const mesh = new THREE.Mesh(g, goldMat)
      mesh.castShadow = true
      const tangent = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent)
      mesh.setRotationFromQuaternion(q)
      return mesh
    }

    let i = 0
    let theta = 0
    while (i < bracelet.length) {
      const id = bracelet[i]
      const bead = BEADS[id]
      const isFlat = bead.kind === 'spacer' || bead.kind === 'cube'

      if (!isFlat) {
        const along = bead.sizeMM
        const step = (along / circumference) * Math.PI * 2
        const ang = theta + step / 2
        const radial = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang)).normalize()
        const up = new THREE.Vector3(0, 1, 0)
        const tangent = new THREE.Vector3().crossVectors(up, radial).normalize()
        const pos = new THREE.Vector3().copy(radial).multiplyScalar(radius)

        const slotProps = slotPropsRef.current.get(i) || { spin: 0, bright: 1 }
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry((bead.sizeMM! * MM_TO_UNITS) / 2, 64, 64),
          gemMaterial(bead.id, slotProps.bright)
        )
        mesh.castShadow = true

        const X = new THREE.Vector3().crossVectors(tangent, radial).normalize()
        const basis = new THREE.Matrix4().makeBasis(X, tangent, radial)
        mesh.quaternion.setFromRotationMatrix(basis)
        mesh.rotateY(slotProps.spin)

        mesh.position.copy(pos)
        group.add(mesh)
        theta += step
        i += 1
        continue
      }

      // run of flat beads
      let j = i
      let totalMM = 0
      const run: Array<{ bead: Bead; id: BeadId; mm: number }> = []
      while (j < bracelet.length) {
        const d = BEADS[bracelet[j]]
        const flat = d.kind === 'spacer' || d.kind === 'cube'
        if (!flat) break
        const mm = d.kind === 'spacer' ? d.thicknessMM : d.sizeMM
        run.push({ bead: d, id: bracelet[j], mm })
        totalMM += mm
        j += 1
        if (j < bracelet.length) {
          const dn = BEADS[bracelet[j]]
          if (!(dn.kind === 'spacer' || dn.kind === 'cube')) break
        }
      }

      const mmToRad = (mm: number) => (mm / circumference) * Math.PI * 2
      const stepGroup = mmToRad(totalMM)
      const angCenter = theta + stepGroup / 2
      const firstMM = run[0].mm
      const lastMM = run[run.length - 1].mm
      const sL = firstMM * 0.5
      const sR = totalMM - lastMM * 0.5
      const angL = theta + mmToRad(sL)
      const angR = theta + mmToRad(sR)
      const PL = new THREE.Vector3(Math.cos(angL), 0, Math.sin(angL)).multiplyScalar(radius)
      const PR = new THREE.Vector3(Math.cos(angR), 0, Math.sin(angR)).multiplyScalar(radius)
      const cord = new THREE.Vector3().subVectors(PR, PL)
      const cordLen = cord.length()

      if (cordLen < 1e-6) {
        const radial = new THREE.Vector3(Math.cos(angL), 0, Math.sin(angL)).normalize()
        let mesh: THREE.Mesh
        const only = run[0]
        if (only.bead.kind === 'spacer') mesh = placeSpacer(only.bead as SpacerBead, angL)
        else {
          const size = only.bead.sizeMM * MM_TO_UNITS
          if (only.bead.cubeType === 'lava') {
            mesh = new THREE.Mesh(roundedCubeGeo(size, 0.07), lavaMats)
            mesh.castShadow = true
          } else {
            // ✅ pass logo texture (may be undefined on first build; we rebuild when ready)
            const mats = metalMat(only.bead, logoTexRef.current)
            const matArr: THREE.Material[] = [
              mats.side,
              mats.side,
              mats.top,
              mats.side,
              mats.side,
              mats.side,
            ]
            mesh = new THREE.Mesh(roundedCubeGeo(size, 0.04), matArr)
            mesh.castShadow = true
          }
          mesh.quaternion.setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(
              new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), radial).normalize(),
              new THREE.Vector3(0, 1, 0),
              radial
            )
          )
        }
        mesh.position.copy(PL)
        group.add(mesh)
        theta += stepGroup
        i = j
        continue
      }

      const cordDir = cord.clone().multiplyScalar(1 / cordLen)
      const radialCenter = new THREE.Vector3(
        Math.cos(angCenter),
        0,
        Math.sin(angCenter)
      ).normalize()
      const rightRC = new THREE.Vector3()
        .crossVectors(new THREE.Vector3(0, 1, 0), radialCenter)
        .normalize()
      const basis = new THREE.Matrix4().makeBasis(rightRC, new THREE.Vector3(0, 1, 0), radialCenter)

      let acc = 0
      for (let k = 0; k < run.length; k++) {
        const r = run[k]
        const centerFromStart = acc + r.mm * 0.5
        const t = (centerFromStart - sL) / Math.max(1e-6, sR - sL)
        const pos = new THREE.Vector3().copy(PL).addScaledVector(cordDir, t * cordLen)

        let mesh: THREE.Mesh
        if (r.bead.kind === 'spacer') {
          const tmm = (r.bead as SpacerBead).thicknessMM * MM_TO_UNITS
          const outerR = ((r.bead as SpacerBead).sizeMM! / 2) * MM_TO_UNITS
          const innerR = (2 / 2) * MM_TO_UNITS
          const halfT = tmm / 2
          const pts: THREE.Vector2[] = []
          pts.push(new THREE.Vector2(innerR, -halfT))
          pts.push(new THREE.Vector2(outerR - halfT, -halfT))
          const steps = 64
          for (let i2 = 0; i2 <= steps; i2++) {
            const phi = -Math.PI / 2 + (i2 / steps) * Math.PI
            const rr = outerR - halfT + halfT * Math.cos(phi)
            const zz = halfT * Math.sin(phi)
            pts.push(new THREE.Vector2(rr, zz))
          }
          pts.push(new THREE.Vector2(innerR, halfT))
          const g = new THREE.LatheGeometry(pts, 256)
          g.computeVertexNormals()
          g.center()
          mesh = new THREE.Mesh(g, goldMat)
          mesh.castShadow = true
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), cordDir)
          mesh.setRotationFromQuaternion(q)
        } else {
          const size = r.bead.sizeMM * MM_TO_UNITS
          if (r.bead.cubeType === 'lava') {
            mesh = new THREE.Mesh(roundedCubeGeo(size, 0.07), lavaMats)
            mesh.castShadow = true
          } else {
            // ✅ pass logo texture
            const mats = metalMat(r.bead, logoTexRef.current)
            const matArr: THREE.Material[] = [
              mats.side,
              mats.side,
              mats.top,
              mats.side,
              mats.side,
              mats.side,
            ]
            mesh = new THREE.Mesh(roundedCubeGeo(size, 0.04), matArr)
            mesh.castShadow = true
          }
          mesh.quaternion.setFromRotationMatrix(basis)
        }

        mesh.position.copy(pos)
        group.add(mesh)
        acc += r.mm
      }

      theta += stepGroup
      i = j
    }

    doStableFit(450)
    // 👇 rebuild when logo mask becomes available
  }, [bracelet, ready, doStableFit, logoReady])

  // ---------------- scene setup ----------------
  useEffect(() => {
    const el = ref.current!
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#000')
    sceneRef.current = scene

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.85
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = new RoomEnvironment()
    const envMap = pmrem.fromScene(env, 0.04).texture
    scene.environment = envMap
    scene.environmentIntensity = 0.09

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    cameraRef.current = camera
    camera.position.set(0.9, 0.9, 0.6)

    // Lights
    const key = new THREE.DirectionalLight(0xffffff, 1.5)
    key.position.set(3, 5, 4)
    key.castShadow = true
    key.shadow.bias = -0.0005
    key.shadow.radius = 4
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -12
    key.shadow.camera.right = 12
    key.shadow.camera.top = 12
    key.shadow.camera.bottom = -12
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 30
    scene.add(key)

    const rim = new THREE.DirectionalLight(0xffffff, 1.0)
    rim.position.set(-4, 3, -2)
    scene.add(rim)
    scene.add(new THREE.AmbientLight(0xffffff, 0.45))

    const group = new THREE.Group()
    scene.add(group)
    groupRef.current = group

    // SLATE PLANE
    const PLANE_SIZE = 50
    const planeGeo = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 1, 1)
    planeGeo.rotateX(-Math.PI / 2)
    texSlate.wrapS = texSlate.wrapT = THREE.RepeatWrapping
    texSlate.repeat.set(10, 10)
    texSlate.needsUpdate = true

    const slateMat = createSlatePhysicalMaterial({
      slateMap: texSlate,
      uniforms: planeUniformsRef.current,
      roughness: 0.9,
      metalness: 0.0,
    })

    const plane = new THREE.Mesh(planeGeo, slateMat)
    plane.receiveShadow = true
    plane.castShadow = false
    plane.renderOrder = -1
    plane.position.y = -(10 * MM_TO_UNITS) * 0.5
    scene.add(plane)
    planeMeshRef.current = plane

    // Centered subdued Veraro logo on slate
    ;(async () => {
      try {
        const logoSize = PLANE_SIZE * LOGO_SCALE
        const logoGeo = new THREE.PlaneGeometry(logoSize, logoSize, 1, 1)
        logoGeo.rotateX(-Math.PI / 2)
        logoGeo.rotateY(1)

        const logoMat = new THREE.MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: LOGO_OPACITY,
          depthWrite: false,
          depthTest: true,
        })

        const overlayTex =
          (texCache.get('veraroLogoAlpha') as THREE.Texture | undefined) ||
          (await makeLogoAlphaTexture(1024, 0.06))
        texCache.set('veraroLogoAlpha', overlayTex)
        logoMat.map = overlayTex
        logoMat.needsUpdate = true

        const logo = new THREE.Mesh(logoGeo, logoMat)
        logo.position.set(0, plane.position.y + 0.0005, 0) // avoid z-fighting
        logo.renderOrder = -0.5
        scene.add(logo)
        logoMeshRef.current = logo
      } catch (e) {
        console.warn('Logo overlay failed:', e)
      }
    })()

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controlsRef.current = controls
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(0, 0, 0)
    controls.enableZoom = false
    controls.enablePan = false
    controls.minPolarAngle = 0.2
    controls.maxPolarAngle = Math.PI / 2 - 0.12

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      doStableFit(300)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    // Init vignette from bracelet & first (snapped) fit
    const C0 = circumferenceFrom(useStore.getState().bracelet) * MM_TO_UNITS
    const r0 = C0 / (2 * Math.PI)
    planeUniformsRef.current.uRadius.value = r0 * 1.35
    planeUniformsRef.current.uFeather.value = r0 * 2.4
    plane.position.y = -(Math.max(6, 10) * MM_TO_UNITS) * 0.5
    doStableFit(0)

    let raf = 0
    const tick = () => {
      const cam = cameraRef.current
      const ctrls = controlsRef.current
      const anim = fitAnimRef.current
      if (cam && anim && anim.active) {
        const now = performance.now()
        const t = Math.min(1, (now - anim.start) / anim.duration)
        const k = easeInOutCubic(t)
        const dist = THREE.MathUtils.lerp(anim.from, anim.to, k)
        cam.position.copy(anim.target).addScaledVector(anim.dir, dist)
        cam.near = Math.max(0.01, dist - anim.R * 2)
        cam.far = dist + anim.R * 4
        cam.updateProjectionMatrix()
        if (t >= 1) anim.active = false
      }
      ctrls?.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    setReady(true)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      pmrem.dispose()
      renderer.dispose()
      el.removeChild(renderer.domElement)
      if (logoMeshRef.current) {
        disposeObject(logoMeshRef.current)
        logoMeshRef.current = null
      }
      if (planeMeshRef.current) {
        disposeObject(planeMeshRef.current)
        planeMeshRef.current = null
      }
    }
  }, [doStableFit, texCache])

  // Keep plane (and slate logo) just under beads
  useEffect(() => {
    if (!ready || !planeMeshRef.current) return
    let maxSizeMM = 10
    for (const id of bracelet) {
      const b = BEADS[id]
      if (b.kind === 'spacer') maxSizeMM = Math.max(maxSizeMM, b.sizeMM ?? 6)
      else if (b.sizeMM) maxSizeMM = Math.max(maxSizeMM, b.sizeMM)
    }
    planeMeshRef.current.position.y = -(maxSizeMM * MM_TO_UNITS) * 0.5
    if (logoMeshRef.current) {
      logoMeshRef.current.position.y = planeMeshRef.current.position.y + 0.0005
    }
  }, [bracelet, ready])

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}
