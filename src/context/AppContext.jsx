import React, { createContext, useContext, useState, useEffect } from 'react';
import wordBankData from '../data/wordBank.json';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Try to load state from localStorage
  const loadState = (key, defaultValue) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  // Student State
  const [studentPoints, setStudentPoints] = useState(() => loadState('studentPoints', 0));
  const [studentStreak, setStudentStreak] = useState(() => loadState('studentStreak', 0));
  const [unlockedTiers, setUnlockedTiers] = useState(() => loadState('unlockedTiers', [1])); // Tier 1 unlocked by default
  const [struggleWords, setStruggleWords] = useState(() => loadState('struggleWords', []));
  const [sectionScores, setSectionScores] = useState(() => loadState('sectionScores', {})); // Tracks max score per section/diff
  const [sectionAccuracy, setSectionAccuracy] = useState(() => loadState('sectionAccuracy', {})); // Tracks max percentage correct
  const [enablePacing, setEnablePacing] = useState(() => loadState('enablePacing', true)); // Controls rolling window gate
  const [enableDifficultyGating, setEnableDifficultyGating] = useState(() => loadState('enableDifficultyGating', true)); // Forces Easy->Med->Hard sequence
  const [listenedLessons, setListenedLessons] = useState(() => loadState('listenedLessons', []));

  // Parent State
  const [rewards, setRewards] = useState(() => loadState('rewards', [
    { id: 1, name: '30 mins Screen Time', cost: 500 },
    { id: 2, name: 'Trip to Park', cost: 1000 }
  ]));
  const [currentGradeLevel, setCurrentGradeLevel] = useState(() => loadState('currentGradeLevel', '4th-5th'));

  // Curriculum Data
  const [tiers] = useState(wordBankData.tiers);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('studentPoints', JSON.stringify(studentPoints));
    localStorage.setItem('studentStreak', JSON.stringify(studentStreak));
    localStorage.setItem('unlockedTiers', JSON.stringify(unlockedTiers));
    localStorage.setItem('struggleWords', JSON.stringify(struggleWords));
    localStorage.setItem('sectionScores', JSON.stringify(sectionScores));
    localStorage.setItem('sectionAccuracy', JSON.stringify(sectionAccuracy));
    localStorage.setItem('enablePacing', JSON.stringify(enablePacing));
    localStorage.setItem('enableDifficultyGating', JSON.stringify(enableDifficultyGating));
    localStorage.setItem('listenedLessons', JSON.stringify(listenedLessons));
    localStorage.setItem('rewards', JSON.stringify(rewards));
    localStorage.setItem('currentGradeLevel', JSON.stringify(currentGradeLevel));
  }, [studentPoints, studentStreak, unlockedTiers, struggleWords, sectionScores, sectionAccuracy, enablePacing, enableDifficultyGating, listenedLessons, rewards, currentGradeLevel]);

  const addPoints = (points) => {
    setStudentPoints(prev => prev + points);
  };

  const updateSectionScore = (sectionId, difficulty, newScore, accuracyPercent) => {
    const key = `${sectionId}-${difficulty}`;
    
    // 1. Safeguard & update best accuracy
    const currentAccuracy = (sectionAccuracy && sectionAccuracy[key]) || 0;
    if (accuracyPercent > currentAccuracy) {
      setSectionAccuracy(prev => ({ ...prev, [key]: accuracyPercent }));
    }

    // 2. Handle score differencing synchronously and non-concurrently
    const oldScore = (sectionScores && sectionScores[key]) || 0;
    if (newScore > oldScore) {
      const difference = newScore - oldScore;
      addPoints(difference);
      setSectionScores(prev => ({ ...prev, [key]: newScore }));
      return difference;
    }
    return 0;
  };

  const addStruggleWord = (word, tierId, errorType) => {
    setStruggleWords(prev => {
      const existing = prev.find(w => w.word === word);
      if (existing) {
        return prev.map(w => w.word === word ? { ...w, count: w.count + 1 } : w);
      }
      return [...prev, { word, tierId, errorType, count: 1 }];
    });
  };

  const purchaseReward = (rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && studentPoints >= reward.cost) {
      setStudentPoints(prev => prev - reward.cost);
      return true;
    }
    return false;
  };

  const resetProgress = () => {
    setStudentPoints(0);
    setStudentStreak(0);
    setUnlockedTiers([1]);
    setStruggleWords([]);
    setSectionScores({});
    setSectionAccuracy({});
    setListenedLessons([]); // Purge lesson listening history
  };

  const getSectionStats = (sectionId) => {
    const easyAcc = sectionAccuracy[`${sectionId}-easy`] || 0;
    const medAcc = sectionAccuracy[`${sectionId}-medium`] || 0;
    const hardAcc = sectionAccuracy[`${sectionId}-hard`] || 0;
    
    const completionPercent = Math.round((easyAcc + medAcc + hardAcc) / 3);
    const is100Percent = easyAcc === 100 && medAcc === 100 && hardAcc === 100;
    
    // Passed criteria: 90% correctness on ANY difficulty
    const isPassed = easyAcc >= 90 || medAcc >= 90 || hardAcc >= 90;

    return { easyAcc, medAcc, hardAcc, completionPercent, is100Percent, isPassed };
  };

  const isSectionMastered = (sectionId) => {
    const stats = getSectionStats(sectionId);
    if (sectionId.toString().includes('mastery')) {
      return stats.isPassed;
    }
    return stats.completionPercent >= 90;
  };

  const isDifficultyUnlocked = (sectionId, difficulty) => {
    // Globally disabled by parent -> Everything unlocked
    if (!enableDifficultyGating) return true;
    // Easy always open
    if (difficulty === 'easy') return true;
    
    // Dynamic checks
    const easyAcc = sectionAccuracy[`${sectionId}-easy`] || 0;
    const medAcc = sectionAccuracy[`${sectionId}-medium`] || 0;
    
    if (difficulty === 'medium') return easyAcc >= 90; // Unlocked at 90% mastery
    if (difficulty === 'hard') return medAcc >= 90;   // Unlocked at 90% mastery
    
    return true;
  };

  const markLessonListened = (sectionId) => {
    setListenedLessons(prev => {
      if (!prev.includes(sectionId)) {
        return [...prev, sectionId];
      }
      return prev;
    });
  };

  return (
    <AppContext.Provider value={{
      studentPoints, setStudentPoints, addPoints,
      studentStreak, setStudentStreak,
      unlockedTiers, setUnlockedTiers,
      struggleWords, addStruggleWord,
      sectionScores, updateSectionScore,
      sectionAccuracy, getSectionStats,
      enablePacing, setEnablePacing,
      enableDifficultyGating, setEnableDifficultyGating,
      isDifficultyUnlocked,
      listenedLessons, markLessonListened,
      rewards, setRewards, purchaseReward,
      currentGradeLevel, setCurrentGradeLevel,
      tiers, resetProgress, isSectionMastered
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
