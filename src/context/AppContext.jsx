import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import wordBank3rd from '../data/wordBank_3rd.json';
import wordBank4th from '../data/wordBank_4th.json';
import wordBank5th from '../data/wordBank_5th.json';
import wordBank6th from '../data/wordBank_6th.json';
import { calculateRecommendedDifficulty } from '../utils/difficulty';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

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
  const [unlockedTiers, setUnlockedTiers] = useState(() => loadState('unlockedTiers', [])); // First tier handled by UI logic
  const [struggleWords, setStruggleWords] = useState(() => loadState('struggleWords', []));
  const [sectionScores, setSectionScores] = useState(() => loadState('sectionScores', {})); // Tracks max score per section/diff
  const [sectionAccuracy, setSectionAccuracy] = useState(() => loadState('sectionAccuracy', {})); // Tracks max percentage correct
  const [enablePacing, setEnablePacing] = useState(() => loadState('enablePacing', true)); // Controls rolling window gate
  const [enableDifficultyGating, setEnableDifficultyGating] = useState(() => loadState('enableDifficultyGating', true)); // Forces Easy->Med->Hard sequence
  const [listenedLessons, setListenedLessons] = useState(() => loadState('listenedLessons', []));
  const [studentName, setStudentName] = useState(() => loadState('studentName', ''));

  // Parent State
  const [rewards, setRewards] = useState(() => loadState('rewards', [
    { id: 1, name: '30 mins Screen Time', cost: 500 },
    { id: 2, name: 'Trip to Park', cost: 1000 }
  ]));
  const [currentGradeLevel, setCurrentGradeLevel] = useState(() => {
    let grade = loadState('currentGradeLevel', '4th');
    // Fallback for legacy values
    if (grade === '4th-5th') grade = '4th';
    if (grade === '6th+') grade = '6th';

    // Validate against allowed values
    const validGrades = ['3rd', '4th', '5th', '6th'];
    if (!validGrades.includes(grade)) {
      grade = '4th';
    }
    return grade;
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const restoreProgress = (data) => {
    if (Object.keys(data).length > 0) {
      if (data.studentPoints !== undefined && typeof data.studentPoints === 'number') setStudentPoints(data.studentPoints);
      if (data.studentStreak !== undefined && typeof data.studentStreak === 'number') setStudentStreak(data.studentStreak);
      if (data.unlockedTiers !== undefined && Array.isArray(data.unlockedTiers)) setUnlockedTiers(data.unlockedTiers);
      if (data.struggleWords !== undefined && Array.isArray(data.struggleWords)) setStruggleWords(data.struggleWords);
      if (data.sectionScores !== undefined && typeof data.sectionScores === 'object' && !Array.isArray(data.sectionScores)) setSectionScores(data.sectionScores);
      if (data.sectionAccuracy !== undefined && typeof data.sectionAccuracy === 'object' && !Array.isArray(data.sectionAccuracy)) setSectionAccuracy(data.sectionAccuracy);
      if (data.enablePacing !== undefined && typeof data.enablePacing === 'boolean') setEnablePacing(data.enablePacing);
      if (data.enableDifficultyGating !== undefined && typeof data.enableDifficultyGating === 'boolean') setEnableDifficultyGating(data.enableDifficultyGating);
      if (data.listenedLessons !== undefined && Array.isArray(data.listenedLessons)) setListenedLessons(data.listenedLessons);
      if (data.rewards !== undefined && Array.isArray(data.rewards)) setRewards(data.rewards);
      if (data.currentGradeLevel !== undefined && typeof data.currentGradeLevel === 'string') setCurrentGradeLevel(data.currentGradeLevel);
      if (data.studentName !== undefined && typeof data.studentName === 'string') setStudentName(data.studentName);
    }
  };

  const resetProgress = () => {
    setStudentPoints(0);
    setStudentStreak(0);
    setUnlockedTiers([]);
    setStruggleWords([]);
    setSectionScores({});
    setSectionAccuracy({});
    setListenedLessons([]);
    setEnablePacing(true);
    setEnableDifficultyGating(true);
    setRewards([
      { id: 1, name: '30 mins Screen Time', cost: 500 },
      { id: 2, name: 'Trip to Park', cost: 1000 }
    ]);
    setCurrentGradeLevel('4th');
    setStudentName('');
    
    localStorage.setItem('studentPoints', JSON.stringify(0));
    localStorage.setItem('studentStreak', JSON.stringify(0));
    localStorage.setItem('unlockedTiers', JSON.stringify([]));
    localStorage.setItem('struggleWords', JSON.stringify([]));
    localStorage.setItem('sectionScores', JSON.stringify({}));
    localStorage.setItem('sectionAccuracy', JSON.stringify({}));
    localStorage.setItem('listenedLessons', JSON.stringify([]));
    localStorage.setItem('enablePacing', JSON.stringify(true));
    localStorage.setItem('enableDifficultyGating', JSON.stringify(true));
    localStorage.setItem('rewards', JSON.stringify([
      { id: 1, name: '30 mins Screen Time', cost: 500 },
      { id: 2, name: 'Trip to Park', cost: 1000 }
    ]));
    localStorage.setItem('currentGradeLevel', JSON.stringify('4th'));
    localStorage.setItem('studentName', JSON.stringify(''));
  };

  const loadedUserUidRef = useRef(null);
  const { user, db } = useAuth();

  useEffect(() => {
    let ignore = false;
    const loadScores = async () => {
      setIsLoaded(false);
      setError(null);
      
      if (user && loadedUserUidRef.current !== null && user.uid !== loadedUserUidRef.current) {
        resetProgress();
      }

      if (user && db) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (ignore) return;

          if (docSnap.exists()) {
            restoreProgress(docSnap.data());
          }
          loadedUserUidRef.current = user.uid;
          setIsLoaded(true);
        } catch (error) {
          console.error('Error loading scores from Firestore:', error);
          if (!ignore) {
            setError(error.message);
          }
        }
      } else if (!user) {
        if (!ignore) {
          if (loadedUserUidRef.current !== null) {
            resetProgress();
          }
          loadedUserUidRef.current = null;
          setIsLoaded(true);
        }
      }
    };

    loadScores();
    return () => { ignore = true; };
  }, [user, db]);

  // Curriculum Data
  const tiers = useMemo(() => {
    switch (currentGradeLevel) {
      case '3rd': return wordBank3rd.tiers;
      case '4th': return wordBank4th.tiers;
      case '5th': return wordBank5th.tiers;
      case '6th': return wordBank6th.tiers;
      default:
        console.warn(`Unexpected grade level: ${currentGradeLevel}. Defaulting to 4th.`);
        return wordBank4th.tiers;
    }
  }, [currentGradeLevel]);

  // Save to localStorage and Firestore on change
  useEffect(() => {
    if (!isLoaded) return;

    if (user && user.uid !== loadedUserUidRef.current) {
      console.warn("Save blocked: current user does not match loaded user");
      return;
    }

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
    localStorage.setItem('studentName', JSON.stringify(studentName));

    const saveScores = async () => {
      if (user && db) {
        try {
          const docRef = doc(db, 'users', user.uid);
          await setDoc(docRef, {
            studentPoints,
            studentStreak,
            unlockedTiers,
            struggleWords,
            sectionScores,
            sectionAccuracy,
            enablePacing,
            enableDifficultyGating,
            listenedLessons,
            rewards,
            currentGradeLevel,
            studentName
          }, { merge: true });
        } catch (error) {
          console.error('Error saving scores to Firestore:', error);
        }
      }
    };

    saveScores();
  }, [isLoaded, user, studentPoints, studentStreak, unlockedTiers, struggleWords, sectionScores, sectionAccuracy, enablePacing, enableDifficultyGating, listenedLessons, rewards, currentGradeLevel, db, studentName]);

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

  const getRecommendedDifficulty = (sectionId) => {
    return calculateRecommendedDifficulty(sectionId, sectionAccuracy);
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
      tiers, resetProgress, isSectionMastered, getRecommendedDifficulty, restoreProgress,
      isLoaded, error,
      studentName, setStudentName
    }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
