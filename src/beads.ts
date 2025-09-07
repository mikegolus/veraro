import { gemId, spacerId } from './lib/helpers'
import { GEM_SIZES_MM, SPACER_SIZES_MM } from './types'

import type { Bead, GemSize, GemType } from './types'

type GemMeta = { name: GemType; color: string; label: string }

const gems: GemMeta[] = [
  { name: 'onyx', color: '#0a0a0a', label: 'Onyx' },
  { name: 'malachite', color: '#176b49', label: 'Malachite' },
  { name: 'bronzite', color: '#5c4631', label: 'Bronzite' },
  { name: 'whitejade', color: '#ebebeb', label: 'White Jade' },
  { name: 'mapstone', color: '#bebebe', label: 'Map Stone' },
  { name: 'tigereye', color: 'rgba(112, 67, 34, 1)', label: 'Tiger Eye' },
  { name: 'rubyinzoisite', color: 'rgba(60, 117, 69, 1)', label: 'Ruby in Zoisite' },
  { name: 'larvikite', color: 'rgba(88, 88, 88, 1)', label: 'Larvikite' },
  { name: 'quartz', color: 'rgba(100, 98, 95, 1)', label: 'Quartz' },
  { name: 'carved', color: 'rgba(43, 43, 43, 1)', label: 'Carved' },
]

const BEADS: Record<string, Bead> = {}

// Pricing (USD) rules
const gemOnyxPriceBySize: Record<GemSize, number> = { 12: 1.2, 10: 1, 8: 0.8, 6: 0.6 }
const gemOtherPriceBySize: Record<GemSize, number> = { 12: 1.8, 10: 1.5, 8: 1.2, 6: 0.9 }
const gemCarvedPriceUSD = 3
const spacerPriceUSD = 0.45
const lavaCubePriceBySize: Record<GemSize, number> = { 12: 2.4, 10: 2, 8: 1.6, 6: 1.2 }
const logoCubePriceUSD = 5

for (const gem of gems) {
  for (const size of GEM_SIZES_MM) {
    const id = gemId(gem.name, size)
    const label = gem.label
    BEADS[id] = {
      id: id,
      label,
      kind: 'gem',
      sizeMM: size,
      color: gem.color,
      priceUSD: id.startsWith('onyx-')
        ? gemOnyxPriceBySize[size]
        : id.startsWith('carved-')
          ? gemCarvedPriceUSD
          : gemOtherPriceBySize[size],
    }
  }
}

// Spacers: 2mm thick discs in diameters 6,7,8,10mm
for (const size of SPACER_SIZES_MM) {
  const id = spacerId(size)
  BEADS[id] = {
    id: id,
    label: `Spacer ${size}`,
    kind: 'spacer',
    sizeMM: size,
    thicknessMM: 2,
    color: '#d4af37',
    priceUSD: spacerPriceUSD,
  }
}

// Specialty cubes
BEADS['lava-cube-10'] = {
  id: 'lava-cube-10',
  label: 'Lava Stone Cube 10mm',
  kind: 'cube',
  sizeMM: 10,
  cubeType: 'lava',
  priceUSD: lavaCubePriceBySize[10],
}
BEADS['lava-cube-8'] = {
  id: 'lava-cube-8',
  label: 'Lava Stone Cube 8mm',
  kind: 'cube',
  sizeMM: 8,
  cubeType: 'lava',
  priceUSD: lavaCubePriceBySize[8],
}

BEADS['cube-brass-logo-10'] = {
  id: 'cube-brass-logo-10',
  label: 'Antiqued Brass Cube w/ Logo 10mm',
  kind: 'cube',
  sizeMM: 10,
  cubeType: 'metal',
  metalKind: 'brass',
  logoColor: '#d4af37',
  priceUSD: logoCubePriceUSD,
}
BEADS['cube-black-logo-10'] = {
  id: 'cube-black-logo-10',
  label: 'Black Matte Metal Cube w/ Logo 10mm',
  kind: 'cube',
  sizeMM: 10,
  cubeType: 'metal',
  metalKind: 'black',
  logoColor: '#d7bd6aff',
  priceUSD: logoCubePriceUSD,
}
BEADS['cube-stainless-logo-10'] = {
  id: 'cube-stainless-logo-10',
  label: 'Stainless Steel Cube w/ Logo 10mm',
  kind: 'cube',
  sizeMM: 10,
  cubeType: 'metal',
  metalKind: 'stainless',
  logoColor: '#4a2f1a',
  priceUSD: logoCubePriceUSD,
}
BEADS['cube-dullsteel-logo-10'] = {
  id: 'cube-dullsteel-logo-10',
  label: 'Dull Steel Cube w/ Logo 10mm',
  kind: 'cube',
  sizeMM: 10,
  cubeType: 'metal',
  metalKind: 'dullsteel',
  logoColor: '#000000',
  priceUSD: logoCubePriceUSD,
}

export { BEADS }
