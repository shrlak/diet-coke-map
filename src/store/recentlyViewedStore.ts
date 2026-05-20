import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Store } from '../types'

const MAX_RECENT = 8

interface RecentlyViewedState {
  stores: Store[]
  addStore: (store: Store) => void
  clearAll: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      stores: [],
      addStore: (store) =>
        set((state) => {
          const filtered = state.stores.filter((s) => s.id !== store.id)
          return { stores: [store, ...filtered].slice(0, MAX_RECENT) }
        }),
      clearAll: () => set({ stores: [] }),
    }),
    { name: 'diet-coke-recently-viewed' }
  )
)
