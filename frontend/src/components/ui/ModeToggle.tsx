import { motion } from 'framer-motion';
import { GraduationCap, Zap } from 'lucide-react';
import { useModeStore, TrainingMode } from '../../store/modeStore';
import { useLangStore } from '../../store/langStore';

/**
 * Global beginner / advanced toggle — reads from and writes to modeStore.
 * Drop it anywhere; no props needed.
 */
export function ModeToggle() {
  const { mode, setMode } = useModeStore();
  const isEn = useLangStore(s => s.lang) === 'en';

  const options: { value: TrainingMode; label: string; icon: React.ReactNode }[] = [
    { value: 'beginner',  label: isEn ? 'Beginner' : 'Débutant',  icon: <GraduationCap size={12} /> },
    { value: 'advanced',  label: isEn ? 'Advanced' : 'Avancé',    icon: <Zap size={12} /> },
  ];

  return (
    <div className="flex items-center gap-0.5 bg-gray-800/80 border border-gray-700 rounded-lg p-0.5">
      {options.map(opt => (
        <motion.button
          key={opt.value}
          onClick={() => setMode(opt.value)}
          whileTap={{ scale: 0.93 }}
          className={`
            flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all
            ${mode === opt.value
              ? opt.value === 'beginner'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gold-600 text-gray-900 shadow-sm'
              : 'text-gray-400 hover:text-white'}
          `}
        >
          {opt.icon}
          <span className="hidden 2xl:block">{opt.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
