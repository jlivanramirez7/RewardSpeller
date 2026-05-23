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
