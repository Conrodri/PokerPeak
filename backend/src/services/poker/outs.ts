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
];

export function getRandomOutsScenario(): OutsScenario {
  return OUTS_SCENARIOS[Math.floor(Math.random() * OUTS_SCENARIOS.length)];
}

// Estimated equity with the Rule of 2 & 4.
export function estimateEquityFromOuts(outs: number, street: 'flop' | 'turn'): number {
  return street === 'flop' ? outs * 4 : outs * 2;
}

// Build 4 multiple-choice options around the correct answer.
export function buildOutsOptions(correct: number): number[] {
  const pool = [2, 4, 6, 8, 9, 12, 13, 15];
  const distractors = pool.filter(n => n !== correct);
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
