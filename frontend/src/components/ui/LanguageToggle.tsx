import { motion } from 'framer-motion';
import { useLangStore, Lang } from '../../store/langStore';

export function LanguageToggle() {
  const { lang, setLang } = useLangStore();

  return (
    <div className="flex items-center gap-0.5 bg-gray-800/80 border border-gray-700 rounded-lg p-0.5">
      {(['fr', 'en'] as Lang[]).map(l => (
        <motion.button
          key={l}
          onClick={() => setLang(l)}
          whileTap={{ scale: 0.93 }}
          className={`
            px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-all
            ${lang === l
              ? 'bg-gold-600 text-gray-900 shadow-sm'
              : 'text-gray-400 hover:text-white'}
          `}
        >
          {l}
        </motion.button>
      ))}
    </div>
  );
}
