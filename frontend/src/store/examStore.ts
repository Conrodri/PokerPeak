import { create } from 'zustand';
import { examApi } from '../services/api';
import { TrainingMode } from './modeStore';

/** A run ends after this many wrong answers. */
export const EXAM_MAX_ERRORS = 3;

export interface SprintMistake {
  label: string;  // e.g. "AKs — BTN"
}

interface ExamState {
  active: boolean;
  module: string | null;
  mode: TrainingMode;
  correct: number;
  errors: number;
  finished: boolean;
  isNewRecord: boolean;
  isForfeited: boolean;
  mistakes: SprintMistake[];
  records: Record<string, { advanced: number; expert: number }>;
  history: { score: number; createdAt: string }[];

  loadRecords: () => Promise<void>;
  start: (module: string, mode?: TrainingMode) => void;
  /** Record one answer. Returns true if this answer ended the run. */
  answer: (isCorrect: boolean, label?: string) => boolean;
  /** Stop early — shows the recap card without saving the score. */
  forfeit: () => void;
  /** Fully exit exam mode (called from the recap card's Quit button). */
  quit: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  active: false,
  module: null,
  mode: 'advanced',
  correct: 0,
  errors: 0,
  finished: false,
  isNewRecord: false,
  isForfeited: false,
  mistakes: [],
  records: {},
  history: [],

  loadRecords: async () => {
    try {
      const records = await examApi.records();
      set({ records });
    } catch {
      /* not logged in or offline — leave records empty */
    }
  },

  start: (module, mode = 'advanced') => set({
    active: true, module, mode, correct: 0, errors: 0, finished: false,
    isNewRecord: false, isForfeited: false, mistakes: [], history: [],
  }),

  answer: (isCorrect, label) => {
    const { active, finished, correct, errors, mistakes, module, mode } = get();
    if (!active || finished) return false;

    if (isCorrect) {
      set({ correct: correct + 1 });
      return false;
    }

    const newMistakes = label ? [...mistakes, { label }] : mistakes;
    const newErrors = errors + 1;
    if (newErrors < EXAM_MAX_ERRORS) {
      set({ errors: newErrors, mistakes: newMistakes });
      return false;
    }

    // Third error → run over.
    set({ errors: newErrors, mistakes: newMistakes, finished: true });
    // Save score for advanced/expert only; basic sprint is untimed practice, not ranked.
    if (module && (mode === 'advanced' || mode === 'expert')) {
      examApi.saveScore(module, correct, mode)
        .then(({ best, isNewRecord, history }) => set(s => {
          const prev = s.records[module] ?? { advanced: 0, expert: 0 };
          return {
            isNewRecord,
            records: {
              ...s.records,
              [module]: mode === 'expert'
                ? { ...prev, expert: best }
                : { ...prev, advanced: best },
            },
            history,
          };
        }))
        .catch(() => {/* anonymous / offline — no saved record */});
    }
    return true;
  },

  forfeit: () => set({ finished: true, isForfeited: true }),

  quit: () => set({ active: false, module: null, mode: 'advanced', correct: 0, errors: 0, finished: false, isNewRecord: false, isForfeited: false, mistakes: [], history: [] }),
}));
