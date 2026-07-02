import { computeDraws, RANK_LABEL_FR, RANK_LABEL_EN } from '../../utils/outsCalc';

export function HeroOutsPanel({ heroHand, board, isEn }: { heroHand: string[]; board: string[]; isEn: boolean }) {
  const draws = computeDraws(heroHand, board);
  const cardsLeft = 5 - board.length; // 2 on flop, 1 on turn
  const pct = draws.directOuts * (cardsLeft === 2 ? 4 : 2);

  if (draws.pairOuts.length === 0 && !draws.flushType) return null;

  return (
    <div className="w-full rounded-xl border border-teal-800/40 bg-teal-950/20 px-4 py-3 text-xs">
      <p className="font-bold text-teal-300 mb-2">
        🎯 {isEn ? 'Your improvement outs' : 'Tes outs (cartes qui améliorent ta main)'}
      </p>
      <ul className="space-y-1 text-gray-300">
        {draws.pairOuts.map(o => (
          <li key={o.rank}>
            • {isEn ? RANK_LABEL_EN[o.rank] : RANK_LABEL_FR[o.rank]} → {isEn ? 'Pair' : 'Paire'} : <span className="text-white font-semibold">{o.count} outs</span>
          </li>
        ))}
        {draws.flushType === 'draw' && (
          <li>• {isEn ? `Flush draw : ${draws.flushOuts} outs` : `Tirage couleur : ${draws.flushOuts} outs`}</li>
        )}
        {draws.flushType === 'backdoor' && (
          <li className="text-gray-500">• {isEn ? 'Backdoor flush draw (needs 2 running cards)' : 'Tirage couleur backdoor (2 cartes consécutives nécessaires)'}</li>
        )}
      </ul>
      {draws.directOuts > 0 && (
        <p className="mt-2 text-teal-200 font-semibold">
          → {draws.directOuts} {isEn ? `direct outs ≈ ${pct}% chance to improve (rule of ${cardsLeft === 2 ? '4' : '2'})` : `outs directs ≈ ${pct}% de chance d'amélioration (règle du ${cardsLeft === 2 ? '4' : '2'})`}
        </p>
      )}
    </div>
  );
}
