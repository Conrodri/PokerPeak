import { motion } from 'framer-motion';
import { GraduationCap, Play, Zap } from 'lucide-react';
import { Button } from './Button';
import { useLangStore } from '../../store/langStore';

interface TrainerIntroProps {
  emoji: string;
  title: string;            // already localized by caller
  description: string;      // already localized by caller
  whatTitle: string;        // already localized by caller
  whatContent: React.ReactNode;  // the inner content of the "What is X?" section — varies
  steps: string[];          // already localized bullet items (emoji + text combined)
  beginnerHint: string;     // already localized
  advancedHint: string;     // already localized
  startLabel: string;       // already localized
  onStart: () => void;
  mode: 'beginner' | 'advanced';
}

export function TrainerIntro({
  emoji, title, description, whatTitle, whatContent,
  steps, beginnerHint, advancedHint, startLabel, onStart, mode,
}: TrainerIntroProps) {
  const isEn = useLangStore(s => s.lang) === 'en';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 max-w-xl mx-auto"
    >
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-3">{emoji}</div>
        <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>

      {/* What is X? */}
      <div className="bg-gray-900/60 rounded-2xl p-5 border border-gray-700">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <span>📖</span>
          {whatTitle}
        </h3>
        {whatContent}
      </div>

      {/* How it works */}
      <div className="bg-gray-900/60 rounded-2xl p-5 border border-gray-700">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <span>⚡</span>
          {isEn ? 'How the exercises work' : 'Comment fonctionnent les exercices ?'}
        </h3>
        <ul className="space-y-2 text-sm text-gray-400">
          {steps.map((item, i) => {
            const spaceIdx = item.indexOf(' ');
            return (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">{item.slice(0, spaceIdx)}</span>
                <span>{item.slice(spaceIdx + 1)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mode cards */}
      <div className="flex gap-3">
        <div className={`flex-1 rounded-xl p-3 border text-center text-xs ${mode === 'beginner' ? 'bg-blue-900/30 border-blue-700' : 'bg-gray-800/40 border-gray-700'}`}>
          <GraduationCap size={16} className="mx-auto mb-1 text-blue-400" />
          <div className="font-bold text-white">{isEn ? 'Beginner' : 'Débutant'}</div>
          <div className="text-gray-500 mt-0.5">{beginnerHint}</div>
        </div>
        <div className={`flex-1 rounded-xl p-3 border text-center text-xs ${mode === 'advanced' ? 'bg-yellow-900/30 border-yellow-700' : 'bg-gray-800/40 border-gray-700'}`}>
          <Zap size={16} className="mx-auto mb-1 text-yellow-400" />
          <div className="font-bold text-white">{isEn ? 'Advanced' : 'Avancé'}</div>
          <div className="text-gray-500 mt-0.5">{advancedHint}</div>
        </div>
      </div>

      {/* Start button */}
      <Button size="lg" variant="gold" onClick={onStart} fullWidth>
        <Play size={16} className="inline mr-2" />
        {startLabel}
      </Button>
    </motion.div>
  );
}
