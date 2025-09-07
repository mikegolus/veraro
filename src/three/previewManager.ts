// previewManager.ts
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

import { BEADS } from '../beads'

import { metalMat, preloadVeraroLogo } from './materials'

import type { BeadId } from 'src/types'

/** Build just-the-bead mesh at the origin (no ground plane). */
export type BuildBeadMesh = (beadId: BeadId | '') => THREE.Object3D

type Options = {
  size?: number // square output in CSS pixels (default 96)
  dpr?: number // internal resolution multiplier (default 1)
  backgroundAlpha?: number // 0 keeps PNG/WebP transparent; default 0
  exposure?: number // tone mapping exposure; default 1.3
  cameraFov?: number // default 55
  padding?: number // how loose to frame the bead; default 1.25
  filetype?: 'image/webp' | 'image/png' // default 'image/webp'
  quality?: number // WebP quality 0..1; default 0.9
  orient?: (obj: THREE.Object3D) => void // optional: tweak per-bead orientation
}

export function createBeadPreviewManager(buildMesh: BuildBeadMesh) {
  let renderer: THREE.WebGLRenderer | null = null
  let pmrem: THREE.PMREMGenerator | null = null
  let envMap: THREE.Texture | null = null

  // Logo texture cache
  let logoTex: THREE.CanvasTexture | null = null
  let logoPromise: Promise<THREE.CanvasTexture> | null = null
  const ensureLogo = async () => {
    if (logoTex) return logoTex
    logoPromise ||= preloadVeraroLogo()
    logoTex = await logoPromise
    return logoTex
  }

  async function ensureRenderer() {
    if (renderer) return
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
      premultipliedAlpha: true,
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    pmrem = new THREE.PMREMGenerator(renderer)
    const env = new RoomEnvironment()
    envMap = pmrem.fromScene(env, 0.035).texture
  }

  function fitCameraToObject(cam: THREE.PerspectiveCamera, obj: THREE.Object3D, padding = 1.25) {
    const box = new THREE.Box3().setFromObject(obj)
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const R = sphere.radius || 0.001
    const vFov = THREE.MathUtils.degToRad(cam.fov)
    const dist = (R / Math.sin(vFov / 2)) * padding
    const dir = new THREE.Vector3(0.9, 0.9, 0.6).normalize()
    cam.position.copy(sphere.center).addScaledVector(dir, dist)
    cam.lookAt(sphere.center)
    cam.near = Math.max(0.01, dist - R * 2)
    cam.far = dist + R * 4
    cam.updateProjectionMatrix()
  }

  /** If bead is a metal cube, swap its TOP face (index 2) for a logo top. */
  async function patchLogoTopIfNeeded(beadId: BeadId, root: THREE.Object3D) {
    const bead = BEADS[beadId]
    if (!bead) return
    const isLogoCube = bead?.kind === 'cube' && bead.cubeType !== 'lava'
    if (!isLogoCube) return

    // Ensure logo texture is available
    const tex = await ensureLogo()

    // Build a *fresh* top material with the logo for this bead
    const topWithLogo = metalMat(bead, tex).top
    topWithLogo.userData = { ...(topWithLogo.userData || {}), veraroTop: true }

    // Find cube meshes and swap material index 2 (TOP)
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      const mat = obj.material as THREE.Material | THREE.Material[]

      // Only patch material arrays with at least 3 entries (our RoundedBox pattern)
      if (Array.isArray(mat) && mat.length >= 3) {
        const currentTop = mat[2] as THREE.Material
        // Skip if already patched
        if (currentTop?.userData?.veraroTop) return
        currentTop?.dispose()
        mat[2] = topWithLogo
        obj.material.needsUpdate = true
      }
    })
  }

  async function makeBeadThumbnail(
    beadId: BeadId | '',
    {
      size = 96,
      dpr = 1,
      backgroundAlpha = 0,
      exposure = 1.3,
      cameraFov = 55,
      padding = 1.25,
      filetype = 'image/webp',
      quality = 0.9,
      orient,
    }: Options = {}
  ): Promise<string> {
    await ensureRenderer()

    const resolvedPadding = BEADS[beadId]?.kind === 'cube' ? padding * 1.5 : padding

    const scene = new THREE.Scene()
    scene.environment = envMap!
    scene.environmentIntensity = 0.25
    scene.background = null

    // Lighting that reads well for metals + transmission
    const key = new THREE.DirectionalLight(0xffffff, 1.15)
    key.position.set(3, 5, 4)
    scene.add(key)
    scene.add(new THREE.AmbientLight(0xffffff, 0.35))

    // Bead mesh
    const beadObj = buildMesh(beadId)
    if (!beadObj) throw new Error(`Unknown bead id: ${beadId}`)

    // If this is a logo cube, inject the logo top before first render
    if (beadId) {
      await patchLogoTopIfNeeded(beadId, beadObj)
    }

    // Optional orientation tweak from caller
    orient?.(beadObj)
    scene.add(beadObj)

    // Camera
    const cam = new THREE.PerspectiveCamera(cameraFov, 1, 0.1, 50)
    fitCameraToObject(cam, beadObj, resolvedPadding)

    // Render → Blob URL
    renderer!.toneMappingExposure = exposure
    renderer!.setPixelRatio(dpr)
    renderer!.setSize(size, size, false)
    renderer!.setClearColor(0x000000, backgroundAlpha)
    renderer!.render(scene, cam)

    const url = await new Promise<string>((resolve) => {
      renderer!.domElement.toBlob(
        (blob) => resolve(URL.createObjectURL(blob!)),
        filetype,
        filetype === 'image/webp' ? quality : undefined
      )
    })

    // Cleanup GPU allocations for this thumbnail scene
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry?.dispose?.()
        const m = o.material as THREE.Material | THREE.Material[]
        if (Array.isArray(m)) m.forEach((mm) => mm?.dispose?.())
        else m?.dispose?.()
      }
    })

    return url
  }

  function dispose() {
    envMap?.dispose()
    pmrem?.dispose()
    renderer?.dispose()
    envMap = null
    pmrem = null
    renderer = null
  }

  return { makeBeadThumbnail, dispose }
}
