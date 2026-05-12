import { describe, it, expect } from 'vitest';
import { calculateRecommendedDifficulty } from '../utils/difficulty';

describe('calculateRecommendedDifficulty', () => {
  it('should return easy if no accuracy data', () => {
    const sectionAccuracy = {};
    const result = calculateRecommendedDifficulty('section1', sectionAccuracy);
    expect(result).toBe('easy');
  });

  it('should return easy if easy accuracy is less than 90', () => {
    const sectionAccuracy = { 'section1-easy': 80 };
    const result = calculateRecommendedDifficulty('section1', sectionAccuracy);
    expect(result).toBe('easy');
  });

  it('should return medium if easy accuracy is >= 90 and medium is missing or < 90', () => {
    const sectionAccuracy = { 'section1-easy': 90 };
    const result = calculateRecommendedDifficulty('section1', sectionAccuracy);
    expect(result).toBe('medium');
  });

  it('should return medium if easy accuracy is >= 90 and medium accuracy is < 90', () => {
    const sectionAccuracy = { 'section1-easy': 90, 'section1-medium': 80 };
    const result = calculateRecommendedDifficulty('section1', sectionAccuracy);
    expect(result).toBe('medium');
  });

  it('should return hard if medium accuracy is >= 90', () => {
    const sectionAccuracy = { 'section1-easy': 90, 'section1-medium': 90 };
    const result = calculateRecommendedDifficulty('section1', sectionAccuracy);
    expect(result).toBe('hard');
  });
});
