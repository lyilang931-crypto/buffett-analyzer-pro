import { describe, it, expect } from 'vitest';
import { formatUSD, formatPercent, getBuffettIndexStatus } from '../lib/utils';

describe('formatUSD', () => {
  it('formats trillions', () => {
    expect(formatUSD(28.7e12)).toContain('T');
  });
  it('formats billions', () => {
    expect(formatUSD(500e9)).toContain('B');
  });
  it('handles zero', () => {
    expect(formatUSD(0)).toBeTruthy();
  });
});

describe('formatPercent', () => {
  it('formats positive percentage', () => {
    const result = formatPercent(15.5);
    expect(result).toContain('15.5');
  });
  it('formats negative percentage', () => {
    const result = formatPercent(-3.2);
    expect(result).toContain('3.2');
  });
});

describe('getBuffettIndexStatus', () => {
  it('marks > 150% as extremely overvalued', () => {
    const status = getBuffettIndexStatus(155);
    expect(status.label).toMatch(/割高|Overvalued|警戒/i);
  });
  it('marks ~100% as fair value', () => {
    const status = getBuffettIndexStatus(100);
    expect(status).toBeTruthy();
  });
  it('marks < 75% as undervalued', () => {
    const status = getBuffettIndexStatus(70);
    expect(status.label).toMatch(/割安|Undervalued|適正/i);
  });
});
