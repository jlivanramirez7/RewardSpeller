/**
 * @module scoring
 * @description Mathematical scoring engine for spelling assessments. Defines point multipliers
 * and calculates accumulated session scores based on difficulty tracks and streak bonuses.
 */

/**
 * Base point values awarded per correctly spelled word across progressive difficulty tiers.
 * @constant {Object.<string, number>}
 */
export const DIFFICULTY_POINTS = {
  easy: 0.5,
  medium: 3,
  hard: 30
};

/**
 * Calculates the final session score.
 * Perfect Session Override: Achieving 100% accuracy awards the maximum possible points
 * by applying a maximum 2.0x multiplier to all words in the session.
 *
 * @param {number} wordsLength - Total number of words in the assessment session.
 * @param {string} difficulty - Active difficulty mode ('easy', 'medium', or 'hard').
 * @param {number} accumulatedScore - Running score accumulated during the session.
 * @param {boolean} isPerfect - True if the student achieved 100% accuracy (0 incorrect attempts).
 * @returns {number} The finalized session score.
 */
export const calculateFinalSessionScore = (wordsLength, difficulty, accumulatedScore, isPerfect) => {
  if (isPerfect) {
    return wordsLength * DIFFICULTY_POINTS[difficulty] * 2;
  }
  return accumulatedScore;
};

/**
 * Calculates the maximum possible points for a section of a given word count.
 * Sums the max points for Easy, Medium, and Hard difficulties.
 *
 * @param {number} wordCount - Number of words in the section.
 * @returns {number} The maximum possible points (wordCount * 68).
 */
export const calculateMaxPointsForSection = (wordCount) => {
  const maxEasy = (wordCount * 2) * DIFFICULTY_POINTS.easy * 2;
  const maxMedium = wordCount * DIFFICULTY_POINTS.medium * 2;
  const maxHard = wordCount * DIFFICULTY_POINTS.hard * 2;
  return maxEasy + maxMedium + maxHard;
};

/**
 * Calculates the maximum possible points for a tier, including sections and mastery assessment.
 *
 * @param {Object} tier - The tier object from curriculum.
 * @returns {number} The maximum possible points for the tier.
 */
export const calculateMaxPointsForTier = (tier) => {
  if (!tier || !tier.sections) return 0;
  const sectionsMax = tier.sections.reduce((acc, sec) => acc + calculateMaxPointsForSection(sec.words?.length || 0), 0);
  
  // Mastery assessment max points (shuffled from all sections, max 15 words)
  let allWords = [];
  tier.sections.forEach(s => allWords.push(...(s.words || [])));
  const masteryWordCount = Math.min(allWords.length, 15);
  const masteryMax = calculateMaxPointsForSection(masteryWordCount);
  
  return sectionsMax + masteryMax;
};

/**
 * Calculates the maximum possible points for the entire curriculum (all tiers).
 *
 * @param {Object[]} tiers - Array of tier objects.
 * @returns {number} The total maximum possible points.
 */
export const calculateMaxPointsForCurriculum = (tiers) => {
  if (!tiers || !Array.isArray(tiers)) return 0;
  return tiers.reduce((acc, tier) => acc + calculateMaxPointsForTier(tier), 0);
};

