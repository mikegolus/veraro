import { gemId, totalWidth, widthOfBeadId } from './helpers'

import type { BeadId, GemType, GemSize, SpacerBeadId } from 'src/types'

type Config = {
  targetCircumferenceMM: number
  primary: GemType
  mainSizeMM: GemSize
  secondary?: GemType
  spacers?: boolean
  spacerType?: SpacerBeadId
  triad?: boolean
  focal?: BeadId[] // a single bead or a bespoke sequence
}

const DEFAULT_SPACER: SpacerBeadId = 'spacer-7x2'

/** Build a sub-run of exactly N gemstones.
 *  - Always starts with the primary gemstone.
 *  - If secondary is set, alternates primary/secondary/primary/...
 *  - If spacers=true, inserts a spacer between gemstones, but NOT at the ends.
 */
function buildSubRun(
  nGems: number,
  primary: GemType,
  mainSizeMM: GemSize,
  secondary: GemType | undefined,
  spacers: boolean,
  spacerType: SpacerBeadId
): BeadId[] {
  const out: BeadId[] = []
  for (let i = 0; i < nGems; i++) {
    const gem = !secondary || i % 2 === 0 ? primary : secondary
    out.push(gemId(gem, mainSizeMM))
    if (spacers && i < nGems - 1) out.push(spacerType)
  }
  return out
}

/** Build the “no focal” case using the classic repeating core cycle. */
function buildNoFocal(
  targetCircumferenceMM: number,
  primary: GemType,
  mainSizeMM: GemSize,
  secondary: GemType | undefined,
  spacers: boolean,
  spacerType: SpacerBeadId
): BeadId[] {
  const a = gemId(primary, mainSizeMM)
  const b = secondary ? gemId(secondary, mainSizeMM) : null
  const spacer = spacers ? spacerType : null

  // core cycle
  const core: BeadId[] = b ? (spacer ? [a, spacer, b, spacer] : [a, b]) : spacer ? [a, spacer] : [a]

  const beads: BeadId[] = []
  let width = 0
  const cycleWidth = totalWidth(core)
  if (cycleWidth <= 0) return beads

  while (width < targetCircumferenceMM) {
    beads.push(...core)
    width += cycleWidth
    if (beads.length > 5000) break
  }
  return beads
}

/** -------- MAIN BUILDER -------- */
export function configurator(config: Config): BeadId[] {
  const {
    targetCircumferenceMM,
    primary,
    mainSizeMM,
    secondary,
    spacers = false,
    spacerType = DEFAULT_SPACER,
    triad = false,
    focal = [],
  } = config

  const focalOcc = focal.length ? (triad ? 3 : 1) : 0
  if (focalOcc === 0) {
    // No focal: classic configurator; allowed to start/end with spacer.
    return buildNoFocal(targetCircumferenceMM, primary, mainSizeMM, secondary, spacers, spacerType)
  }

  // There is a focal: focal(s) go first; main run (or sub-runs) must not start/end with a spacer.
  const focalWidthTotal = totalWidth(focal) * (triad ? 3 : 1)

  // Solve minimal gemstone count(s) by formula; then construct.
  const spacerW = spacers ? widthOfBeadId(spacerType) : 0 // mm contributed by each BETWEEN-gem spacer
  const remaining = Math.max(0, targetCircumferenceMM - focalWidthTotal)

  if (!triad) {
    // ---- Single focal: [ focal..., mainRunSub(N) ]
    // Sub-run width:
    //   if spacers=false:  W(N) = N * mainSizeMM
    //   if spacers=true :  W(N) = N * mainSizeMM + (N - 1) * spacerW   (for N>=1; W(0)=0)
    let n: number
    if (!spacers) {
      n = Math.ceil(remaining / mainSizeMM)
    } else {
      n =
        remaining <= 0 ? 0 : Math.max(1, Math.ceil((remaining + spacerW) / (mainSizeMM + spacerW)))
      // derivation: N*(mainSizeMM+spacerW) - spacerW >= remaining
      //          => N >= ceil((remaining + spacerW)/(mainSizeMM+spacerW))
    }

    const main = buildSubRun(n, primary, mainSizeMM, secondary, spacers, spacerType)
    return [...focal, ...main]
  }

  // ---- Triad: [ focal..., sub1, focal..., sub2, focal..., sub3 ]
  // All three sub-runs identical length N, so main width = 3 * W(N)
  let n: number
  if (!spacers) {
    n = Math.ceil(remaining / (3 * mainSizeMM))
  } else {
    n =
      remaining <= 0
        ? 0
        : Math.max(1, Math.ceil((remaining + 3 * spacerW) / (3 * (mainSizeMM + spacerW))))
    // derivation: 3*(N*(mainSizeMM+spacerW) - spacerW) >= remaining
    //          => N >= ceil((remaining + 3*spacerW) / (3*(mainSizeMM+spacerW)))
  }

  const sub = buildSubRun(n, primary, mainSizeMM, secondary, spacers, spacerType)
  return [...focal, ...sub, ...focal, ...sub, ...focal, ...sub]
}
