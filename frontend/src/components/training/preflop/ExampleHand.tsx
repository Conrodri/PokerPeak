import { Hand } from '../../poker/Card';
import { CardStr } from '../../../types/poker';

// ─── Example hand (card icons + notation label) ────────────────────────────────
export function ExampleHand({ cards, label }: { cards: CardStr[]; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Hand cards={cards} size="xs" gap="gap-0.5" animate={false} />
      <span className="text-[10px] font-mono font-bold text-gray-300">{label}</span>
    </div>
  );
}
