import { describe, it, expect } from 'vitest';
import {
  calculatePotOdds, getRandomScenario, generateEasyPotOddsScenario,
  generateClosePotOddsScenario, generateImpliedOddsScenario, POT_ODDS_SCENARIOS,
} from './potOdds';

describe('calculatePotOdds', () => {
  it('matches the textbook example: pot 10, bet 5 → 25% required equity', () => {
    // call(5) / total(10+5+5=20) = 25%
    const r = calculatePotOdds(10, 5, 30);
    expect(r.requiredEquity).toBeCloseTo(25, 5);
    expect(r.isProfitable).toBe(true); // 30% equity > 25% required
  });

  it('flags a call as unprofitable when equity is below the threshold', () => {
    const r = calculatePotOdds(10, 5, 20); // required 25%, have 20%
    expect(r.isProfitable).toBe(false);
  });

  it('EV is positive exactly when the call is profitable', () => {
    const profitable = calculatePotOdds(10, 5, 40);
    const unprofitable = calculatePotOdds(10, 5, 10);
    expect(profitable.ev).toBeGreaterThan(0);
    expect(unprofitable.ev).toBeLessThan(0);
  });
});

describe('getRandomScenario', () => {
  it('every static scenario has a self-consistent correctAction', () => {
    for (const s of POT_ODDS_SCENARIOS) {
      const required = (s.betSize / (s.potSize + 2 * s.betSize)) * 100;
      const shouldCall = s.heroEquity >= required;
      expect(s.correctAction).toBe(shouldCall ? 'call' : 'fold');
    }
  });

  it('filters by difficulty when requested', () => {
    for (let i = 0; i < 20; i++) {
      expect(getRandomScenario('easy').difficulty).toBe('easy');
      expect(getRandomScenario('hard').difficulty).toBe('hard');
    }
  });
});

describe('generateEasyPotOddsScenario — basic mode procedural generator', () => {
  it('is always clearly non-borderline (>= 8 points from the threshold)', () => {
    for (let i = 0; i < 50; i++) {
      const s = generateEasyPotOddsScenario();
      const required = (s.betSize / (s.potSize + 2 * s.betSize)) * 100;
      expect(Math.abs(s.heroEquity - required)).toBeGreaterThanOrEqual(8);
    }
  });

  it('correctAction matches the equity-vs-threshold comparison', () => {
    for (let i = 0; i < 50; i++) {
      const s = generateEasyPotOddsScenario();
      const required = (s.betSize / (s.potSize + 2 * s.betSize)) * 100;
      expect(s.correctAction).toBe(s.heroEquity >= required ? 'call' : 'fold');
    }
  });
});

describe('generateClosePotOddsScenario — advanced/expert borderline generator', () => {
  it('is always within 3.5 points of the threshold (genuinely close)', () => {
    for (let i = 0; i < 50; i++) {
      const s = generateClosePotOddsScenario();
      const required = (s.betSize / (s.potSize + 2 * s.betSize)) * 100;
      expect(Math.abs(s.heroEquity - required)).toBeLessThanOrEqual(3.5);
    }
  });
});

describe('generateImpliedOddsScenario — expert implied-odds generator', () => {
  it('correctAction is derived from the IMPLIED threshold, not the direct one', () => {
    for (let i = 0; i < 30; i++) {
      const s = generateImpliedOddsScenario();
      const call = s.betSize;
      const totalImplied = s.potSize + s.betSize + call + (s.impliedWinnings ?? 0);
      const impliedRequired = (call / totalImplied) * 100;
      expect(s.correctAction).toBe(s.heroEquity >= impliedRequired ? 'call' : 'fold');
    }
  });

  it('always attaches implied-odds fields', () => {
    const s = generateImpliedOddsScenario();
    expect(s.impliedWinnings).toBeGreaterThan(0);
    expect(s.villainStackBehind).toBeGreaterThan(0);
  });
});
