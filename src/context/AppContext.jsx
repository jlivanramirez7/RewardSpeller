/**
 * @module AppContext
 * @description Global state ecosystem for RewardSpeller. Manages multi-student profiles,
 * adaptive pacing gates, sequential difficulty progression locks, diagnostic struggle ledgers,
 * and reward vault persistence via localStorage and Firestore synchronization.
 */

import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import wordBank2nd from '../data/wordBank_2nd.json';
import wordBank3rd from '../data/wordBank_3rd.json';
import wordBank4th from '../data/wordBank_4th.json';
import wordBank5th from '../data/wordBank_5th.json';
import wordBank6th from '../data/wordBank_6th.json';
import { calculateRecommendedDifficulty } from '../utils/difficulty';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { generateKidFriendlyName } from '../utils/username';

/**
 * @typedef {Object} Reward
 * @property {number} id - Unique reward identifier.
 * @property {string} name - Title of the reward (e.g., '30 mins Screen Time').
 * @property {number} cost - Point cost required to claim the reward.
 */

/**
 * @typedef {Object} StudentProfile
 * @property {string} id - Unique profile identifier (e.g., 'child_1').
 * @property {string} studentName - Display name of the student.
 * @property {string} currentGradeLevel - Active curriculum grade ('2nd', '3rd', '4th', '5th', '6th').
 * @property {number} studentPoints - Total earned reward points.
 * @property {number} studentStreak - Active continuous correct spelling streak.
 * @property {string[]} unlockedTiers - Array of unlocked curriculum tier IDs.
 * @property {Object[]} struggleWords - Array of words identified as diagnostic struggle areas.
 * @property {Object.<string, number>} sectionScores - Dictionary of high scores per section/difficulty.
 * @property {Object.<string, number>} sectionAccuracy - Dictionary of accuracy percentages per section/difficulty.
 * @property {boolean} enablePacing - True if adaptive pacing milestone gates are active.
 * @property {boolean} enableDifficultyGating - True if sequential difficulty progression locks are active.
 * @property {string[]} listenedLessons - Array of section IDs whose lesson audio has been listened to.
 * @property {Reward[]} rewards - Custom rewards available for the student to purchase.
 */

const AppContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const getISOWeekString = () => {
  const date = new Date();
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const dayNrFirstThurs = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - dayNrFirstThurs + 3);
  const week = 1 + Math.round(((target - firstThursday) / 86400000) / 7);
  return `${target.getFullYear()}-W${week.toString().padStart(2, '0')}`;
};

const createDefaultChild = (id, name = '', overrides = {}) => {
  const trimmed = name ? name.trim() : '';
  const finalName = trimmed !== '' ? trimmed : generateKidFriendlyName(id);
  return {
    id,
    studentName: finalName,
    currentGradeLevel: '4th',
    studentPoints: 0,
    weeklyPoints: 0,
    usageTime: 0,
    lastResetWeek: getISOWeekString(),
    studentStreak: 0,
    unlockedTiers: [],
    struggleWords: [],
    sectionScores: {},
    sectionAccuracy: {},
    enablePacing: true,
    enableDifficultyGating: true,
    listenedLessons: [],
    rewards: [
      { id: 1, name: '30 mins Screen Time', cost: 500 },
      { id: 2, name: 'Trip to Park', cost: 1000 }
    ],
    ...overrides
  };
};

/**
 * Global application state provider component.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components requiring application state context access.
 * @returns {React.ReactElement} Application context provider wrapper.
 */
export const AppProvider = ({ children }) => {
  // Helper function for safe localStorage hydration and JSON parsing.
  const loadState = (key, defaultValue) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  const [activeChildId, setActiveChildId] = useState(() => {
    const saved = localStorage.getItem('activeChildId');
    return saved || 'child_1';
  });

  // Multi-student profiles state dictionary mapping child IDs to StudentProfile objects.
  // Includes legacy single-student migration fallback parsing to ensure seamless parent account upgrades.
  const [childrenMap, setChildrenMap] = useState(() => {
    const currentWeek = getISOWeekString();
    const savedChildren = localStorage.getItem('children');
    if (savedChildren) {
      try {
        const parsed = JSON.parse(savedChildren);
        const validated = {};
        for (const [childId, childData] of Object.entries(parsed)) {
          let weeklyPoints = childData.weeklyPoints ?? 0;
          let lastResetWeek = childData.lastResetWeek || currentWeek;
          let usageTime = childData.usageTime ?? 0;
          if (lastResetWeek !== currentWeek) {
            weeklyPoints = 0;
            lastResetWeek = currentWeek;
          }
          validated[childId] = {
            ...childData,
            weeklyPoints,
            lastResetWeek,
            usageTime
          };
        }
        return validated;
      } catch (e) {
        console.error("Error parsing children from localStorage", e);
      }
    }
    // Legacy Migration Fallback
    const legacyPoints = localStorage.getItem('studentPoints');
    if (legacyPoints !== null) {
      let grade = loadState('currentGradeLevel', '4th');
      if (grade === '4th-5th') grade = '4th';
      if (grade === '6th+') grade = '6th';
      const validGrades = ['2nd', '3rd', '4th', '5th', '6th'];
      if (!validGrades.includes(grade)) grade = '4th';

      let weeklyPoints = loadState('weeklyPoints', 0);
      let lastResetWeek = loadState('lastResetWeek', currentWeek);
      let usageTime = loadState('usageTime', 0);
      if (lastResetWeek !== currentWeek) {
        weeklyPoints = 0;
        lastResetWeek = currentWeek;
      }

      const legacyChild = createDefaultChild('child_1', loadState('studentName', ''), {
        studentPoints: loadState('studentPoints', 0),
        weeklyPoints,
        lastResetWeek,
        usageTime,
        studentStreak: loadState('studentStreak', 0),
        unlockedTiers: loadState('unlockedTiers', []),
        struggleWords: loadState('struggleWords', []),
        sectionScores: loadState('sectionScores', {}),
        sectionAccuracy: loadState('sectionAccuracy', {}),
        enablePacing: loadState('enablePacing', true),
        enableDifficultyGating: loadState('enableDifficultyGating', true),
        listenedLessons: loadState('listenedLessons', []),
        rewards: loadState('rewards', [
          { id: 1, name: '30 mins Screen Time', cost: 500 },
          { id: 2, name: 'Trip to Park', cost: 1000 }
        ]),
        currentGradeLevel: grade
      });
      return { child_1: legacyChild };
    }
    return { child_1: createDefaultChild('child_1') };
  });

  const skipSaveRef = useRef(false);

  // Memoized proxy updater: Performs immutable state updates on specific fields
  // of the currently active student profile, preserving untouched sibling profiles safely.
  const updateActiveChildField = useCallback((field, valueOrUpdater) => {
    setChildrenMap(prevMap => {
      const currentActiveId = activeChildId;
      const currentChild = prevMap[currentActiveId] || createDefaultChild(currentActiveId);
      const oldValue = currentChild[field];
      const newValue = typeof valueOrUpdater === 'function' ? valueOrUpdater(oldValue) : valueOrUpdater;

      if (oldValue === newValue) return prevMap;

      return {
        ...prevMap,
        [currentActiveId]: {
          ...currentChild,
          [field]: newValue
        }
      };
    });
  }, [activeChildId]);

  // Proxy setters
  const setStudentPoints = useCallback((val) => updateActiveChildField('studentPoints', val), [updateActiveChildField]);
  const setStudentStreak = useCallback((val) => updateActiveChildField('studentStreak', val), [updateActiveChildField]);
  const setUnlockedTiers = useCallback((val) => updateActiveChildField('unlockedTiers', val), [updateActiveChildField]);
  const setStruggleWords = useCallback((val) => updateActiveChildField('struggleWords', val), [updateActiveChildField]);
  const setSectionScores = useCallback((val) => updateActiveChildField('sectionScores', val), [updateActiveChildField]);
  const setSectionAccuracy = useCallback((val) => updateActiveChildField('sectionAccuracy', val), [updateActiveChildField]);
  const setEnablePacing = useCallback((val) => updateActiveChildField('enablePacing', val), [updateActiveChildField]);
  const setEnableDifficultyGating = useCallback((val) => updateActiveChildField('enableDifficultyGating', val), [updateActiveChildField]);
  const setListenedLessons = useCallback((val) => updateActiveChildField('listenedLessons', val), [updateActiveChildField]);
  const setRewards = useCallback((val) => updateActiveChildField('rewards', val), [updateActiveChildField]);
  const setCurrentGradeLevel = useCallback((val) => updateActiveChildField('currentGradeLevel', val), [updateActiveChildField]);
  const setStudentName = useCallback((val) => updateActiveChildField('studentName', val), [updateActiveChildField]);

  const switchChild = useCallback((id) => {
    if (childrenMap[id]) {
      setActiveChildId(id);
    }
  }, [childrenMap]);

  const addChild = useCallback((name, gradeLevel = '4th') => {
    const newId = `child_${Date.now()}`;
    const newChild = createDefaultChild(newId, name, { currentGradeLevel: gradeLevel });
    setChildrenMap(prev => ({ ...prev, [newId]: newChild }));
    setActiveChildId(newId);
  }, []);

  const deleteChild = useCallback((id) => {
    setChildrenMap(prev => {
      const remainingKeys = Object.keys(prev).filter(k => k !== id);
      if (remainingKeys.length === 0) {
        return { child_1: createDefaultChild('child_1', 'Student') };
      }
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    if (activeChildId === id) {
      let nextActiveId;
      const remaining = Object.keys(childrenMap).filter(k => k !== id);
      if (remaining.length > 0) {
        nextActiveId = remaining[0];
      } else {
        nextActiveId = 'child_1';
      }
      setActiveChildId(nextActiveId);
    }
  }, [childrenMap, activeChildId]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Firestore synchronization restore method: Hydrates state from cloud snapshot payload.
  const restoreProgress = useCallback((data) => {
    if (!data || Object.keys(data).length === 0) return;

    skipSaveRef.current = true; // Concurrency guard preventing write amplification on state restore

    const currentWeek = getISOWeekString();

    if (data.children && typeof data.children === 'object') {
      const hasChildren = Object.keys(data.children).length > 0;
      if (hasChildren) {
        const migratedChildren = {};
        for (const [childId, childData] of Object.entries(data.children)) {
          let name = childData.studentName ? childData.studentName.trim() : '';
          if (!name || name.toLowerCase() === 'student') {
            name = generateKidFriendlyName(childId);
          }
          
          let weeklyPoints = childData.weeklyPoints ?? 0;
          let lastResetWeek = childData.lastResetWeek || currentWeek;
          let usageTime = childData.usageTime ?? 0;

          if (lastResetWeek !== currentWeek) {
            weeklyPoints = 0;
            lastResetWeek = currentWeek;
          }

          migratedChildren[childId] = {
            ...childData,
            studentName: name,
            weeklyPoints,
            lastResetWeek,
            usageTime
          };
        }
        setChildrenMap(migratedChildren);
        const active = data.activeChildId || Object.keys(migratedChildren)[0] || 'child_1';
        setActiveChildId(active);
      } else {
        setChildrenMap({ child_1: createDefaultChild('child_1') });
        setActiveChildId('child_1');
      }
    } else {
      let grade = data.currentGradeLevel ?? '4th';
      if (grade === '4th-5th') grade = '4th';
      if (grade === '6th+') grade = '6th';
      const validGrades = ['2nd', '3rd', '4th', '5th', '6th'];
      if (!validGrades.includes(grade)) grade = '4th';

      let name = data.studentName ? data.studentName.trim() : '';
      if (!name || name.toLowerCase() === 'student') {
        name = generateKidFriendlyName('child_1');
      }

      let weeklyPoints = data.weeklyPoints ?? 0;
      let lastResetWeek = data.lastResetWeek || currentWeek;
      let usageTime = data.usageTime ?? 0;
      if (lastResetWeek !== currentWeek) {
        weeklyPoints = 0;
        lastResetWeek = currentWeek;
      }

      const migratedChild = createDefaultChild('child_1', name, {
        studentPoints: data.studentPoints ?? 0,
        weeklyPoints,
        lastResetWeek,
        usageTime,
        studentStreak: data.studentStreak ?? 0,
        unlockedTiers: data.unlockedTiers ?? [],
        struggleWords: data.struggleWords ?? [],
        sectionScores: data.sectionScores ?? {},
        sectionAccuracy: data.sectionAccuracy ?? {},
        enablePacing: data.enablePacing ?? true,
        enableDifficultyGating: data.enableDifficultyGating ?? true,
        listenedLessons: data.listenedLessons ?? [],
        rewards: data.rewards ?? [
          { id: 1, name: '30 mins Screen Time', cost: 500 },
          { id: 2, name: 'Trip to Park', cost: 1000 }
        ],
        currentGradeLevel: grade,
      });
      setChildrenMap({ child_1: migratedChild });
      setActiveChildId('child_1');
    }
  }, []);

  const resetProgress = useCallback(() => {
    setChildrenMap(prev => {
      const currentId = activeChildId;
      const currentChild = prev[currentId] || createDefaultChild(currentId);
      const resetChild = createDefaultChild(currentId, currentChild.studentName, {
        currentGradeLevel: currentChild.currentGradeLevel,
        rewards: currentChild.rewards,
        enablePacing: currentChild.enablePacing ?? true,
        enableDifficultyGating: currentChild.enableDifficultyGating ?? true
      });
      return { ...prev, [currentId]: resetChild };
    });
  }, [activeChildId]);

  const loadedUserUidRef = useRef(null);
  const { user, db, isStudent, parentUid, studentChildId } = useAuth();

  // Asynchronous data loading hook: Queries Firestore for user profile progress on authentication state change.
  // Implements active user switching protections to discard stale network resolutions if auth user changes during fetch.
  useEffect(() => {
    let ignore = false;
    const loadScores = async () => {
      setIsLoaded(false);
      setError(null);

      const targetUid = isStudent ? parentUid : (user ? user.uid : null);

      if (targetUid && loadedUserUidRef.current !== null && targetUid !== loadedUserUidRef.current) {
        skipSaveRef.current = true;
        setChildrenMap({ child_1: createDefaultChild('child_1') });
        setActiveChildId('child_1');
      }

      if (targetUid && db) {
        try {
          const docRef = doc(db, 'users', targetUid);
          const docSnap = await getDoc(docRef);

          if (ignore) return;

          if (docSnap.exists()) {
            restoreProgress(docSnap.data());
            
            if (!isStudent && user && user.email === 'jlivanramirez7@gmail.com') {
              setChildrenMap(prev => {
                const updated = { ...prev };
                let modified = false;
                Object.entries(updated).forEach(([cId, cData]) => {
                  if (cData.studentName && cData.studentName.toLowerCase() === 'lucas' && !cData.pointsRestored) {
                    updated[cId] = {
                      ...cData,
                      studentPoints: (cData.studentPoints || 0) + 1200,
                      pointsRestored: true
                    };
                    modified = true;
                  }
                });
                if (modified) {
                  skipSaveRef.current = false;
                }
                return updated;
              });
            }

            if (isStudent && studentChildId) {
              setActiveChildId(studentChildId);
            }
          }
          loadedUserUidRef.current = targetUid;
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
            skipSaveRef.current = true;
            setChildrenMap({ child_1: createDefaultChild('child_1') });
            setActiveChildId('child_1');
          }
          loadedUserUidRef.current = null;
          setIsLoaded(true);
        }
      }
    };

    loadScores();
    return () => { ignore = true; };
  }, [user, db, restoreProgress, isStudent, parentUid, studentChildId]);

  const activeChild = useMemo(() => {
    return childrenMap[activeChildId] || createDefaultChild(activeChildId);
  }, [childrenMap, activeChildId]);

  const currentGradeLevel = activeChild.currentGradeLevel || '4th';

  // Curriculum Data
  const tiers = useMemo(() => {
    switch (currentGradeLevel) {
      case '2nd': return wordBank2nd.tiers;
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
  // State persistence hook: Synchronizes local state updates to localStorage and Firestore.
  // Throttles unnecessary writes using skipSaveRef during hydration phases.
  useEffect(() => {
    if (!isLoaded) return;

    const targetUid = isStudent ? parentUid : (user ? user.uid : null);

    if (targetUid && targetUid !== loadedUserUidRef.current) {
      console.warn("Save blocked: current user/parent does not match loaded user");
      return;
    }

    localStorage.setItem('activeChildId', activeChildId);
    localStorage.setItem('children', JSON.stringify(childrenMap));

    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }

    const saveScores = async () => {
      if (targetUid && db) {
        try {
          const docRef = doc(db, 'users', targetUid);
          await setDoc(docRef, {
            activeChildId,
            children: childrenMap
          }, { mergeFields: ['activeChildId', 'children'] });
        } catch (error) {
          console.error('Error saving scores to Firestore:', error);
        }
      }
    };

    saveScores();
  }, [isLoaded, user, db, activeChildId, childrenMap, isStudent, parentUid]);

  // Cross-tab storage sync
  // Cross-tab synchronization hook: Listens for storage events across browser tabs
  // to keep multi-student profile switching and point balances perfectly synced in real time.
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'children' && e.newValue) {
        try {
          skipSaveRef.current = true;
          setChildrenMap(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Storage sync parse error', err);
        }
      }
      if (e.key === 'activeChildId' && e.newValue) {
        skipSaveRef.current = true;
        setActiveChildId(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addPoints = useCallback((points) => {
    setChildrenMap(prevMap => {
      const currentActiveId = activeChildId;
      const currentChild = prevMap[currentActiveId] || createDefaultChild(currentActiveId);
      const currentWeek = getISOWeekString();
      
      let newWeekly = (currentChild.weeklyPoints ?? 0) + points;
      let newLastReset = currentChild.lastResetWeek || currentWeek;

      if (currentChild.lastResetWeek !== currentWeek) {
        newWeekly = points;
        newLastReset = currentWeek;
      }

      return {
        ...prevMap,
        [currentActiveId]: {
          ...currentChild,
          studentPoints: (currentChild.studentPoints ?? 0) + points,
          weeklyPoints: newWeekly,
          lastResetWeek: newLastReset
        }
      };
    });
  }, [activeChildId]);

  const addUsageTime = useCallback((seconds) => {
    setChildrenMap(prevMap => {
      const currentActiveId = activeChildId;
      const currentChild = prevMap[currentActiveId] || createDefaultChild(currentActiveId);
      return {
        ...prevMap,
        [currentActiveId]: {
          ...currentChild,
          usageTime: (currentChild.usageTime ?? 0) + seconds
        }
      };
    });
  }, [activeChildId]);

  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      addUsageTime(60);
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoaded, addUsageTime]);

  const studentPoints = activeChild.studentPoints ?? 0;
  const weeklyPoints = activeChild.weeklyPoints ?? 0;
  const usageTime = activeChild.usageTime ?? 0;
  const studentStreak = activeChild.studentStreak ?? 0;
  const rawUnlockedTiers = activeChild.unlockedTiers;
  const unlockedTiers = useMemo(() => rawUnlockedTiers || [], [rawUnlockedTiers]);

  const rawStruggleWords = activeChild.struggleWords;
  const struggleWords = useMemo(() => rawStruggleWords || [], [rawStruggleWords]);

  const rawSectionScores = activeChild.sectionScores;
  const sectionScores = useMemo(() => rawSectionScores || {}, [rawSectionScores]);

  const rawSectionAccuracy = activeChild.sectionAccuracy;
  const sectionAccuracy = useMemo(() => rawSectionAccuracy || {}, [rawSectionAccuracy]);

  const enablePacing = activeChild.enablePacing ?? true;
  const enableDifficultyGating = activeChild.enableDifficultyGating ?? true;

  const rawListenedLessons = activeChild.listenedLessons;
  const listenedLessons = useMemo(() => rawListenedLessons || [], [rawListenedLessons]);

  const rawRewards = activeChild.rewards;
  const rewards = useMemo(() => rawRewards || [
    { id: 1, name: '30 mins Screen Time', cost: 500 },
    { id: 2, name: 'Trip to Park', cost: 1000 }
  ], [rawRewards]);

  const studentName = activeChild.studentName || '';

  // Differential ledger accounting method: Updates section high scores and accuracy percentages.
  // Enforces anti-grinding protocol: awards new points only when previous recorded high scores are beaten.
  const updateSectionScore = useCallback((sectionId, difficulty, newScore, accuracyPercent) => {
    const key = `${sectionId}-${difficulty}`;
    
    const currentAccuracy = (sectionAccuracy && sectionAccuracy[key]) || 0;
    if (accuracyPercent > currentAccuracy) {
      setSectionAccuracy(prev => ({ ...prev, [key]: accuracyPercent }));
    }

    const oldScore = (sectionScores && sectionScores[key]) || 0;
    if (newScore > oldScore) {
      const difference = newScore - oldScore;
      addPoints(difference);
      setSectionScores(prev => ({ ...prev, [key]: newScore }));
      return difference;
    }
    return 0;
  }, [sectionAccuracy, sectionScores, setSectionAccuracy, setSectionScores, addPoints]);

  const addStruggleWord = useCallback((word, tierId, errorType) => {
    setStruggleWords(prev => {
      const existing = prev.find(w => w.word === word);
      if (existing) {
        return prev.map(w => w.word === word ? { ...w, count: w.count + 1 } : w);
      }
      return [...prev, { word, tierId, errorType, count: 1 }];
    });
  }, [setStruggleWords]);

  const purchaseReward = useCallback((rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && studentPoints >= reward.cost) {
      return true;
    }
    return false;
  }, [rewards, studentPoints]);

  const linkStudentEmail = useCallback(async (childId, email) => {
    setChildrenMap(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        studentEmail: email
      }
    }));

    if (user && db && email) {
      try {
        await setDoc(doc(db, 'student_links', email), {
          parentUid: user.uid,
          childId: childId
        });
        alert(`Successfully linked ${email} to student profile!`);
      } catch (err) {
        console.error("Error linking student email in Firestore:", err);
        alert("Failed to link student email: " + err.message);
      }
    }
  }, [user, db]);

  const getSectionStats = useCallback((sectionId) => {
    const easyAcc = sectionAccuracy[`${sectionId}-easy`] || 0;
    const medAcc = sectionAccuracy[`${sectionId}-medium`] || 0;
    const hardAcc = sectionAccuracy[`${sectionId}-hard`] || 0;
    
    const completionPercent = Math.round((easyAcc + medAcc + hardAcc) / 3);
    const is100Percent = easyAcc === 100 && medAcc === 100 && hardAcc === 100;
    
    const isPassed = easyAcc >= 90 || medAcc >= 90 || hardAcc >= 90;

    return { easyAcc, medAcc, hardAcc, completionPercent, is100Percent, isPassed };
  }, [sectionAccuracy]);

  const isSectionMastered = useCallback((sectionId) => {
    const stats = getSectionStats(sectionId);
    if (sectionId.toString().includes('mastery')) {
      return stats.isPassed;
    }
    return stats.completionPercent >= 90;
  }, [getSectionStats]);

  const isDifficultyUnlocked = useCallback((sectionId, difficulty) => {
    if (!enableDifficultyGating) return true;
    if (difficulty === 'easy') return true;
    
    const easyAcc = sectionAccuracy[`${sectionId}-easy`] || 0;
    const medAcc = sectionAccuracy[`${sectionId}-medium`] || 0;
    
    if (difficulty === 'medium') return easyAcc >= 90;
    if (difficulty === 'hard') return medAcc >= 90;
    
    return true;
  }, [enableDifficultyGating, sectionAccuracy]);

  const markLessonListened = useCallback((sectionId) => {
    setListenedLessons(prev => {
      if (!prev.includes(sectionId)) {
        return [...prev, sectionId];
      }
      return prev;
    });
  }, [setListenedLessons]);

  const getRecommendedDifficulty = useCallback((sectionId) => {
    return calculateRecommendedDifficulty(sectionId, sectionAccuracy);
  }, [sectionAccuracy]);

  const contextValue = useMemo(() => ({
    studentPoints, setStudentPoints, addPoints, weeklyPoints, usageTime, addUsageTime,
    studentStreak, setStudentStreak,
    unlockedTiers, setUnlockedTiers,
    struggleWords, addStruggleWord,
    sectionScores, updateSectionScore,
    sectionAccuracy, getSectionStats,
    enablePacing, setEnablePacing,
    enableDifficultyGating, setEnableDifficultyGating,
    isDifficultyUnlocked,
    listenedLessons, markLessonListened,
    rewards, setRewards, purchaseReward, linkStudentEmail,
    currentGradeLevel, setCurrentGradeLevel,
    tiers, resetProgress, isSectionMastered, getRecommendedDifficulty, restoreProgress,
    isLoaded, error,
    studentName, setStudentName,
    childrenMap, activeChildId, setActiveChildId: switchChild, addChild, deleteChild
  }), [
    studentPoints, setStudentPoints, addPoints, weeklyPoints, usageTime, addUsageTime,
    studentStreak, setStudentStreak,
    unlockedTiers, setUnlockedTiers,
    struggleWords, addStruggleWord,
    sectionScores, updateSectionScore,
    sectionAccuracy, getSectionStats,
    enablePacing, setEnablePacing,
    enableDifficultyGating, setEnableDifficultyGating,
    isDifficultyUnlocked,
    listenedLessons, markLessonListened,
    rewards, setRewards, purchaseReward, linkStudentEmail,
    currentGradeLevel, setCurrentGradeLevel,
    tiers, resetProgress, isSectionMastered, getRecommendedDifficulty, restoreProgress,
    isLoaded, error,
    studentName, setStudentName,
    childrenMap, activeChildId, switchChild, addChild, deleteChild
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook to consume the global application state context.
 * @returns {Object} Application state, curriculum data, and mutation setters.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
