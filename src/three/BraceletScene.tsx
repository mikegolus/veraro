import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

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

function fitCameraToGroup(
  group: THREE.Group,
  camera: THREE.PerspectiveCamera,
  controls?: OrbitControls,
  padding: number = 1.3
) {
  const box = new THREE.Box3().setFromObject(group)
  if (!isFinite(box.min.x) || !isFinite(box.max.x)) return
  const size = new THREE.Vector3()
  box.getSize(size)
  const center = new THREE.Vector3()
  box.getCenter(center)
  const radius = 0.5 * Math.max(size.x, size.y, size.z)

  const vFov = THREE.MathUtils.degToRad(camera.fov)
  const fitHeightDistance = radius / Math.sin(vFov / 2)
  const fitWidthDistance = radius / Math.sin(Math.atan(Math.tan(vFov / 2) * camera.aspect))
  const distance = Math.max(fitHeightDistance, fitWidthDistance) * padding

  // Move camera along its current direction, keep target at center
  const dir = new THREE.Vector3()
    .subVectors(camera.position, controls?.target ?? center)
    .normalize()
  camera.position.copy(center).addScaledVector(dir, distance)
  camera.near = Math.max(0.01, distance - radius * 2)
  camera.far = distance + radius * 4
  camera.updateProjectionMatrix()
  controls && (controls.target.copy(center), controls.update())
}

import { BEADS } from '../beads'
import { useStore } from '../store'

import type { Bead, BeadId, SpacerBead } from '../types'

const MM_TO_UNITS = 0.1 // 10mm -> 1 unit

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

// Bronzite texture from image
const texBronzite = new THREE.TextureLoader().load('/textures/bronzite.jpg')
texBronzite.wrapS = texBronzite.wrapT = THREE.RepeatWrapping
texBronzite.colorSpace = THREE.SRGBColorSpace

const bmBronzite = new THREE.TextureLoader().load('/textures/bronzite-bump-map.jpg')
bmBronzite.wrapS = bmBronzite.wrapT = THREE.RepeatWrapping

const texMalachite = new THREE.TextureLoader().load('/textures/malachite.jpg')
texMalachite.wrapS = texMalachite.wrapT = THREE.RepeatWrapping
texMalachite.colorSpace = THREE.SRGBColorSpace

const texTigerEye = new THREE.TextureLoader().load('/textures/tigereye.jpg')
texTigerEye.wrapS = texTigerEye.wrapT = THREE.RepeatWrapping
texTigerEye.colorSpace = THREE.SRGBColorSpace

const texMapstone = new THREE.TextureLoader().load('/textures/mapstone.jpg')
texMapstone.wrapS = texMapstone.wrapT = THREE.RepeatWrapping
texMapstone.colorSpace = THREE.SRGBColorSpace

const texWhiteJade = new THREE.TextureLoader().load('/textures/white-jade.jpg')
texWhiteJade.wrapS = texWhiteJade.wrapT = THREE.RepeatWrapping
texWhiteJade.colorSpace = THREE.SRGBColorSpace

const tmWhiteJade = new THREE.TextureLoader().load('/textures/white-jade-transmission-map.jpg')
tmWhiteJade.wrapS = tmWhiteJade.wrapT = THREE.RepeatWrapping

const texLavastone = new THREE.TextureLoader().load('/textures/lavastone.jpg')
texLavastone.wrapS = texLavastone.wrapT = THREE.RepeatWrapping
texLavastone.colorSpace = THREE.SRGBColorSpace
const bmLavastone = new THREE.TextureLoader().load('/textures/lavastone-bump-map.jpg')
bmLavastone.wrapS = bmLavastone.wrapT = THREE.RepeatWrapping
const rmLavastone = new THREE.TextureLoader().load('/textures/lavastone-roughness-map.jpg')
rmLavastone.wrapS = rmLavastone.wrapT = THREE.RepeatWrapping

const bmBlackMetal = new THREE.TextureLoader().load('/textures/blackmetal-bump-map.jpg')
bmBlackMetal.wrapS = bmBlackMetal.wrapT = THREE.RepeatWrapping

const texAntiqueBrass = new THREE.TextureLoader().load('/textures/antiquebrass.jpg')
texAntiqueBrass.wrapS = texAntiqueBrass.wrapT = THREE.RepeatWrapping
texAntiqueBrass.colorSpace = THREE.SRGBColorSpace
const bmScratches = new THREE.TextureLoader().load('/textures/scratches-bump-map.jpg')
bmScratches.wrapS = bmScratches.wrapT = THREE.RepeatWrapping

const texRubyZoisite = new THREE.TextureLoader().load('/textures/rubyzoisite.jpg')
texRubyZoisite.wrapS = texRubyZoisite.wrapT = THREE.RepeatWrapping
texRubyZoisite.colorSpace = THREE.SRGBColorSpace

const texQuartz = new THREE.TextureLoader().load('/textures/quartz.jpg')
texQuartz.wrapS = texQuartz.wrapT = THREE.RepeatWrapping
texQuartz.colorSpace = THREE.SRGBColorSpace

const bmSparkle = new THREE.TextureLoader().load('/textures/sparkle-bump-map.jpg')
bmSparkle.wrapS = bmSparkle.wrapT = THREE.RepeatWrapping

const dmCarved = new THREE.TextureLoader().load('/textures/carved-displacement-map.jpg')
dmCarved.wrapS = dmCarved.wrapT = THREE.RepeatWrapping

const bmCarved = new THREE.TextureLoader().load('/textures/carved-bump-map.jpg')
bmCarved.wrapS = bmCarved.wrapT = THREE.RepeatWrapping

const texLarvikite = new THREE.TextureLoader().load('/textures/larvikite.jpg')
texLarvikite.wrapS = texLarvikite.wrapT = THREE.RepeatWrapping
texLarvikite.colorSpace = THREE.SRGBColorSpace

// --- Brightness ranges per gem family (edit to taste) ---
const GEM_BRIGHTNESS_RANGE: Record<string, [number, number]> = {
  whitejade: [0.92, 1.08],
  malachite: [0.8, 1.2],
  larvikite: [0.8, 1.2],
  tigereye: [0.8, 1.2],
  bronzite: [0.8, 1.2],
  rubyzoisite: [0.9, 1.1],
  quartz: [0.65, 1.25],
  mapstone: [0.8, 1.1],
  carved: [0.95, 1.05], // color-based; mild variance if desired
  // onyx is pure color — left constant by default
}
function rangeFor(id: string): [number, number] {
  const key = Object.keys(GEM_BRIGHTNESS_RANGE).find((k) => id.startsWith(k))
  return key ? GEM_BRIGHTNESS_RANGE[key] : [0.95, 1.05]
}
function randomIn([lo, hi]: [number, number]) {
  return lo + Math.random() * (hi - lo)
}

// Thickness map texture
function makeThicknessMap(size = 512) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  // Very soft noise: big blobs, no harsh edges
  g.fillStyle = '#ccc'
  g.fillRect(0, 0, size, size)
  // 3–4 passes of large, faint blotches
  for (let i = 0; i < 4; i++) {
    const r = size * (0.18 + i * 0.12)
    g.globalAlpha = 0.08 + i * 0.04
    const grd = g.createRadialGradient(r, r, r * 0.2, r, r, r)
    grd.addColorStop(0, '#fff')
    grd.addColorStop(1, '#888')
    g.fillStyle = grd
    g.beginPath()
    g.arc(r, r, r, 0, Math.PI * 2)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}

function sphereGeoMM(dmm: number) {
  return new THREE.SphereGeometry((dmm * MM_TO_UNITS) / 2, 64, 64)
}

function createLogoTopMaterial(
  baseColor: string,
  logoColor: string,
  metalness = 1.0,
  roughness = 0.5,
  bumpMap: THREE.Texture | null
) {
  const s = 1024
  const cnv = document.createElement('canvas')
  cnv.width = cnv.height = s
  const g = cnv.getContext('2d')!
  // brushed background
  g.fillStyle = baseColor
  g.fillRect(0, 0, s, s)
  g.globalAlpha = 0.08
  for (let y = 0; y < s; y += 2) {
    g.fillStyle = 'rgba(255,255,255,0.05)'
    g.fillRect(0, y, s, 1)
  }
  g.globalAlpha = 1.0

  const tex = new THREE.CanvasTexture(cnv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    metalness,
    roughness,
    bumpMap,
    bumpScale: 0.35,
  })

  ;(async () => {
    try {
      const res = await fetch('/veraro-logo.svg')
      const svgText = await res.text()
      const mask = document.createElement('canvas')
      mask.width = mask.height = s
      const mg = mask.getContext('2d')!
      const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }))
      const img = new Image()
      img.onload = () => {
        const m = s * 0.08,
          w = s - m * 2,
          h = w
        mg.clearRect(0, 0, s, s)
        mg.save()
        mg.translate(s / 2, s / 2)
        mg.drawImage(img, -w / 2, -h / 2, w, h)
        mg.restore()
        mg.globalCompositeOperation = 'source-in'
        mg.fillStyle = logoColor
        mg.fillRect(0, 0, s, s)
        mg.globalCompositeOperation = 'source-over'
        g.drawImage(mask, 0, 0)
        URL.revokeObjectURL(url)
        tex.needsUpdate = true
      }
      img.onerror = () => {
        console.warn('Logo SVG failed to load')
      }
      img.src = url
    } catch (e) {
      console.warn('Logo load error', e)
    }
  })()

  return mat
}

export function BraceletScene() {
  const ref = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const bracelet = useStore((s) => s.bracelet)
  const [ready, setReady] = useState(false)
  const texCache = useRef(new Map<string, THREE.Texture | null | undefined>()).current

  // --- NEW: persistent per-slot random properties (spin around pole + brightness) ---
  const prevBraceletRef = useRef<BeadId[]>([])
  const slotPropsRef = useRef<Map<number, { spin: number; bright: number }>>(new Map())

  useEffect(() => {
    if (!ready) return
    const prev = prevBraceletRef.current
    const map = slotPropsRef.current

    for (let idx = 0; idx < bracelet.length; idx++) {
      const id = bracelet[idx]
      if (prev[idx] !== id || !map.has(idx)) {
        const [lo, hi] = rangeFor(id)
        map.set(idx, {
          spin: (Math.random() * 2 - 1) * Math.PI, // stable spin for this slot
          bright: randomIn([lo, hi]), // stable brightness for this slot
        })
      }
    }
    // Drop stale slots if array is shorter now
    for (const key of Array.from(map.keys())) {
      if (key >= bracelet.length) map.delete(key)
    }

    prevBraceletRef.current = bracelet.slice()
  }, [bracelet, ready])

  useEffect(() => {
    if (!ready || !groupRef.current || !cameraRef.current) return
    const g = groupRef.current
    const cam = cameraRef.current
    const ctrls = controlsRef.current || undefined
    requestAnimationFrame(() => fitCameraToGroup(g, cam, ctrls, 1.25))
  }, [bracelet, ready])

  useEffect(() => {
    if (!groupRef.current || !sceneRef.current || !ready) return
    const group = groupRef.current

    while (group.children.length) {
      const obj = group.children.pop()!
      disposeObject(obj)
    }

    const circumference = circumferenceFrom(bracelet)
    const radius = (circumference / (2 * Math.PI)) * MM_TO_UNITS
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#d4af37'),
      metalness: 1.0,
      roughness: 0.18,
    })

    // helpers
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
      const tangent = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)).normalize()
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent)
      mesh.setRotationFromQuaternion(q)
      return mesh
    }

    // CHANGE: gemMaterial now accepts `bright` to modulate instance brightness
    const gemMaterial = (id: string, bright = 1) => {
      const thicknessMap =
        texCache.get('wj-thick') || texCache.set('wj-thick', makeThicknessMap()).get('wj-thick')

      if (id.startsWith('whitejade')) {
        const sizeMM = BEADS['whitejade-10'].sizeMM
        const thicknessUnits = sizeMM * MM_TO_UNITS * 0.5 // ~50% of diameter as optical thickness
        const m = new THREE.MeshPhysicalMaterial({
          map: texWhiteJade,
          roughness: 0.32,
          metalness: 0.0,
          transmission: 0.78,
          transmissionMap: tmWhiteJade,
          ior: 1.35,
          thickness: thicknessUnits,
          thicknessMap,
          attenuationColor: '#eef7f1',
          attenuationDistance: 0.16,
          clearcoat: 1.0,
          clearcoatRoughness: 0.2,
          envMapIntensity: 2.2,
        })
        m.color.setScalar(bright)
        return m
      }

      if (id.startsWith('malachite')) {
        const m = new THREE.MeshPhysicalMaterial({
          map: texMalachite,
          metalness: 0,
          roughness: 0.14,
          clearcoat: 0.12,
          clearcoatRoughness: 0.3,
          ior: 1.7,
          envMapIntensity: 0,
        })
        m.color.setScalar(bright)
        return m
      }

      if (id.startsWith('larvikite')) {
        const sizeMM = BEADS['larvikite-10'].sizeMM
        const thicknessUnits = sizeMM * MM_TO_UNITS * 0.5
        const m = new THREE.MeshPhysicalMaterial({
          map: texLarvikite,
          metalness: 0,
          roughness: 0,
          ior: 1.8,
          transmission: 0.09,
          thickness: thicknessUnits * 2.0,
          thicknessMap,
          attenuationColor: '#a2c4e0ff',
          attenuationDistance: 0.16,
          clearcoat: 0.6,
          clearcoatRoughness: 1,
          envMapIntensity: 0,
        })
        m.color.setScalar(bright)
        return m
      }

      if (id.startsWith('tigereye')) {
        const sizeMM = BEADS['tigereye-10'].sizeMM
        const thicknessUnits = sizeMM * MM_TO_UNITS * 0.5
        const m = new THREE.MeshPhysicalMaterial({
          map: texTigerEye,
          metalness: 0,
          roughness: 0.14,
          ior: 1.7,
          transmission: 0.72,
          thickness: thicknessUnits * 2.0,
          thicknessMap,
          attenuationColor: '#f7f4eeff',
          attenuationDistance: 0.16,
          clearcoat: 1.0,
          clearcoatRoughness: 0.2,
          envMapIntensity: 0,
        })
        m.color.setScalar(bright)
        return m
      }

      if (id.startsWith('bronzite')) {
        const m = new THREE.MeshPhysicalMaterial({
          map: texBronzite,
          metalness: 0.0,
          roughness: 0.45,
          clearcoat: 0.2,
          clearcoatRoughness: 0.65,
          ior: 0.72,
          bumpMap: bmBronzite,
          bumpScale: 0.3,
          envMapIntensity: 0.7,
        })
        m.color.setScalar(bright)
        return m
      }

      if (id.startsWith('rubyzoisite')) {
        const m = new THREE.MeshPhysicalMaterial({
          map: texRubyZoisite,
          metalness: 0.0,
          roughness: 0.25,
          clearcoat: 0.6,
          clearcoatRoughness: 0.2,
          ior: 0.8,
          bumpMap: bmSparkle,
          bumpScale: -1.5,
          envMapIntensity: 1,
        })
        m.color.setScalar(bright)
        return m
      }

      if (id.startsWith('quartz')) {
        const m = new THREE.MeshPhysicalMaterial({
          map: texQuartz,
          metalness: 0.0,
          roughness: 0.22,
          clearcoat: 0.6,
          clearcoatRoughness: 0.17,
          ior: 0.8,
          bumpMap: bmSparkle,
          bumpScale: -1,
          envMapIntensity: 1,
        })
        m.color.setScalar(bright)
        return m
      }

      if (id.startsWith('mapstone')) {
        const m = new THREE.MeshPhysicalMaterial({
          map: texMapstone,
          metalness: 0.0,
          roughness: 0.8,
          clearcoat: 0.1,
          clearcoatRoughness: 0.65,
          ior: 0.65,
          envMapIntensity: 1,
        })
        m.color.setScalar(bright)
        return m
      }

      if (id.startsWith('onyx')) {
        // Pure color (no map) — left consistent; opt-in brightness if desired.
        return new THREE.MeshPhysicalMaterial({
          color: 0x000000,
          metalness: 0.5,
          roughness: 0.4,
          clearcoat: 0.4,
          clearcoatRoughness: 0.6,
          ior: 1.3,
        })
      }

      if (id.startsWith('carved')) {
        const m = new THREE.MeshPhysicalMaterial({
          color: 0x181818,
          displacementMap: dmCarved,
          displacementScale: 0.12,
          displacementBias: -0.06,
          bumpMap: bmCarved,
          bumpScale: 2,
          metalness: 0.1,
          roughness: 0.4,
          clearcoat: 0.3,
          clearcoatRoughness: 0.4,
          ior: 1.4,
        })
        // m.color.multiplyScalar(bright) // enable if you want carved variance too
        return m
      }
    }

    const roundedCubeGeo = (size: number, radius: number) => {
      return new RoundedBoxGeometry(size, size, size, 4, size * radius)
    }

    const lavaMats = (() => {
      return new THREE.MeshPhysicalMaterial({
        map: texLavastone,
        bumpMap: bmLavastone,
        bumpScale: 2,
        roughnessMap: rmLavastone,
        roughness: 0.86,
        metalness: 0.54,
      })
    })()

    const metalMat = (bead: Bead) => {
      const isStainless = bead.metalKind === 'stainless'
      const base =
        bead.metalKind === 'brass'
          ? '#393228'
          : bead.metalKind === 'black'
            ? '#222222'
            : isStainless
              ? '#d9dbde'
              : '#8a8d90'
      const rough =
        bead.metalKind === 'black'
          ? 0.7
          : bead.metalKind === 'brass'
            ? 0.6
            : isStainless
              ? 0.12
              : 0.45
      const side = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(base),
        metalness: 1.0,
        roughness: rough,
        bumpMap:
          bead.metalKind === 'black'
            ? bmBlackMetal
            : bead.metalKind === 'brass'
              ? bmScratches
              : null,
        bumpScale: 0.35,
      })
      if (isStainless) side.envMapIntensity = 1.4
      const top = createLogoTopMaterial(
        base,
        bead.logoColor || '#d4af37',
        bead.metalKind === 'black' ? 0.88 : 1.0,
        rough,
        bead.metalKind === 'black' ? bmBlackMetal : bead.metalKind === 'brass' ? bmScratches : null
      )
      if (isStainless) top.envMapIntensity = 1.4
      return { side, top }
    }

    // Iterate through bracelet with grouping for adjacent 'flat' beads (spacer/cube)
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
        const tangent = new THREE.Vector3().crossVectors(up, radial).normalize() // along cord
        const pos = new THREE.Vector3().copy(radial).multiplyScalar(radius)
        // --- stable per-slot props
        const slotProps = slotPropsRef.current.get(i) || { spin: 0, bright: 1 }

        const mesh = new THREE.Mesh(
          sphereGeoMM(bead.sizeMM!),
          gemMaterial(bead.id, slotProps.bright)
        )
        // Align sphere Y-axis (UV poles) to the cord/tangent so poles sit between beads
        const X = new THREE.Vector3().crossVectors(tangent, radial).normalize() // completes orthonormal basis
        const basis = new THREE.Matrix4().makeBasis(X, tangent, radial)
        mesh.quaternion.setFromRotationMatrix(basis)
        // Stable random spin around the pole axis to avoid uniform look
        mesh.rotateY(slotProps.spin)

        mesh.position.copy(pos)
        group.add(mesh)
        theta += step
        i += 1
        continue
      }

      // group run of flat beads
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

      // First/last *center* angles from start of group
      const firstMM = run[0].mm
      const lastMM = run[run.length - 1].mm
      const sL = firstMM * 0.5
      const sR = totalMM - lastMM * 0.5
      const angL = theta + mmToRad(sL)
      const angR = theta + mmToRad(sR)

      // Endpoints for centers on the circle
      const PL = new THREE.Vector3(Math.cos(angL), 0, Math.sin(angL)).multiplyScalar(radius)
      const PR = new THREE.Vector3(Math.cos(angR), 0, Math.sin(angR)).multiplyScalar(radius)

      // Cord direction and basis
      const cord = new THREE.Vector3().subVectors(PR, PL)
      const cordLen = cord.length()
      if (cordLen < 1e-6) {
        // Single flat bead fallback: place on arc
        const radial = new THREE.Vector3(Math.cos(angL), 0, Math.sin(angL)).normalize()
        let mesh: THREE.Mesh
        const only = run[0]
        if (only.bead.kind === 'spacer') mesh = placeSpacer(only.bead, angL)
        else {
          const size = only.bead.sizeMM * MM_TO_UNITS
          if (only.bead.cubeType === 'lava')
            mesh = new THREE.Mesh(roundedCubeGeo(size, 0.07), lavaMats)
          else {
            const mats = metalMat(only.bead)
            const matArr: THREE.Material[] = [
              mats.side,
              mats.side,
              mats.top,
              mats.side,
              mats.side,
              mats.side,
            ]
            mesh = new THREE.Mesh(roundedCubeGeo(size, 0.04), matArr)
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

      // Orientation for cubes within run
      const radialCenter = new THREE.Vector3(
        Math.cos(angCenter),
        0,
        Math.sin(angCenter)
      ).normalize()
      const rightRC = new THREE.Vector3()
        .crossVectors(new THREE.Vector3(0, 1, 0), radialCenter)
        .normalize()
      const basis = new THREE.Matrix4().makeBasis(rightRC, new THREE.Vector3(0, 1, 0), radialCenter)

      // Distribute bead centers by true mm spacing *linearly* along cord [PL..PR]
      let acc = 0
      for (let k = 0; k < run.length; k++) {
        const r = run[k]
        const centerFromStart = acc + r.mm * 0.5
        const t = (centerFromStart - sL) / Math.max(1e-6, sR - sL)
        const pos = new THREE.Vector3().copy(PL).addScaledVector(cordDir, t * cordLen)

        let mesh: THREE.Mesh
        if (r.bead.kind === 'spacer') {
          // build washer, then override rotation to align axis with cord
          const tmm = r.bead.thicknessMM * MM_TO_UNITS
          const outerR = (r.bead.sizeMM! / 2) * MM_TO_UNITS
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
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), cordDir)
          mesh.setRotationFromQuaternion(q)
        } else {
          const size = r.bead.sizeMM * MM_TO_UNITS
          if (r.bead.cubeType === 'lava') {
            mesh = new THREE.Mesh(roundedCubeGeo(size, 0.07), lavaMats)
          } else {
            const mats = metalMat(r.bead)
            const matArr: THREE.Material[] = [
              mats.side,
              mats.side,
              mats.top,
              mats.side,
              mats.side,
              mats.side,
            ]
            mesh = new THREE.Mesh(roundedCubeGeo(size, 0.04), matArr)
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
  }, [bracelet, ready, texCache])

  useEffect(() => {
    const el = ref.current!
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#000')
    sceneRef.current = scene

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = new RoomEnvironment()
    const envMap = pmrem.fromScene(env, 0.04).texture
    scene.environment = envMap
    scene.environmentIntensity = 0.08

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
    cameraRef.current = camera
    camera.position.set(0.9, 0.9, 0.6)

    const key = new THREE.DirectionalLight(0xffffff, 1.8)
    key.position.set(3, 5, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffffff, 1.1)
    rim.position.set(-4, 3, -2)
    scene.add(rim)
    scene.add(new THREE.AmbientLight(0xffffff, 0.52))

    const group = new THREE.Group()
    scene.add(group)
    groupRef.current = group

    const controls = new OrbitControls(camera, renderer.domElement)
    controlsRef.current = controls
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(0, 0, 0)

    controls.enableZoom = false
    controls.enablePan = false
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let raf = 0
    const tick = () => {
      controls.update()
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
    }
  }, [])

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}
