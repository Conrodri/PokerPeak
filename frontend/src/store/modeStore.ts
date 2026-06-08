import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TrainingMode = 'beginner' | 'advanced';

interface ModeState {
  mode: TrainingMode;
  setMode: (mode: TrainingMode) => void;
}

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: 'beginner',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'poker-mode' }
  )
);
