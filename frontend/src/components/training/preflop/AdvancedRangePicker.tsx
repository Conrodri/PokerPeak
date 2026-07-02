import { motion } from 'framer-motion';
import { Target, Sliders } from 'lucide-react';

// ─── Advanced range picker (GTO vs simple custom ranges) ─────────────────────

export function AdvancedRangePicker({
  isEn,
  onPick,
  onClose,
}: {
  isEn: boolean;
  onPick: (useCustom: boolean) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-2xl border border-gray-700 bg-gray-900/95 backdrop-blur-sm p-5 flex flex-col gap-4"
    >
      <h3 className="text-white font-bold text-base text-center">
        {isEn ? 'Train with which range?' : "S'entraîner avec quelle range ?"}
      </h3>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onPick(false)}
          className="flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-felt-700 bg-felt-900/30 hover:bg-felt-800/50 text-left transition-colors"
        >
          <Target size={22} className="text-felt-400 shrink-0" />
          <div>
            <p className="text-felt-200 font-bold text-sm">GTO</p>
            <p className="text-felt-400/70 text-xs mt-0.5">
              {isEn ? 'Solver-calibrated reference ranges' : 'Ranges de référence calibrées sur solveur'}
            </p>
          </div>
        </button>
        <button
          onClick={() => onPick(true)}
          className="flex items-center gap-4 px-5 py-4 rounded-xl border-2 border-purple-700 bg-purple-900/30 hover:bg-purple-800/50 text-left transition-colors"
        >
          <Sliders size={22} className="text-purple-400 shrink-0" />
          <div>
            <p className="text-purple-200 font-bold text-sm">{isEn ? 'My Ranges' : 'Mes ranges'}</p>
            <p className="text-purple-400/70 text-xs mt-0.5">
              {isEn ? 'Train on your own custom ranges' : 'Entraîne-toi sur tes propres ranges'}
            </p>
          </div>
        </button>
      </div>
      <button
        onClick={onClose}
        className="text-xs text-gray-500 hover:text-gray-300 text-center transition-colors"
      >
        {isEn ? 'Cancel' : 'Annuler'}
      </button>
    </motion.div>
  );
}
