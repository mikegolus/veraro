// buildBead.ts
import * as THREE from 'three'

import { BEADS } from '../beads'

import { MM_TO_UNITS, gemMaterial, metalMat, lavaMats, roundedCubeGeo, goldMat } from './materials'

import type { BeadId, SpacerBead } from '../types'

const sphereGeoMM = (dmm: number) => new THREE.SphereGeometry((dmm * MM_TO_UNITS) / 2, 64, 64)

function makeSpacerMesh(bead: SpacerBead) {
  const t = bead.thicknessMM * MM_TO_UNITS
  const outerR = (bead.sizeMM / 2) * MM_TO_UNITS
  const innerR = (2 / 2) * MM_TO_UNITS
  const halfT = t / 2

  const pts: THREE.Vector2[] = []
  pts.push(new THREE.Vector2(innerR, -halfT))
  pts.push(new THREE.Vector2(outerR - halfT, -halfT))
  const steps = 64
  for (let i = 0; i <= steps; i++) {
    const phi = -Math.PI / 2 + (i / steps) * Math.PI
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
  return mesh
}

export function buildSingleBeadMesh(beadId: BeadId | ''): THREE.Object3D {
  const bead = BEADS[beadId]
  if (!bead) throw new Error(`Unknown bead id: ${beadId}`)

  if (bead.kind === 'spacer') return makeSpacerMesh(bead as SpacerBead)

  if (bead.kind === 'cube') {
    const size = bead.sizeMM * MM_TO_UNITS
    if (bead.cubeType === 'lava') {
      const mesh = new THREE.Mesh(roundedCubeGeo(size, 0.07), lavaMats)
      mesh.castShadow = true
      return mesh
    } else {
      const mats = metalMat(bead)
      const matArr: THREE.Material[] = [
        mats.side,
        mats.side,
        mats.top,
        mats.side,
        mats.side,
        mats.side,
      ]
      const mesh = new THREE.Mesh(roundedCubeGeo(size, 0.04), matArr)
      mesh.castShadow = true
      return mesh
    }
  }

  const mesh = new THREE.Mesh(sphereGeoMM(bead.sizeMM!), gemMaterial(bead.id))
  mesh.castShadow = true
  return mesh
}
