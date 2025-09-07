// beadOrient.ts
import { BEADS } from '../beads'

import type * as THREE from 'three'

export function defaultBeadOrient(beadId: string) {
  const bead = BEADS[beadId]
  return (obj: THREE.Object3D) => {
    if (!bead) return
    if (bead.kind === 'cube') {
      // show 3 faces nicely
      obj.rotation.set(-0.08, 0.25, 0)
    } else if (bead.kind === 'spacer') {
      // tilt ring so you see the profile + inner hole
      obj.rotation.set(0.15, 0.75, 0)
    } else {
      // spheres: a tiny spin so textures aren’t dead-on
      obj.rotation.y = 0.4
    }
  }
}
