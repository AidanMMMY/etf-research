import { create } from 'zustand';

interface PoolState {
  selectedPoolId: number | null;
  editingWeights: boolean;
  weightChanges: Record<string, number>;
  setSelectedPool: (id: number | null) => void;
  setEditingWeights: (editing: boolean) => void;
  setWeightChange: (code: string, weight: number) => void;
  resetWeightChanges: () => void;
}

export const usePoolStore = create<PoolState>((set) => ({
  selectedPoolId: null,
  editingWeights: false,
  weightChanges: {},

  setSelectedPool: (id) => set({ selectedPoolId: id }),
  setEditingWeights: (editing) => set({ editingWeights: editing }),
  setWeightChange: (code, weight) =>
    set((state) => ({
      weightChanges: { ...state.weightChanges, [code]: weight },
    })),
  resetWeightChanges: () => set({ weightChanges: {} }),
}));
