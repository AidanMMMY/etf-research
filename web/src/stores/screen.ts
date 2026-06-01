import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScreenFilters } from '@/types/screen';

interface ScreenState {
  filters: ScreenFilters;
  preset: string | null;
  setFilter: (key: keyof ScreenFilters, value: ScreenFilters[keyof ScreenFilters]) => void;
  setFilters: (filters: ScreenFilters) => void;
  resetFilters: () => void;
  applyPreset: (preset: string | null) => void;
}

const defaultFilters: ScreenFilters = {
  limit: 50,
  sort_by: 'composite_score',
  sort_order: 'desc',
};

export const useScreenStore = create<ScreenState>()(
  persist(
    (set) => ({
      filters: { ...defaultFilters },
      preset: null,

      setFilter: (key, value) =>
        set((state) => ({ filters: { ...state.filters, [key]: value } })),

      setFilters: (filters) => set({ filters }),

      resetFilters: () => set({ filters: { ...defaultFilters }, preset: null }),

      applyPreset: (preset) => set({ preset, filters: { ...defaultFilters } }),
    }),
    {
      name: 'screen-storage',
      partialize: (state) => ({ filters: state.filters, preset: state.preset }),
    }
  )
);
