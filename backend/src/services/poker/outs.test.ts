import { describe, it, expect } from 'vitest';
import { getRandomOutsScenario, estimateEquityFromOuts, buildOutsOptions, randomDrawShape, OUTS_SCENARIOS } from './outs';

/** A card string is valid when it's a known rank + suit, e.g. "Ah", "Td". */
const CARD_RE = /^([2-9TJQKA])([hdcs])$/;

function expectDistinctValidCards(cards: string[]) {
  for (const c of cards) expect(c).toMatch(CARD_RE);
  expect(new Set(cards).size).toBe(cards.length); // no duplicate card anywhere
}

describe('estimateEquityFromOuts — Rule of 2 & 4', () => {
  it('multiplies by 4 on the flop, by 2 on the turn', () => {
    expect(estimateEquityFromOuts(9, 'flop')).toBe(36);
    expect(estimateEquityFromOuts(9, 'turn')).toBe(18);
  });
});

describe('buildOutsOptions', () => {
  it('always returns exactly 4 distinct, positive options including the correct answer', () => {
    for (const correct of [2, 4, 8, 9, 12, 15]) {
      const opts = buildOutsOptions(correct);
      expect(opts).toHaveLength(4);
      expect(new Set(opts).size).toBe(4);
      expect(opts).toContain(correct);
      for (const o of opts) expect(o).toBeGreaterThan(0);
    }
  });

  it('always includes the trap distractor when one is given', () => {
    const opts = buildOutsOptions(12, 13);
    expect(opts).toContain(12);
    expect(opts).toContain(13);
  });
});

describe('getRandomOutsScenario — card validity across every generator', () => {
  it('basic/advanced: every scenario deals distinct, valid cards, and outs > 0', () => {
    for (let i = 0; i < 200; i++) {
      const s = getRandomOutsScenario();
      expectDistinctValidCards([...s.heroCards, ...s.board]);
      expect(s.outs).toBeGreaterThan(0);
      expect(s.heroCards).toHaveLength(2);
      expect([3, 4]).toContain(s.board.length); // flop or turn
    }
  });

  it('expert: every scenario deals distinct, valid cards, and outs > 0', () => {
    for (let i = 0; i < 200; i++) {
      const s = getRandomOutsScenario('expert');
      expectDistinctValidCards([...s.heroCards, ...s.board]);
      expect(s.outs).toBeGreaterThan(0);
    }
  });

  it('the hand-verified static pool is internally consistent (card count, distinctness)', () => {
    for (const s of OUTS_SCENARIOS) {
      expectDistinctValidCards([...s.heroCards, ...s.board]);
      expect(s.outs).toBeGreaterThan(0);
    }
  });
});

describe('randomDrawShape — reused by Pot Odds for card variety', () => {
  it('returns the requested outs count and street for every mapped target', () => {
    const targets: { outs: number; street: 'flop' | 'turn' }[] = [
      { outs: 4, street: 'flop' }, { outs: 6, street: 'flop' }, { outs: 8, street: 'flop' },
      { outs: 9, street: 'flop' }, { outs: 12, street: 'flop' },
      { outs: 9, street: 'turn' }, { outs: 8, street: 'turn' },
    ];
    for (const t of targets) {
      for (let i = 0; i < 10; i++) {
        const shape = randomDrawShape(t.outs, t.street);
        expect(shape.outs).toBe(t.outs);
        expect(shape.street).toBe(t.street);
        expectDistinctValidCards([...shape.heroCards, ...shape.board]);
        expect(shape.board).toHaveLength(t.street === 'flop' ? 3 : 4);
      }
    }
  });
});
