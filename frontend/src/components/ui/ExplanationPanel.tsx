import { Info } from 'lucide-react';
import { useLangStore } from '../../store/langStore';
import { useModeStore } from '../../store/modeStore';
import { RichText } from './RichText';

interface Props {
  text: string;
  /** If true, render plain <p> instead of RichText (for simple string explanations) */
  plain?: boolean;
  /** Override mode — if not provided, reads from useModeStore */
  mode?: 'beginner' | 'advanced';
  className?: string;
}

export function ExplanationPanel({ text, plain = false, mode: modeProp, className }: Props) {
  const isEn = useLangStore(s => s.lang) === 'en';
  const storeMode = useModeStore(s => s.mode);
  const mode = modeProp ?? storeMode;
  if (mode !== 'beginner') return null;
  return (
    <div className={`bg-gray-800/60 rounded-xl p-4 border border-gray-700 w-full ${className ?? ''}`}>
      <p className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-1">
        <Info size={14} /> {isEn ? 'Explanation' : 'Explication'}
      </p>
      {plain
        ? <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{text}</p>
        : <RichText text={text} />
      }
    </div>
  );
}
