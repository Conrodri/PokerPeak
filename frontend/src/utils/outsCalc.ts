export const RANK_LABEL_FR: Record<string, string> = {
  A: 'As', K: 'Rois', Q: 'Dames', J: 'Valets', T: 'Dix',
  '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2',
};
export const RANK_LABEL_EN: Record<string, string> = {
  A: 'Aces', K: 'Kings', Q: 'Queens', J: 'Jacks', T: 'Tens',
  '9': '9s', '8': '8s', '7': '7s', '6': '6s', '5': '5s', '4': '4s', '3': '3s', '2': '2s',
};

export interface DrawInfo {
  pairOuts: Array<{ rank: string; count: number }>;
  flushType: 'draw' | 'backdoor' | null;
  flushOuts: number;
  directOuts: number;
}

/** Pair/set outs + flush draw detection for hero's hand given the current board. */
export function computeDraws(hero: string[], board: string[]): DrawInfo {
  const rankOf = (c: string) => c[0];
  const suitOf = (c: string) => c[c.length - 1];
  const all = [...hero, ...board];
  const rankCount: Record<string, number> = {};
  for (const c of all) rankCount[rankOf(c)] = (rankCount[rankOf(c)] || 0) + 1;

  // Pair outs: hero rank appears exactly once in all known cards → 3 remaining
  const pairOuts: Array<{ rank: string; count: number }> = [];
  const seen = new Set<string>();
  for (const c of hero) {
    const r = rankOf(c);
    if (seen.has(r)) continue;
    seen.add(r);
    if (rankCount[r] === 1) pairOuts.push({ rank: r, count: 3 });
    else if (rankCount[r] === 2 && hero.filter(h => rankOf(h) === r).length === 2) pairOuts.push({ rank: r, count: 2 }); // pocket pair → set
  }

  // Flush draw / backdoor flush
  let flushType: 'draw' | 'backdoor' | null = null;
  let flushOuts = 0;
  for (const suit of new Set(hero.map(suitOf))) {
    const heroCount  = hero.filter(c => suitOf(c) === suit).length;
    const boardCount = board.filter(c => suitOf(c) === suit).length;
    const total = heroCount + boardCount;
    if (total >= 4) { flushType = 'draw'; flushOuts = 13 - total; break; }
    if (total === 3 && board.length <= 3) { flushType = 'backdoor'; flushOuts = 13 - total; }
  }

  const directOuts = pairOuts.reduce((s, o) => s + o.count, 0) + (flushType === 'draw' ? flushOuts : 0);
  return { pairOuts, flushType, flushOuts, directOuts };
}
