/**
 * @module wordle
 * @description Utility module for the "Daily Spellerle" word game. Implements date-shifting algorithms,
 * deterministic wordbank selectors, time-based points formulations, and evaluation matrix engines.
 */

/**
 * Calculates the shifted Wordle date key (YYYY-MM-DD).
 * Subtracts exactly 6 hours to enforce a synchronous 6:00 AM daily rollover instead of midnight.
 *
 * @param {Date} [date=new Date()] - The base Date object.
 * @returns {string} The shifted date string (e.g., '2026-05-28').
 */
export const getWordleDateKey = (date = new Date()) => {
  const shifted = new Date(date.getTime() - (6 * 60 * 60 * 1000));
  const year = shifted.getFullYear();
  const month = String(shifted.getMonth() + 1).padStart(2, '0');
  const day = String(shifted.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Deterministically selects a shared 5-letter word for the day across a grade's curriculum.
 *
 * @param {Object[]} tiers - Array of curriculum tiers for the active grade level.
 * @param {string} [dateKey] - The shifted date key string.
 * @returns {Object|null} The selected word object containing { word, definition, sentence, id, tierRule }, or null.
 */
export const getDailyWord = (tiers, dateKey = getWordleDateKey()) => {
  if (!tiers || !Array.isArray(tiers)) return null;

  const fiveLetterWords = [];
  
  tiers.forEach((tier) => {
    if (tier && tier.sections && Array.isArray(tier.sections)) {
      tier.sections.forEach((section) => {
        if (section && section.words && Array.isArray(section.words)) {
          section.words.forEach((wordObj) => {
            if (wordObj && wordObj.word && wordObj.word.trim().length === 5) {
              // Ensure we don't pick hyphenated or spaced terms if any exist
              const cleanWord = wordObj.word.trim();
              if (/^[a-zA-Z]{5}$/.test(cleanWord)) {
                fiveLetterWords.push({
                  word: cleanWord.toLowerCase(),
                  definition: wordObj.definition || '',
                  sentence: wordObj.sentence || '',
                  sectionId: section.id,
                  tierRule: section.rule || tier.rule || ''
                });
              }
            }
          });
        }
      });
    }
  });

  if (fiveLetterWords.length === 0) return null;

  // Generate a deterministic index seed from the dateKey string (e.g., "2026-05-28")
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = dateKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  const deterministicIndex = Math.abs(hash) % fiveLetterWords.length;
  
  return fiveLetterWords[deterministicIndex];
};

/**
 * Calculates the multi-factor isolated Wordle score.
 * Formula: ((7 - Attempts) * 100) + Math.max(0, 300 - Seconds)
 *
 * @param {number} attempts - Number of guesses taken (1 to 6).
 * @param {number} secondsTaken - Total elapsed seconds in the timer.
 * @param {boolean} isPerfect - True if guessed correctly, false if failed (0 pts).
 * @returns {number} The calculated Wordle points.
 */
export const calculateWordleScore = (attempts, secondsTaken, isPerfect = true) => {
  if (!isPerfect || attempts > 6 || attempts < 1) return 0;
  const attemptPoints = (7 - attempts) * 100;
  const timePoints = Math.max(0, 300 - secondsTaken);
  return attemptPoints + timePoints;
};

/**
 * Evaluates a 5-letter guess against the target word.
 * Returns an array of 5 feedback status strings: 'correct' (green), 'present' (yellow), or 'absent' (grey).
 * Correctly handles duplicate letters in both the guess and target word.
 *
 * @param {string} guess - The 5-letter user guess.
 * @param {string} target - The 5-letter daily target word.
 * @returns {string[]} Array of status strings.
 */
export const evaluateGuess = (guess, target) => {
  if (!guess || !target || guess.length !== 5 || target.length !== 5) {
    return Array(5).fill('absent');
  }

  const cleanGuess = guess.toLowerCase();
  const cleanTarget = target.toLowerCase();
  const result = Array(5).fill('absent');
  const targetMatches = Array(5).fill(false);

  // Pass 1: Identify 'correct' letters (Green)
  for (let i = 0; i < 5; i++) {
    if (cleanGuess[i] === cleanTarget[i]) {
      result[i] = 'correct';
      targetMatches[i] = true;
    }
  }

  // Pass 2: Identify 'present' letters (Yellow)
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;

    for (let j = 0; j < 5; j++) {
      if (!targetMatches[j] && cleanGuess[i] === cleanTarget[j]) {
        result[i] = 'present';
        targetMatches[j] = true;
        break;
      }
    }
  }

  return result;
};
