import { describe, it, expect } from 'vitest';
import { getCEOScore } from '../lib/ceo-reputation';

describe('getCEOScore', () => {
  it('returns -1 for unknown symbol', () => {
    const { score, innovatorScore, ceo } = getCEOScore('UNKNOWN');
    expect(score).toBe(-1);
    expect(innovatorScore).toBe(-1);
    expect(ceo).toBeNull();
  });

  it('Jensen Huang (NVDA): Buffett score ~98, Innovator score 100', () => {
    const { score, innovatorScore, ceo } = getCEOScore('NVDA');
    expect(ceo).not.toBeNull();
    expect(ceo!.isFounder).toBe(true);
    expect(score).toBeGreaterThanOrEqual(95);   // Buffett: capital discipline
    expect(innovatorScore).toBe(100);           // Innovator: created AI computing
  });

  it('Elon Musk (TSLA): Buffett score lower than innovator score', () => {
    const { score, innovatorScore, ceo } = getCEOScore('TSLA');
    expect(ceo!.isFounder).toBe(true);
    expect(score).toBeLessThan(innovatorScore); // Controversy penalty hits Buffett score harder
    expect(innovatorScore).toBeGreaterThan(80); // High societal impact
  });

  it('Son Masayoshi (9984.T): innovator score > 85', () => {
    const { score, innovatorScore } = getCEOScore('9984.T');
    expect(innovatorScore).toBeGreaterThan(85); // Alibaba bet, ARM, Vision Fund
    expect(score).toBeGreaterThan(60);
  });

  it('Tim Cook (AAPL): Buffett score > innovator score (capital allocator, not founder)', () => {
    const { score, innovatorScore, ceo } = getCEOScore('AAPL');
    expect(ceo!.isFounder).toBe(false);
    expect(score).toBeGreaterThan(innovatorScore); // Strong buybacks beat innovation lens
  });

  it('scores are bounded 0-100', () => {
    const symbols = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META', 'TSLA', 'AMZN', 'V', 'MA', 'BRK-B'];
    for (const sym of symbols) {
      const { score, innovatorScore } = getCEOScore(sym);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(innovatorScore).toBeGreaterThanOrEqual(0);
      expect(innovatorScore).toBeLessThanOrEqual(100);
    }
  });
});
