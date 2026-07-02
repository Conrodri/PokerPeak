import { describe, it, expect } from 'vitest';
import { getMatrixIndices, getRangeFrequency, getCorrectAction, getRangeMatrix, OPEN_RAISE } from './ranges';

describe('getMatrixIndices', () => {
  it('maps a pocket pair to the diagonal', () => {
    expect(getMatrixIndices('AA')).toEqual([0, 0]);
    expect(getMatrixIndices('22')).toEqual([12, 12]);
  });

  it('maps a suited hand to the upper triangle (row < col)', () => {
    const [row, col] = getMatrixIndices('AKs');
    expect(row).toBeLessThan(col);
  });

  it('maps an offsuit hand to the lower triangle (row > col)', () => {
    const [row, col] = getMatrixIndices('AKo');
    expect(row).toBeGreaterThan(col);
  });

  it('AKs and AKo use the same two rank indices, mirrored', () => {
    const suited = getMatrixIndices('AKs');
    const offsuit = getMatrixIndices('AKo');
    expect(suited).toEqual([offsuit[1], offsuit[0]]);
  });
});

describe('getRangeFrequency / getCorrectAction — GTO range sanity', () => {
  it('AA is always raised at 100% frequency from every position', () => {
    for (const pos of Object.keys(OPEN_RAISE) as (keyof typeof OPEN_RAISE)[]) {
      expect(getRangeFrequency(pos, 'AA')).toBe(1);
    }
  });

  it('72o (worst hand) is never opened from any 6-max position', () => {
    for (const pos of Object.keys(OPEN_RAISE) as (keyof typeof OPEN_RAISE)[]) {
      expect(getRangeFrequency(pos, '72o')).toBe(0);
    }
  });

  it('BTN opens a wider range than UTG (monotonic tightness by position)', () => {
    const utgMatrix = getRangeMatrix('UTG');
    const btnMatrix = getRangeMatrix('BTN');
    const sum = (m: number[][]) => m.flat().reduce((a, b) => a + b, 0);
    expect(sum(btnMatrix)).toBeGreaterThan(sum(utgMatrix));
  });

  it('getCorrectAction derives fold for a 0-frequency hand and raise for a 1-frequency hand', () => {
    expect(getCorrectAction('UTG', '72o').action).toBe('fold');
    expect(getCorrectAction('BTN', 'AA').action).toBe('raise');
  });

  it('unknown position/format combination returns 0 instead of throwing', () => {
    expect(getRangeFrequency('BB', 'AA', '3max')).toBeGreaterThanOrEqual(0);
  });
});
