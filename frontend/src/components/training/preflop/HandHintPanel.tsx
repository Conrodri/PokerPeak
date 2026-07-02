import { Lightbulb } from 'lucide-react';
import { handToDisplay } from '../../../utils/pokerUtils';
import { handHint } from '../../../utils/handHints';

// Hand-specific coaching hint panel (revealed via SpoilableHint in advanced).
export function HandHintPanel({ notation, isEn }: { notation: string; isEn: boolean }) {
  return (
    <div className="w-full rounded-xl border border-amber-700/40 bg-amber-950/30 px-3 py-2 flex items-start gap-2 text-left">
      <Lightbulb size={15} className="text-amber-400 mt-0.5 shrink-0" />
      <div>
        <span className="font-bold text-amber-300 text-xs">{handToDisplay(notation)}</span>
        <span className="text-gray-300 text-xs"> — {handHint(notation, isEn)}</span>
      </div>
    </div>
  );
}
