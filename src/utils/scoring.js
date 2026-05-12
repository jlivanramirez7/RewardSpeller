export const DIFFICULTY_POINTS = {
  easy: 1,
  medium: 3,
  hard: 30
};

export const calculateFinalSessionScore = (wordsLength, difficulty, accumulatedScore, isPerfect) => {
  if (isPerfect) {
    return wordsLength * DIFFICULTY_POINTS[difficulty] * 2;
  }
  return accumulatedScore;
};
