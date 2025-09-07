import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

import { BEADS } from '../beads'

import type { Bead } from '../types'

// ------------ constants ------------
export const MM_TO_UNITS = 0.1 // 10mm -> 1 unit

// ------------ texture loader (singleton) ------------
const loader = new THREE.TextureLoader()

// ------------ textures (singleton instances) ------------
const texBronzite = loader.load('/textures/bronzite.jpg')
texBronzite.wrapS = texBronzite.wrapT = THREE.RepeatWrapping
texBronzite.colorSpace = THREE.SRGBColorSpace

const bmBronzite = loader.load('/textures/bronzite-bump-map.jpg')
bmBronzite.wrapS = bmBronzite.wrapT = THREE.RepeatWrapping

const texMalachite = loader.load('/textures/malachite.jpg')
texMalachite.wrapS = texMalachite.wrapT = THREE.RepeatWrapping
texMalachite.colorSpace = THREE.SRGBColorSpace

const texTigerEye = loader.load('/textures/tigereye.jpg')
texTigerEye.wrapS = texTigerEye.wrapT = THREE.RepeatWrapping
texTigerEye.colorSpace = THREE.SRGBColorSpace

const texMapstone = loader.load('/textures/mapstone.jpg')
texMapstone.wrapS = texMapstone.wrapT = THREE.RepeatWrapping
texMapstone.colorSpace = THREE.SRGBColorSpace

const texWhiteJade = loader.load('/textures/white-jade.jpg')
texWhiteJade.wrapS = texWhiteJade.wrapT = THREE.RepeatWrapping
texWhiteJade.colorSpace = THREE.SRGBColorSpace
// Optional: transmission map if you want it later
// const tmWhiteJade = loader.load('/textures/white-jade-transmission-map.jpg')

const texLavastone = loader.load('/textures/lavastone.jpg')
texLavastone.wrapS = texLavastone.wrapT = THREE.RepeatWrapping
texLavastone.colorSpace = THREE.SRGBColorSpace
const bmLavastone = loader.load('/textures/lavastone-bump-map.jpg')
bmLavastone.wrapS = bmLavastone.wrapT = THREE.RepeatWrapping
const rmLavastone = loader.load('/textures/lavastone-roughness-map.jpg')
rmLavastone.wrapS = rmLavastone.wrapT = THREE.RepeatWrapping

const bmBlackMetal = loader.load('/textures/blackmetal-bump-map.jpg')
bmBlackMetal.wrapS = bmBlackMetal.wrapT = THREE.RepeatWrapping

const bmScratches = loader.load('/textures/scratches-bump-map.jpg')
bmScratches.wrapS = bmScratches.wrapT = THREE.RepeatWrapping

const texRubyZoisite = loader.load('/textures/rubyzoisite.jpg')
texRubyZoisite.wrapS = texRubyZoisite.wrapT = THREE.RepeatWrapping
texRubyZoisite.colorSpace = THREE.SRGBColorSpace

const texQuartz = loader.load('/textures/quartz.jpg')
texQuartz.wrapS = texQuartz.wrapT = THREE.RepeatWrapping
texQuartz.colorSpace = THREE.SRGBColorSpace

const bmSparkle = loader.load('/textures/sparkle-bump-map.jpg')
bmSparkle.wrapS = bmSparkle.wrapT = THREE.RepeatWrapping

const dmCarved = loader.load('/textures/carved-displacement-map.jpg')
dmCarved.wrapS = dmCarved.wrapT = THREE.RepeatWrapping

const bmCarved = loader.load('/textures/carved-bump-map.jpg')
bmCarved.wrapS = bmCarved.wrapT = THREE.RepeatWrapping

const texLarvikite = loader.load('/textures/larvikite.jpg')
texLarvikite.wrapS = texLarvikite.wrapT = THREE.RepeatWrapping
texLarvikite.colorSpace = THREE.SRGBColorSpace

// ------------ helpers ------------
function makeThicknessMap(size = 512) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = '#ccc'
  g.fillRect(0, 0, size, size)
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
const thicknessMap = makeThicknessMap()

let _logoTexPromise: Promise<THREE.CanvasTexture> | null = null

export async function makeLogoAlphaTexture(size = 1024, padding = 0.06) {
  const res = await fetch('/veraro-logo.svg')
  const svg = await res.text()

  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  await new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const m = size * padding,
        w = size - m * 2
      g.clearRect(0, 0, size, size)
      g.drawImage(img, m, m, w, w)
      // force to white so material color / opacity can tint later
      g.globalCompositeOperation = 'source-in'
      g.fillStyle = '#fff'
      g.fillRect(0, 0, size, size)
      g.globalCompositeOperation = 'source-over'
      URL.revokeObjectURL(url)
      resolve()
    }
    img.onerror = reject
    img.src = url
  })
  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

export function preloadVeraroLogo() {
  if (!_logoTexPromise) _logoTexPromise = makeLogoAlphaTexture()
  return _logoTexPromise
}

function createLogoTopMaterial(
  baseColor: string,
  logoColor: string,
  metalness = 1.0,
  roughness = 0.5,
  bumpMap: THREE.Texture | null,
  logoMask?: THREE.CanvasTexture
) {
  const s = 1024

  // ---- base canvas ----
  const cnv = document.createElement('canvas')
  cnv.width = cnv.height = s
  const g = cnv.getContext('2d')!
  g.fillStyle = baseColor
  g.fillRect(0, 0, s, s)

  // subtle lines
  g.globalAlpha = 0.08
  for (let y = 0; y < s; y += 2) {
    g.fillStyle = 'rgba(255,255,255,0.05)'
    g.fillRect(0, y, s, 1)
  }
  g.globalAlpha = 1

  // ---- tint mask on its own canvas, then paste onto base ----
  if (logoMask?.image) {
    const mc = document.createElement('canvas')
    mc.width = mc.height = s
    const mg = mc.getContext('2d')!

    // draw white-on-transparent mask
    mg.drawImage(logoMask.image as CanvasImageSource, 0, 0, s, s)

    // tint to logoColor
    mg.globalCompositeOperation = 'source-in'
    mg.fillStyle = logoColor
    mg.fillRect(0, 0, s, s)
    mg.globalCompositeOperation = 'source-over'

    // composite over the base
    g.drawImage(mc, 0, 0, s, s)
  }

  const tex = new THREE.CanvasTexture(cnv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  // keep default flipY for CanvasTexture (works fine here)
  tex.needsUpdate = true

  const params: THREE.MeshStandardMaterialParameters = {
    map: tex,
    metalness,
    roughness,
    bumpScale: 0.35,
  }
  if (bumpMap) params.bumpMap = bumpMap
  return new THREE.MeshStandardMaterial(params)
}

// ------------ exported materials (shared) ------------
export const goldMat = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#d4af37'),
  metalness: 1.0,
  roughness: 0.18,
})

export const lavaMats = new THREE.MeshPhysicalMaterial({
  map: texLavastone,
  bumpMap: bmLavastone,
  bumpScale: 2,
  roughnessMap: rmLavastone,
  roughness: 0.86,
  metalness: 0.54,
})

// metal cube (side + logo top)
export function metalMat(bead: Bead, logoTex?: THREE.CanvasTexture) {
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
    bead.metalKind === 'black' ? 0.7 : bead.metalKind === 'brass' ? 0.6 : isStainless ? 0.12 : 0.45

  const params: THREE.MeshPhysicalMaterialParameters = {
    color: new THREE.Color(base),
    metalness: 1.0,
    roughness: rough,
  }
  if (bead.metalKind === 'black') {
    params.bumpMap = bmBlackMetal
    params.bumpScale = 0.35
  } else if (bead.metalKind === 'brass') {
    params.bumpMap = bmScratches
    params.bumpScale = 0.35
  }
  const side = new THREE.MeshPhysicalMaterial(params)
  if (isStainless) side.envMapIntensity = 1.4

  const top = createLogoTopMaterial(
    base,
    bead.logoColor || '#d4af37',
    bead.metalKind === 'black' ? 0.88 : 1.0,
    rough,
    bead.metalKind === 'black' ? bmBlackMetal : bead.metalKind === 'brass' ? bmScratches : null,
    logoTex // <-- PASS IT HERE
  )
  if (isStainless) top.envMapIntensity = 1.4

  return { side, top }
}

// gemstones & others
export function gemMaterial(id: string, bright = 1) {
  if (id.startsWith('whitejade')) {
    const sizeMM = BEADS['whitejade-10'].sizeMM
    const thicknessUnits = sizeMM * MM_TO_UNITS * 0.75
    const m = new THREE.MeshPhysicalMaterial({
      map: texWhiteJade,
      roughness: 0.18,
      metalness: 0.0,
      transmission: 0.72,
      ior: 1.78,
      thickness: thicknessUnits,
      thicknessMap,
      attenuationColor: '#f7f3e4ff',
      attenuationDistance: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      envMapIntensity: 2.2,
    })
    m.color.setScalar(bright)
    return m
  }

  if (id.startsWith('malachite')) {
    const m = new THREE.MeshPhysicalMaterial({
      map: texMalachite,
      metalness: 0,
      roughness: 0.32,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
      ior: 1.7,
      envMapIntensity: 0,
      specularIntensity: 0.4,
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

  if (id.startsWith('rubyinzoisite')) {
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
    return new THREE.MeshPhysicalMaterial({
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
  }

  // fallback
  return new THREE.MeshPhysicalMaterial({ color: 0x777777, roughness: 0.5, metalness: 0 })
}

export function roundedCubeGeo(size: number, radius = 0.07) {
  return new RoundedBoxGeometry(size, size, size, 4, size * radius)
}
