// ─── Outs training ──────────────────────────────────────────────────────────
// An "out" is a card still in the deck that improves your hand into a likely
// winner. Each scenario below is hand-verified so the listed outs match the
// actual remaining cards, and ships with a localized breakdown of where the
// outs come from.

export interface OutsDraw {
  fr: string;
  en: string;
}

export interface OutsScenario {
  heroCards: [string, string];
  board: string[];
  street: 'flop' | 'turn';
  outs: number;
  draws: OutsDraw[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export const OUTS_SCENARIOS: OutsScenario[] = [
  // ── Flush draw — 9 outs ──────────────────────────────────────────────────
  {
    heroCards: ['Ah', 'Kh'], board: ['2h', '9h', 'Jc'], street: 'flop',
    outs: 9, difficulty: 'easy',
    draws: [
      { fr: 'Tirage couleur (cœur) : il reste 9 cœurs dans le paquet (13 − 4 visibles).',
        en: 'Flush draw (hearts): 9 hearts left in the deck (13 − 4 visible).' },
    ],
  },
  // ── Open-ended straight draw — 8 outs ────────────────────────────────────
  {
    heroCards: ['9d', '8c'], board: ['7h', '6s', '2c'], street: 'flop',
    outs: 8, difficulty: 'easy',
    draws: [
      { fr: 'Tirage quinte par les deux bouts (6-7-8-9) : un 5 (×4) ou un 10 (×4) te donne la quinte.',
        en: 'Open-ended straight draw (6-7-8-9): any 5 (×4) or any 10 (×4) makes the straight.' },
    ],
  },
  // ── Gutshot — 4 outs ─────────────────────────────────────────────────────
  {
    heroCards: ['9d', '8d'], board: ['Qh', 'Jc', '2s'], street: 'flop',
    outs: 4, difficulty: 'easy',
    draws: [
      { fr: 'Tirage quinte par le ventre (8-9-_-J-Q) : seul un 10 (×4) complète la quinte.',
        en: 'Gutshot straight draw (8-9-_-J-Q): only a 10 (×4) completes the straight.' },
    ],
  },
  // ── Pocket pair → set — 2 outs ───────────────────────────────────────────
  {
    heroCards: ['7c', '7d'], board: ['Ah', 'Kc', '2s'], street: 'flop',
    outs: 2, difficulty: 'easy',
    draws: [
      { fr: 'Toucher ton brelan : il ne reste que 2 sept dans le paquet.',
        en: 'Hitting your set: only 2 sevens remain in the deck.' },
    ],
  },
  // ── Two overcards — 6 outs ───────────────────────────────────────────────
  {
    heroCards: ['As', 'Ks'], board: ['7d', '8c', '2h'], street: 'flop',
    outs: 6, difficulty: 'medium',
    draws: [
      { fr: 'Deux surcartes : toucher une paire d\'as (3 as) ou de rois (3 rois) = 6 outs.',
        en: 'Two overcards: pairing your ace (3 aces) or king (3 kings) = 6 outs.' },
    ],
  },
  // ── Flush draw + gutshot — 12 outs ───────────────────────────────────────
  {
    heroCards: ['Ah', 'Qh'], board: ['Kh', 'Jc', '2h'], street: 'flop',
    outs: 12, difficulty: 'medium',
    draws: [
      { fr: 'Tirage couleur (cœur) : 9 cœurs restants.',
        en: 'Flush draw (hearts): 9 hearts left.' },
      { fr: 'Tirage quinte par le ventre (10 pour A-K-Q-J-10) : 3 dix supplémentaires (le 10 de cœur est déjà compté).',
        en: 'Gutshot (a 10 for A-K-Q-J-10): 3 extra tens (the ten of hearts is already counted).' },
    ],
  },
  // ── Flush draw + open-ended — 15 outs ────────────────────────────────────
  {
    heroCards: ['9h', '8h'], board: ['7c', 'Th', '2h'], street: 'flop',
    outs: 15, difficulty: 'hard',
    draws: [
      { fr: 'Tirage couleur (cœur) : 9 cœurs restants.',
        en: 'Flush draw (hearts): 9 hearts left.' },
      { fr: 'Tirage quinte par les deux bouts (7-8-9-10) : un 6 ou un valet, soit 6 cartes en plus (le 6♥ et le J♥ sont déjà comptés).',
        en: 'Open-ended (7-8-9-10): a 6 or a jack, i.e. 6 extra cards (the 6♥ and J♥ are already counted).' },
    ],
  },
  // ── Flush draw on the turn — 9 outs ──────────────────────────────────────
  {
    heroCards: ['Ad', 'Kd'], board: ['5d', '9d', 'Jc', '2s'], street: 'turn',
    outs: 9, difficulty: 'medium',
    draws: [
      { fr: 'Tirage couleur (carreau) : 9 carreaux restants, une seule carte à venir (la river).',
        en: 'Flush draw (diamonds): 9 diamonds left, with only the river to come.' },
    ],
  },
  // ── Open-ended on the turn — 8 outs ──────────────────────────────────────
  {
    heroCards: ['Jc', 'Td'], board: ['9h', '8s', '3c', '2d'], street: 'turn',
    outs: 8, difficulty: 'medium',
    draws: [
      { fr: 'Tirage quinte par les deux bouts (8-9-10-J) : une dame (×4) ou un 7 (×4) à la river.',
        en: 'Open-ended straight draw (8-9-10-J): a queen (×4) or a 7 (×4) on the river.' },
    ],
  },
  // ── Pocket pair → set — 2 outs (nines) ───────────────────────────────────
  {
    heroCards: ['9c', '9d'], board: ['Ah', 'Ks', '4c'], street: 'flop',
    outs: 2, difficulty: 'easy',
    draws: [
      { fr: 'Toucher ton brelan : il ne reste que 2 neuf dans le paquet.',
        en: 'Hitting your set: only 2 nines remain in the deck.' },
    ],
  },
  // ── Pocket pair → set — 2 outs (fives) ───────────────────────────────────
  {
    heroCards: ['5s', '5h'], board: ['Qd', '8c', '2h'], street: 'flop',
    outs: 2, difficulty: 'easy',
    draws: [
      { fr: 'Toucher ton brelan : il ne reste que 2 cinq dans le paquet.',
        en: 'Hitting your set: only 2 fives remain in the deck.' },
    ],
  },
  // ── One overcard — 3 outs ────────────────────────────────────────────────
  {
    heroCards: ['Ac', '6d'], board: ['Qs', '9h', '3c'], street: 'flop',
    outs: 3, difficulty: 'medium',
    draws: [
      { fr: 'Une seule surcarte qui compte : l\'As (le 6 est trop bas pour gagner). Toucher une paire d\'as = 3 as restants.',
        en: 'Only one useful overcard: the ace (the 6 is too low to win). Pairing your ace = 3 aces left.' },
    ],
  },
  // ── Pair + overcard kicker — 5 outs ──────────────────────────────────────
  {
    heroCards: ['Ad', '8c'], board: ['8h', '6s', '2d'], street: 'flop',
    outs: 5, difficulty: 'medium',
    draws: [
      { fr: 'Paire de 8 avec kicker As : passer brelan (2 huit) ou toucher une paire d\'as (3 as) = 5 outs.',
        en: 'Pair of eights, ace kicker: make trips (2 eights) or pair your ace (3 aces) = 5 outs.' },
    ],
  },
  // ── Broadway gutshot — 4 outs ────────────────────────────────────────────
  {
    heroCards: ['Js', 'Ts'], board: ['Ad', 'Kc', '4h'], street: 'flop',
    outs: 4, difficulty: 'easy',
    draws: [
      { fr: 'Tirage quinte par le ventre (A-K-_-J-10) : seule une dame (×4) complète la quinte Broadway.',
        en: 'Gutshot straight draw (A-K-_-J-10): only a queen (×4) completes Broadway.' },
    ],
  },
  // ── Open-ended low — 8 outs ──────────────────────────────────────────────
  {
    heroCards: ['6c', '5c'], board: ['7d', '4h', 'Ks'], street: 'flop',
    outs: 8, difficulty: 'easy',
    draws: [
      { fr: 'Tirage quinte par les deux bouts (4-5-6-7) : un 3 (×4) ou un 8 (×4) complète la quinte.',
        en: 'Open-ended straight draw (4-5-6-7): any 3 (×4) or any 8 (×4) makes the straight.' },
    ],
  },
  // ── Flush draw (spades) — 9 outs ─────────────────────────────────────────
  {
    heroCards: ['8s', '3s'], board: ['Ks', '7s', '2d'], street: 'flop',
    outs: 9, difficulty: 'easy',
    draws: [
      { fr: 'Tirage couleur (pique) : il reste 9 piques dans le paquet (13 − 4 visibles).',
        en: 'Flush draw (spades): 9 spades left in the deck (13 − 4 visible).' },
    ],
  },
  // ── Two overcards — 6 outs (K/Q) ─────────────────────────────────────────
  {
    heroCards: ['Ks', 'Qd'], board: ['8h', '5c', '2s'], street: 'flop',
    outs: 6, difficulty: 'medium',
    draws: [
      { fr: 'Deux surcartes : toucher une paire de rois (3 rois) ou de dames (3 dames) = 6 outs.',
        en: 'Two overcards: pairing your king (3 kings) or queen (3 queens) = 6 outs.' },
    ],
  },
  // ── Flush draw on the turn (clubs) — 9 outs ──────────────────────────────
  {
    heroCards: ['Ac', 'Tc'], board: ['4c', '8c', 'Jd', '2h'], street: 'turn',
    outs: 9, difficulty: 'medium',
    draws: [
      { fr: 'Tirage couleur (trèfle) : 9 trèfles restants, une seule carte à venir (la river).',
        en: 'Flush draw (clubs): 9 clubs left, with only the river to come.' },
    ],
  },
];

// ─── Randomized scenario generation ──────────────────────────────────────────
// Generators vary the actual cards while provably preserving the outs count, so
// the same principle (e.g. pocket pair → set = 2 outs) shows up with different
// hands instead of repeating the exact same cards (77→2, A8o→5, …).

const RANK_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUIT_CHARS = ['h', 'd', 'c', 's'];
const rv   = (r: string) => RANK_ORDER.indexOf(r) + 2;          // 2..14
const disp = (r: string) => (r === 'T' ? '10' : r);
const randInt = (n: number) => Math.floor(Math.random() * n);
const choice  = <T,>(a: T[]): T => a[randInt(a.length)];
function shuffled<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = randInt(i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
const allDistinct = (cards: string[]) => new Set(cards).size === cards.length;

// True if the distinct rank values contain a 4-card straight draw (open or gutshot).
function hasStraightDraw(rankVals: number[]): boolean {
  const set = new Set(rankVals);
  if (set.has(14)) set.add(1);   // ace can play low (A-2-3-4-5)
  for (let low = 1; low <= 10; low++) {
    let count = 0;
    for (let v = low; v <= low + 4; v++) if (set.has(v)) count++;
    if (count >= 4) return true;
  }
  return false;
}

type Gen = () => OutsScenario;

// Pocket pair → set: 2 outs. Rainbow board, no straight connection.
const genPocketPairSet: Gen = () => {
  for (;;) {
    const R = choice(RANK_ORDER);
    const [s1, s2] = shuffled(SUIT_CHARS);
    const hero: [string, string] = [R + s1, R + s2];
    const boardRanks = shuffled(RANK_ORDER.filter(r => r !== R)).slice(0, 3);
    const bs = shuffled(SUIT_CHARS).slice(0, 3);                // 3 distinct suits → no flush
    const board = boardRanks.map((r, i) => r + bs[i]);
    if (!allDistinct([...hero, ...board])) continue;
    if (hasStraightDraw([rv(R), ...boardRanks.map(rv)])) continue;
    return {
      heroCards: hero, board, street: 'flop', outs: 2, difficulty: 'easy',
      draws: [{
        fr: `Paire servie de ${disp(R)} → toucher ton brelan : il ne reste que 2 cartes de ${disp(R)} dans le paquet.`,
        en: `Pocket pair of ${disp(R)}s → hitting your set: only 2 cards of rank ${disp(R)} remain.`,
      }],
    };
  }
};

// Pair + overcard kicker: 5 outs (trips + pairing the overcard). E.g. K7o on 7-x-x.
const genPairOver: Gen = () => {
  for (;;) {
    const P = choice(RANK_ORDER.filter(r => rv(r) <= 11));      // paired rank (≤ J)
    const H = choice(RANK_ORDER.filter(r => rv(r) > rv(P)));    // overcard kicker
    const [hs, ks] = shuffled(SUIT_CHARS);                      // hero offsuit
    const hero: [string, string] = [H + hs, P + ks];
    const pSuit = choice(SUIT_CHARS.filter(s => s !== ks));     // the board's matching P card
    const lows  = shuffled(RANK_ORDER.filter(r => rv(r) < rv(H) && r !== P)).slice(0, 2);
    if (lows.length < 2) continue;
    const lowSuits = shuffled(SUIT_CHARS).slice(0, 2);
    const board = [P + pSuit, lows[0] + lowSuits[0], lows[1] + lowSuits[1]];
    if (!allDistinct([...hero, ...board])) continue;
    if (hasStraightDraw([rv(H), rv(P), rv(lows[0]), rv(lows[1])])) continue;
    const bySuit: Record<string, number> = {};
    for (const c of [...hero, ...board]) bySuit[c[1]] = (bySuit[c[1]] || 0) + 1;
    if (Object.values(bySuit).some(n => n >= 4)) continue;      // no flush draw
    return {
      heroCards: hero, board, street: 'flop', outs: 5, difficulty: 'medium',
      draws: [{
        fr: `Paire de ${disp(P)} avec kicker ${disp(H)} : passer brelan (2 ${disp(P)} restants) ou toucher une paire de ${disp(H)} (3 ${disp(H)} restants) = 5 outs.`,
        en: `Pair of ${disp(P)}s, ${disp(H)} kicker: make trips (2 ${disp(P)} left) or pair your ${disp(H)} (3 ${disp(H)} left) = 5 outs.`,
      }],
    };
  }
};

// Two overcards: 6 outs. Both hero cards above the board, rainbow, no straight.
const genTwoOver: Gen = () => {
  for (;;) {
    const [h1, h2] = shuffled(RANK_ORDER.filter(r => rv(r) >= 9)).slice(0, 2);
    if (!h1 || !h2) continue;
    const hi = Math.min(rv(h1), rv(h2));
    const [s1, s2] = shuffled(SUIT_CHARS);                      // offsuit
    const hero: [string, string] = [h1 + s1, h2 + s2];
    const boardRanks = shuffled(RANK_ORDER.filter(r => rv(r) < hi)).slice(0, 3);
    if (boardRanks.length < 3) continue;
    const bs = shuffled(SUIT_CHARS).slice(0, 3);
    const board = boardRanks.map((r, i) => r + bs[i]);
    if (!allDistinct([...hero, ...board])) continue;
    if (hasStraightDraw([rv(h1), rv(h2), ...boardRanks.map(rv)])) continue;
    return {
      heroCards: hero, board, street: 'flop', outs: 6, difficulty: 'medium',
      draws: [{
        fr: `Deux surcartes : toucher une paire de ${disp(h1)} (3 restants) ou de ${disp(h2)} (3 restants) = 6 outs.`,
        en: `Two overcards: pairing your ${disp(h1)} (3 left) or ${disp(h2)} (3 left) = 6 outs.`,
      }],
    };
  }
};

// Flush draw: 9 outs. Four of one suit visible, no straight draw on top.
const genFlush: Gen = () => {
  for (;;) {
    const S = choice(SUIT_CHARS);
    const heroRanks = shuffled(RANK_ORDER).slice(0, 2);
    const hero: [string, string] = [heroRanks[0] + S, heroRanks[1] + S];
    const sRanks = shuffled(RANK_ORDER.filter(r => !heroRanks.includes(r))).slice(0, 2);
    const offRank = choice(RANK_ORDER.filter(r => !heroRanks.includes(r) && !sRanks.includes(r)));
    const offSuit = choice(SUIT_CHARS.filter(s => s !== S));
    const board = [sRanks[0] + S, sRanks[1] + S, offRank + offSuit];
    if (!allDistinct([...hero, ...board])) continue;
    if (hasStraightDraw([...heroRanks.map(rv), ...sRanks.map(rv), rv(offRank)])) continue;
    return {
      heroCards: hero, board, street: 'flop', outs: 9, difficulty: 'easy',
      draws: [{
        fr: 'Tirage couleur : 4 cartes de la couleur sont visibles, il en reste donc 9 dans le paquet (13 − 4).',
        en: 'Flush draw: 4 cards of the suit are visible, so 9 remain in the deck (13 − 4).',
      }],
    };
  }
};

const GENERATORS: Gen[] = [genPocketPairSet, genPairOver, genTwoOver, genFlush];

export function getRandomOutsScenario(): OutsScenario {
  // 70% freshly generated (varied cards), 30% from the hand-verified list
  // (which covers the combos/gutshots/OESD that aren't auto-generated).
  if (Math.random() < 0.7) return choice(GENERATORS)();
  return OUTS_SCENARIOS[randInt(OUTS_SCENARIOS.length)];
}

// Estimated equity with the Rule of 2 & 4.
export function estimateEquityFromOuts(outs: number, street: 'flop' | 'turn'): number {
  return street === 'flop' ? outs * 4 : outs * 2;
}

// Build 4 multiple-choice options around the correct answer.
export function buildOutsOptions(correct: number): number[] {
  const pool = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15];
  // Prefer distractors close to the correct answer so the choices stay plausible.
  const distractors = pool
    .filter(n => n !== correct)
    .sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct))
    .slice(0, 5);
  // shuffle distractors
  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }
  const options = [correct, ...distractors.slice(0, 3)];
  // shuffle final options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

export function buildOutsExplanation(scenario: OutsScenario, lang: 'fr' | 'en' = 'fr'): string {
  const { outs, draws, street } = scenario;
  const eqRiver = outs * 4;   // both cards to come (flop)
  const eqNext = outs * 2;    // single card to come

  if (lang === 'en') {
    const lines: string[] = [];
    lines.push(`You have **${outs} outs** — the cards that turn your hand into a likely winner.`);
    lines.push('');
    for (const d of draws) lines.push(`• ${d.en}`);
    lines.push('');
    lines.push('**Rule of 2 & 4:**');
    if (street === 'flop') {
      lines.push(`On the flop, multiply your outs by 4 to estimate your equity by the river: ${outs} × 4 ≈ **${eqRiver}%**.`);
      lines.push(`For a single card to come, multiply by 2 instead: ${outs} × 2 ≈ ${eqNext}%.`);
    } else {
      lines.push(`On the turn, multiply your outs by 2 for the single remaining card (the river): ${outs} × 2 ≈ **${eqNext}%**.`);
    }
    return lines.join('\n');
  }

  const lines: string[] = [];
  lines.push(`Tu as **${outs} outs** — les cartes qui transforment ta main en main probablement gagnante.`);
  lines.push('');
  for (const d of draws) lines.push(`• ${d.fr}`);
  lines.push('');
  lines.push('**Règle de 2 et 4 :**');
  if (street === 'flop') {
    lines.push(`Sur le flop, multiplie tes outs par 4 pour estimer ton équité d'ici la river : ${outs} × 4 ≈ **${eqRiver}%**.`);
    lines.push(`Pour une seule carte à venir, multiplie plutôt par 2 : ${outs} × 2 ≈ ${eqNext}%.`);
  } else {
    lines.push(`Sur la turn, multiplie tes outs par 2 pour l'unique carte restante (la river) : ${outs} × 2 ≈ **${eqNext}%**.`);
  }
  return lines.join('\n');
}
