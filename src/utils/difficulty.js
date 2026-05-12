export const calculateRecommendedDifficulty = (sectionId, sectionAccuracy) => {
  const easyAcc = sectionAccuracy[`${sectionId}-easy`] || 0;
  const medAcc = sectionAccuracy[`${sectionId}-medium`] || 0;
  
  if (medAcc >= 90) return 'hard';
  if (easyAcc >= 90) return 'medium';
  return 'easy';
};
