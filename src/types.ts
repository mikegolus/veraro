export const GEM_TYPES = [
  'onyx',
  'malachite',
  'bronzite',
  'whitejade',
  'mapstone',
  'tigereye',
  'rubyinzoisite',
  'larvikite',
  'quartz',
  'carved',
] as const
export type GemType = (typeof GEM_TYPES)[number]

export const GEM_SIZES_MM = [6, 8, 10, 12] as const
export type GemSize = (typeof GEM_SIZES_MM)[number]

export type GemBeadId = `${GemType}-${GemSize}`

export const SPACER_SIZES_MM = [6, 7, 8, 10] as const
export type SpacerSize = (typeof SPACER_SIZES_MM)[number]

export const SPACE_BEAD_IDS = SPACER_SIZES_MM.map((s) => `spacer-${s}x2` as const)
export type SpacerBeadId = (typeof SPACE_BEAD_IDS)[number]

export type CubeId =
  | 'lava-cube-10'
  | 'lava-cube-8'
  | 'cube-brass-logo-10'
  | 'cube-black-logo-10'
  | 'cube-stainless-logo-10'
  | 'cube-dullsteel-logo-10'

export type BeadId = GemBeadId | SpacerBeadId | CubeId

type CommonBead = {
  id: BeadId
  label: string
  sizeMM: number
  color?: string
  priceUSD: number
  logoColor?: string
}

export type Bead =
  // Gem beads
  | (CommonBead & {
      kind: 'gem'
      thicknessMM?: never
      cubeType?: never
      metalKind?: never
    })
  // Spacer beads: thicknessMM required
  | (CommonBead & {
      kind: 'spacer'
      thicknessMM: number
      cubeType?: never
      metalKind?: never
    })
  // Cube beads: cubeType required
  | (CommonBead & {
      kind: 'cube'
      cubeType: 'lava'
      thicknessMM?: never
      metalKind?: never
    })
  | (CommonBead & {
      kind: 'cube'
      cubeType: 'metal'
      metalKind: 'brass' | 'black' | 'stainless' | 'dullsteel'
      thicknessMM?: never
    })

export type SpacerBead = Extract<Bead, { kind: 'spacer' }>
