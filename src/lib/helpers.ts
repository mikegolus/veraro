import { BEADS } from '../beads'

import type { BeadId, GemBeadId, GemSize, GemType, SpacerBeadId, SpacerSize } from '../types'

export function getCircumferenceMM(bracelet: BeadId[]) {
  const raw = bracelet.reduce((sum, id) => {
    const d = BEADS[id]
    if (!d) return sum
    if (d.kind === 'spacer') return sum + d.thicknessMM
    return sum + d.sizeMM
  }, 0)
  return Math.max(120, raw)
}

export function widthOfBeadId(id: BeadId): number {
  const bead = BEADS[id]
  return bead.kind === 'spacer' ? bead.thicknessMM : bead.sizeMM
}

export function totalWidth(list: BeadId[]): number {
  let sum = 0
  for (const id of list) sum += widthOfBeadId(id)
  return sum
}

export function gemId(type: GemType, size: GemSize): GemBeadId {
  return `${type}-${size}`
}

export function spacerId(size: SpacerSize): SpacerBeadId {
  return `spacer-${size}x2`
}

export function labelOfBeadId(id: BeadId): string {
  const bead = BEADS[id]
  return bead.label
}

export function labelOfGemstoneType(type: GemType): string {
  const bead = Object.values(BEADS).find((bead) => bead.kind === 'gem' && bead.id.startsWith(type))
  return bead ? bead.label : type
}

export function totalPriceUSD(bracelet: BeadId[]) {
  const beads = bracelet.reduce((sum, id) => {
    const bead = BEADS[id]
    const beadPrice = bead.priceUSD
    return sum + beadPrice
  }, 0)
  const cord = 0.5
  const labor = 10
  const final = beads + cord + labor
  return Math.round(final)
}
