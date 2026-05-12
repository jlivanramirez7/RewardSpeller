import { describe, it, expect } from 'vitest';
import { calculateFinalSessionScore } from './scoring';

describe('calculateFinalSessionScore', () => {
  it('should return accumulated score when not perfect session', () => {
    const wordsLength = 10;
    const difficulty = 'hard';
    const accumulatedScore = 150;
    const isPerfect = false;

    const finalScore = calculateFinalSessionScore(wordsLength, difficulty, accumulatedScore, isPerfect);
    expect(finalScore).toBe(accumulatedScore);
  });

  it('should return max points for perfect session on easy difficulty', () => {
    const wordsLength = 10;
    const difficulty = 'easy';
    const accumulatedScore = 10;
    const isPerfect = true;

    const finalScore = calculateFinalSessionScore(wordsLength, difficulty, accumulatedScore, isPerfect);
    expect(finalScore).toBe(10 * 1 * 2); // wordsLength * basePoints * 2
  });

  it('should return max points for perfect session on medium difficulty', () => {
    const wordsLength = 10;
    const difficulty = 'medium';
    const accumulatedScore = 30;
    const isPerfect = true;

    const finalScore = calculateFinalSessionScore(wordsLength, difficulty, accumulatedScore, isPerfect);
    expect(finalScore).toBe(10 * 3 * 2); // wordsLength * basePoints * 2
  });

  it('should return max points for perfect session on hard difficulty', () => {
    const wordsLength = 10;
    const difficulty = 'hard';
    const accumulatedScore = 300;
    const isPerfect = true;

    const finalScore = calculateFinalSessionScore(wordsLength, difficulty, accumulatedScore, isPerfect);
    expect(finalScore).toBe(10 * 30 * 2); // wordsLength * basePoints * 2
  });
});
