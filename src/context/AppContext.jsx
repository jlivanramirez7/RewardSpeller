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
    localStorage.setItem('listenedLessons', JSON.stringify(listenedLessons));
    localStorage.setItem('rewards', JSON.stringify(rewards));
    localStorage.setItem('currentGradeLevel', JSON.stringify(currentGradeLevel));
  }, [studentPoints, studentStreak, unlockedTiers, struggleWords, sectionScores, listenedLessons, rewards, currentGradeLevel]);

  const addPoints = (points) => {
    setStudentPoints(prev => prev + points);
  };

  const updateSectionScore = (sectionId, difficulty, newScore) => {
    const key = `${sectionId}-${difficulty}`;
    const oldScore = sectionScores[key] || 0;
    
    if (newScore > oldScore) {
      const difference = newScore - oldScore;
      addPoints(difference);
      setSectionScores(prev => ({ ...prev, [key]: newScore }));
      return difference; // Returns points actually awarded
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
  };

  const isSectionMastered = (sectionId) => {
    const easyScore = sectionScores[`${sectionId}-easy`] || 0;
    const medScore = sectionScores[`${sectionId}-medium`] || 0;
    const hardScore = sectionScores[`${sectionId}-hard`] || 0;
    
    // Mastery = 90% of max possible points for ANY difficulty
    // Max Easy: 100, Max Medium: 200, Max Hard: 300
    if (easyScore >= 90) return true;
    if (medScore >= 180) return true;
    if (hardScore >= 270) return true;
    
    return false;
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
