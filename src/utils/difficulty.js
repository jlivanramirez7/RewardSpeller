/**
 * @module difficulty
 * @description Utility module for calculating the recommended starting difficulty mode
 * for a spelling assessment based on the student's past performance accuracy matrices.
 */

/**
 * Calculates the recommended difficulty mode ('easy', 'medium', or 'hard').
 * Progression logic: If Medium accuracy >= 90%, recommend Hard.
 * If Easy accuracy >= 90%, recommend Medium. Otherwise, recommend Easy.
 *
 * @param {string|number} sectionId - Unique identifier of the curriculum section.
 * @param {Object.<string, number>} sectionAccuracy - Dictionary mapping section-difficulty keys to accuracy percentages.
 * @returns {string} Recommended difficulty mode ('easy', 'medium', or 'hard').
 */
export const calculateRecommendedDifficulty = (sectionId, sectionAccuracy) => {
  const easyAcc = sectionAccuracy[`${sectionId}-easy`] || 0;
  const medAcc = sectionAccuracy[`${sectionId}-medium`] || 0;
  
  if (medAcc >= 90) return 'hard';
  if (easyAcc >= 90) return 'medium';
  return 'easy';
};
