import { Card } from '../../types';
import { createDeck, removeCards, shuffleDeck } from './cards';
import { compareHands } from './handEvaluator';

export interface EquityResult {
  hand1WinPct: number;
  hand2WinPct: number;
  tiePct: number;
  simulations: number;
}

// Monte Carlo equity simulation
export function calculateEquity(
  hand1: [Card, Card],
  hand2: [Card, Card],
  board: Card[] = [],
  simulations = 5000
): EquityResult {
  const knownCards = [...hand1, ...hand2, ...board];
  let hand1Wins = 0;
  let hand2Wins = 0;
  let ties = 0;

  const remainingBoard = 5 - board.length;

  for (let i = 0; i < simulations; i++) {
    const deck = shuffleDeck(removeCards(createDeck(), knownCards));
    const runout = deck.slice(0, remainingBoard);
    const fullBoard = [...board, ...runout] as Card[];

    const cards1 = [...hand1, ...fullBoard] as Card[];
    const cards2 = [...hand2, ...fullBoard] as Card[];

    const result = compareHands(cards1, cards2);
    if (result === 1) hand1Wins++;
    else if (result === -1) hand2Wins++;
    else ties++;
  }

  return {
    hand1WinPct: Math.round((hand1Wins / simulations) * 1000) / 10,
    hand2WinPct: Math.round((hand2Wins / simulations) * 1000) / 10,
    tiePct: Math.round((ties / simulations) * 1000) / 10,
    simulations,
  };
}

// Quick approximate equity for common pre-flop matchups (for exercises)
export function approximateEquity(hand1: string, hand2: string): EquityResult {
  const EQUITY_TABLE: Record<string, number> = {
    // AA vs...
    'AA_KK': 82, 'AA_QQ': 83, 'AA_JJ': 84, 'AA_TT': 83, 'AA_99': 84, 'AA_88': 84,
    'AA_AKs': 89, 'AA_AQs': 90, 'AA_AKo': 89, 'AA_KQs': 78,
    // KK vs...
    'KK_QQ': 82, 'KK_JJ': 82, 'KK_TT': 83, 'KK_AKs': 64, 'KK_AKo': 65,
    // QQ vs...
    'QQ_JJ': 81, 'QQ_TT': 81, 'QQ_AKs': 53, 'QQ_AKo': 55,
    // AKs vs...
    'AKs_QQ': 47, 'AKs_JJ': 47, 'AKs_TT': 48, 'AKs_AQs': 75, 'AKs_KQs': 67,
    // Coin flip type matchups
    'JJ_AKo': 55, 'TT_AKo': 55, 'TT_AQo': 57,
  };

  const key1 = `${hand1}_${hand2}`;
  const key2 = `${hand2}_${hand1}`;

  if (EQUITY_TABLE[key1] !== undefined) {
    const pct = EQUITY_TABLE[key1];
    return { hand1WinPct: pct, hand2WinPct: 100 - pct - 1, tiePct: 1, simulations: 0 };
  }
  if (EQUITY_TABLE[key2] !== undefined) {
    const pct = EQUITY_TABLE[key2];
    return { hand1WinPct: 100 - pct - 1, hand2WinPct: pct, tiePct: 1, simulations: 0 };
  }

  // Default for unknown matchups
  return { hand1WinPct: 50, hand2WinPct: 50, tiePct: 0, simulations: 0 };
}
