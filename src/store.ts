import { create } from 'zustand'

import { configurator } from './lib/configurator'

import type { BeadId } from './types'

export type State = {
  bracelet: BeadId[]
  setBracelet: (ids: BeadId[]) => void
  add: (id: BeadId) => void
  removeLast: () => void
  removeAt: (i: number) => void
  removeAll: () => void
}

const initial = configurator({
  primary: 'onyx',
  secondary: 'rubyinzoisite',
  mainSizeMM: 10,
  targetCircumferenceMM: 180,
  spacers: true,
  focal: ['spacer-8x2', 'lava-cube-8', 'spacer-8x2'],
  triad: true,
})

export const useStore = create<State>((set) => ({
  bracelet: initial,
  setBracelet: (ids) => set({ bracelet: ids }),
  add: (id) => set((state) => ({ bracelet: [...state.bracelet, id] })),
  removeLast: () => set((state) => ({ bracelet: state.bracelet.slice(0, -1) })),
  removeAt: (i) => set((state) => ({ bracelet: state.bracelet.filter((_, idx) => idx !== i) })),
  removeAll: () => set({ bracelet: [] }),
}))
