import { useState } from 'react';
import { Lightbulb, ChevronDown } from 'lucide-react';
import { useLangStore } from '../../store/langStore';
import { useModeStore, TrainingMode } from '../../store/modeStore';
import { useExamStore } from '../../store/examStore';
import { RichLine } from './RichText';

interface Props {
  text: string;
  /** @deprecated — ignored, kept for call-site compatibility. */
  plain?: boolean;
  /** Override mode — if not provided, reads from useModeStore. */
  mode?: TrainingMode;
  /** Bypass the mode gating (always show, e.g. the expert quiz feedback). */
  forceShow?: boolean;
  className?: string;
}

/**
 * Compact, visual end-of-exercise explanation.
 *  - Beginner (or forceShow): shown, as bullet points.
 *  - Advanced: hidden by default behind a "Show explanation" toggle.
 *  - Expert: hidden entirely.
 */
export function ExplanationPanel({ text, mode: modeProp, forceShow, className }: Props) {
  const isEn = useLangStore(s => s.lang) === 'en';
  const storeMode = useModeStore(s => s.mode);
  const examActive = useExamStore(s => s.active);
  const mode = modeProp ?? storeMode;
  const [open, setOpen] = useState(false);

  // During an exam (sprint) → no explanation at all, in any mode. We're here to
  // work the module, not to learn.
  if (examActive) return null;

  // Expert (without forceShow) → no explanation at all.
  if (mode === 'expert' && !forceShow) return null;

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // Advanced (without forceShow) → available but collapsed by default.
  const collapsible = mode === 'advanced' && !forceShow;

  const card = (
    <div className={`bg-gray-800/60 rounded-xl px-3.5 py-2.5 border border-gray-700 w-full ${className ?? ''}`}>
      <p className="text-xs font-bold text-gold-300 mb-1.5 flex items-center gap-1.5">
        <Lightbulb size={13} /> {isEn ? 'Explanation' : 'Explication'}
      </p>
      <ul className="flex flex-col gap-1">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-snug">
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-gold-500/70 shrink-0" />
            <span className="flex-1"><RichLine text={line} /></span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (collapsible) {
    return open ? (
      <div className="w-full flex flex-col items-center gap-1">
        {card}
        <button
          onClick={() => setOpen(false)}
          className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          {isEn ? 'Hide explanation' : "Masquer l'explication"}
        </button>
      </div>
    ) : (
      <div className="w-full flex justify-center">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gold-300/90 hover:text-gold-200 border border-gray-700 hover:border-gold-700/60 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Lightbulb size={13} /> {isEn ? 'Show explanation' : "Voir l'explication"}
          <ChevronDown size={13} />
        </button>
      </div>
    );
  }

  return card;
}
