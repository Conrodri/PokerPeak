import { motion } from 'framer-motion';
import { Sliders, X, Target } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { RangeProfile } from '../../../services/api';

// ─── Expert exam: complex-range profile picker ────────────────────────────────
// Expert exams quiz the user on one of THEIR complex ranges — they must choose
// which profile before the run can start (a GTO-only expert exam is pointless).
export function ExpertExamProfilePicker({ profiles, isEn, onPick, onClose, onCreate }: {
  profiles: RangeProfile[] | null;
  isEn: boolean;
  onPick: (id: string) => void;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-5 flex flex-col gap-4 max-h-[85vh]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-purple-400 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-white">
                {isEn ? 'Choose your complex range' : 'Choisis ta range complexe'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEn
                  ? 'The expert exam quizzes you on this range.'
                  : 'Le sprint expert t’interroge sur cette range.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 shrink-0">
            <X size={18} />
          </button>
        </div>

        {profiles === null ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-gray-300">
              {isEn
                ? 'You have no complex range yet. Create one in My Ranges (Complex ranges) to start an expert exam.'
                : 'Tu n’as pas encore de range complexe. Crée-en une dans Mes Ranges (Ranges complexes) pour lancer un sprint expert.'}
            </p>
            <Button variant="gold" size="md" onClick={onCreate} className="flex items-center gap-2">
              <Sliders size={15} />
              {isEn ? 'Open My Ranges' : 'Ouvrir Mes Ranges'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => onPick(p.id)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 hover:border-purple-600/70 hover:bg-gray-800 transition-colors text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate">{p.name}</span>
                    {p.isActive && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-900/40 text-green-300 border border-green-700/50 shrink-0">
                        {isEn ? 'Active' : 'Active'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {p.stackRanges.length} {isEn
                      ? `stack range${p.stackRanges.length > 1 ? 's' : ''}`
                      : `plage${p.stackRanges.length > 1 ? 's' : ''} de stack`}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-purple-300 group-hover:text-purple-200 shrink-0">
                  <Target size={14} /> {isEn ? 'Start' : 'Lancer'}
                </span>
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
