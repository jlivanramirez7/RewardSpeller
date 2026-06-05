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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  const finalName = trimmed !== '' ? trimmed : generateKidFriendlyName(); // Truly random default name sequence!
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
    wordleScores: {},
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
  const [childrenMap, setChildrenMap] = useState(null);

  const skipSaveRef = useRef(false);

  // Memoized proxy updater: Performs immutable state updates on specific fields
  // of the currently active student profile, preserving untouched sibling profiles safely.
  const updateActiveChildField = useCallback((field, valueOrUpdater) => {
    setChildrenMap(prevMap => {
      if (!prevMap) {
        console.warn(`[APP CONTEXT] updateActiveChildField: childrenMap is null, skipping update for field: ${field}`);
        return null;
      }
      const currentActiveId = activeChildId;
      const currentChild = prevMap[currentActiveId] || createDefaultChild(currentActiveId);
      const oldValue = currentChild[field];
      const newValue = typeof valueOrUpdater === 'function' ? valueOrUpdater(oldValue) : valueOrUpdater;

      console.log(`[APP CONTEXT] updateActiveChildField: updating child "${currentActiveId}", field: "${field}"`);
      console.log(`[APP CONTEXT] updateActiveChildField: oldValue:`, oldValue);
      console.log(`[APP CONTEXT] updateActiveChildField: newValue:`, newValue);

      if (oldValue === newValue) {
        console.log(`[APP CONTEXT] updateActiveChildField: value unchanged, skipping state update`);
        return prevMap;
      }

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
    if (childrenMap && childrenMap[id]) {
      setActiveChildId(id);
    }
  }, [childrenMap]);

  const addChild = useCallback((name, gradeLevel = '4th') => {
    const newId = `child_${Date.now()}`;
    const newChild = createDefaultChild(newId, name, { currentGradeLevel: gradeLevel });
    setChildrenMap(prev => {
      if (!prev) return null;
      if (Object.keys(prev).length >= 3) {
        alert("Maximum limit of 3 student profiles reached.");
        return prev;
      }
      return { ...prev, [newId]: newChild };
    });
    setActiveChildId(newId);
  }, []);

  const deleteChild = useCallback((id) => {
    setChildrenMap(prev => {
      if (!prev) return null;
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
      const remaining = Object.keys(childrenMap || {}).filter(k => k !== id);
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
  const [coppaConsented, setCoppaConsented] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [parentEmail, setParentEmail] = useState('');

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
            const data = docSnap.data();
            restoreProgress(data);
            
            if (!ignore) {
              setIsApproved(data.isApproved || false);
              setParentEmail(data.email || '');
            }
            
            if (data.coppaConsented === true || (user && user.email === 'jlivanramirez7@gmail.com')) {
              setCoppaConsented(true);
            } else {
              setCoppaConsented(false);
            }
            
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
          } else {
            if (!ignore) {
              setChildrenMap({ child_1: createDefaultChild('child_1') }); // Safely initialize default profile ONLY if database is verified missing!
              setIsApproved(user?.email === 'jlivanramirez7@gmail.com');
              setParentEmail(user?.email || '');
              setCoppaConsented(user?.email === 'jlivanramirez7@gmail.com');
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
            setChildrenMap(null); // Reset childrenMap to null on logout
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
    if (!childrenMap) return createDefaultChild(activeChildId);
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
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('coppa-verified') === 'true') {
      console.log("[COPPA] Consent verified via email redirect! Updating Firestore...");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoppaConsented(true);
      if (user && db) {
        const targetUid = isStudent ? parentUid : user.uid;
        setDoc(doc(db, 'users', targetUid), { coppaConsented: true }, { merge: true })
          .then(() => console.log("[COPPA] Successfully saved coppaConsented: true to Firestore"))
          .catch(err => console.error("[COPPA] Error saving consent to Firestore:", err));
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, db, isStudent, parentUid]);

  useEffect(() => {
    if (!isLoaded) {
      console.log("[APP CONTEXT] save effect: skipped because isLoaded is false");
      return;
    }

    const targetUid = isStudent ? parentUid : (user ? user.uid : null);

    console.log("[APP CONTEXT] save effect triggered. targetUid:", targetUid, "childrenMap:", !!childrenMap);

    if (targetUid && targetUid !== loadedUserUidRef.current) {
      console.warn(`[APP CONTEXT] Save blocked: current user/parent (${targetUid}) does not match loaded user (${loadedUserUidRef.current})`);
      return;
    }

    if (!childrenMap) {
      console.log("[APP CONTEXT] save effect: childrenMap is null, skipping write");
      return;
    }

    console.log("[APP CONTEXT] save effect: saving childrenMap to localStorage:", childrenMap);
    localStorage.setItem('activeChildId', activeChildId);
    localStorage.setItem('children', JSON.stringify(childrenMap));

    if (skipSaveRef.current) {
      console.log("[APP CONTEXT] save effect: skipSaveRef is true. Resetting to false and skipping Firestore write.");
      skipSaveRef.current = false;
      return;
    }

    const saveScores = async () => {
      if (targetUid && db && childrenMap) {
        console.log(`[APP CONTEXT] saveScores: attempting to save state to Firestore for UID: ${targetUid}`);
        console.log(`[APP CONTEXT] saveScores: state to save:`, { activeChildId, children: childrenMap });
        try {
          const docRef = doc(db, 'users', targetUid);
          const approvedFlag = isApproved || targetUid === 'jlivanramirez7@gmail.com' || user?.email === 'jlivanramirez7@gmail.com';
          await setDoc(docRef, {
            activeChildId,
            children: childrenMap,
            isApproved: approvedFlag,
            coppaConsented,
            email: parentEmail || user?.email || '',
            lastInteractionAt: serverTimestamp() // Log active app telemetry!
          }, { mergeFields: ['activeChildId', 'children', 'isApproved', 'coppaConsented', 'email', 'lastInteractionAt'] });
          console.log(`[APP CONTEXT] saveScores: successfully saved state to Firestore for UID: ${targetUid}`);

          if (!isStudent && user) {
            console.log(`[APP CONTEXT] Auto-syncing student links for parent ${user.email}...`);
            Object.entries(childrenMap).forEach(async ([cId, child]) => {
              console.log(`[APP CONTEXT] Checking child profile ${cId} (${child?.studentName}): studentEmail = "${child?.studentEmail}"`);
              if (child && child.studentEmail && child.studentEmail.trim()) {
                const email = child.studentEmail.trim();
                try {
                  console.log(`[APP CONTEXT] Writing student_links doc for ${email} -> Parent UID: ${user.uid}, Child ID: ${cId}`);
                  await setDoc(doc(db, 'student_links', email), {
                    parentUid: user.uid,
                    childId: cId
                  }, { merge: true });
                  console.log(`[APP CONTEXT] Successfully auto-synced student_links for ${email}`);
                } catch (linkErr) {
                  console.error(`[APP CONTEXT] Error auto-syncing student link for ${email}:`, linkErr);
                }
              } else {
                console.log(`[APP CONTEXT] Child ${cId} has no studentEmail set. Skipping auto-sync.`);
              }
            });
          }
        } catch (error) {
          console.error('[APP CONTEXT] saveScores: Error saving scores to Firestore:', error);
        }
      } else {
        console.log(`[APP CONTEXT] saveScores: skipped. targetUid: ${targetUid}, db: ${!!db}, childrenMap: ${!!childrenMap}`);
      }
    };

    saveScores();
  }, [isLoaded, user, db, activeChildId, childrenMap, isStudent, parentUid, coppaConsented, isApproved, parentEmail]);

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
      if (!prevMap) return null;
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

  const addWordlePoints = useCallback((dateKey, points) => {
    setChildrenMap(prevMap => {
      if (!prevMap) return null;
      const currentActiveId = activeChildId;
      const currentChild = prevMap[currentActiveId] || createDefaultChild(currentActiveId);
      const existingScores = currentChild.wordleScores || {};
      
      if (existingScores[dateKey] !== undefined) {
        return prevMap; // Block duplicate scores for the same date key
      }

      return {
        ...prevMap,
        [currentActiveId]: {
          ...currentChild,
          wordleScores: {
            ...existingScores,
            [dateKey]: points
          }
        }
      };
    });
  }, [activeChildId]);

  const addUsageTime = useCallback((seconds) => {
    setChildrenMap(prevMap => {
      if (!prevMap) return null;
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
      const safePrev = prev || [];
      const existing = safePrev.find(w => w.word === word);
      if (existing) {
        return safePrev.map(w => w.word === word ? { ...w, count: w.count + 1 } : w);
      }
      return [...safePrev, { word, tierId, errorType, count: 1 }];
    });
  }, [setStruggleWords]);

  const resolveStruggleWord = useCallback((word, tierId) => {
    setStruggleWords(prev => {
      const safePrev = prev || [];
      const existing = safePrev.find(w => w.word === word && w.tierId === tierId);
      if (existing) {
        return safePrev.map(w => w.word === word && w.tierId === tierId ? { 
          ...w, 
          mastered: true, 
          correctCount: (w.correctCount || 0) + 1 
        } : w);
      }
      return safePrev;
    });
  }, [setStruggleWords]);

  const redeemReward = useCallback((rewardId) => {
    console.log(`[APP CONTEXT] redeemReward called for rewardId: ${rewardId}`);
    setRewards(prev => {
      console.log(`[APP CONTEXT] redeemReward: mapping rewards. Previous rewards state:`, prev);
      const updated = prev.map(r => r.id === rewardId ? { ...r, redeemed: true } : r);
      console.log(`[APP CONTEXT] redeemReward: updated rewards state:`, updated);
      return updated;
    });
  }, [setRewards]);

  const purchaseReward = useCallback((rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && studentPoints >= reward.cost) {
      return true;
    }
    return false;
  }, [rewards, studentPoints]);

  const adminRestoreLucas = useCallback(() => {
    if (user?.email !== 'jlivanramirez7@gmail.com' || !db) {
      alert("Administrative privileges required.");
      return;
    }

    // Find Lucas profile
    let lucasKey = null;
    let lucasData = null;

    for (const [cId, child] of Object.entries(childrenMap || {})) {
      if (child && child.studentName && child.studentName.trim().toLowerCase() === 'lucas') {
        lucasKey = cId;
        lucasData = child;
        break;
      }
    }

    if (!lucasKey) {
      lucasKey = `child_${Date.now()}`;
      lucasData = {
        studentName: 'Lucas',
        currentGradeLevel: '4th',
        studentStreak: 0,
        usageTime: 1800
      };
    }

    const sectionScores = {};
    const sectionAccuracy = {};
    const listenedLessons = [];
    let pointsTotal = 0;

    // Helper to calculate and record 100% perfect scores
    const completeSection = (secId, words) => {
      const wCount = words?.length || 0;
      if (wCount === 0) return;

      const easyScore = wCount * 2; // (wCount * 2) * 0.5 * 2
      const medScore = wCount * 6;  // wCount * 3 * 2
      const hardScore = wCount * 60; // wCount * 30 * 2

      sectionScores[`${secId}-easy`] = easyScore;
      sectionAccuracy[`${secId}-easy`] = 100;
      pointsTotal += easyScore;

      sectionScores[`${secId}-medium`] = medScore;
      sectionAccuracy[`${secId}-medium`] = 100;
      pointsTotal += medScore;

      sectionScores[`${secId}-hard`] = hardScore;
      sectionAccuracy[`${secId}-hard`] = 100;
      pointsTotal += hardScore;

      listenedLessons.push(secId);
    };

    const completeMastery = (tierId) => {
      const masteryId = `tier_${tierId}_mastery`;
      const score = 15 * 60; // 15 words * 30 pts * 2
      sectionScores[`${masteryId}-hard`] = score;
      sectionAccuracy[`${masteryId}-hard`] = 100;
      pointsTotal += score;
      listenedLessons.push(masteryId);
    };

    // Process Curriculum wordBank4th
    const t1 = wordBank4th.tiers.find(t => t.id === 'g4_t1');
    if (t1) {
      t1.sections.forEach(s => completeSection(s.id, s.words));
      completeMastery('g4_t1');
    }

    const t2 = wordBank4th.tiers.find(t => t.id === 'g4_t2');
    if (t2) {
      t2.sections.forEach(s => completeSection(s.id, s.words));
      completeMastery('g4_t2');
    }

    const t3 = wordBank4th.tiers.find(t => t.id === 'g4_t3');
    if (t3) {
      t3.sections.forEach(s => completeSection(s.id, s.words));
      completeMastery('g4_t3');
    }

    const t4 = wordBank4th.tiers.find(t => t.id === 'g4_t4');
    if (t4) {
      t4.sections.forEach(s => completeSection(s.id, s.words));
      // T4 mastery is unlocked but NOT completed
    }

    const updatedLucasData = {
      ...lucasData,
      studentPoints: pointsTotal,
      weeklyPoints: pointsTotal,
      unlockedTiers: ['g4_t1', 'g4_t2', 'g4_t3', 'g4_t4'],
      listenedLessons,
      sectionScores,
      sectionAccuracy,
      studentEmail: 'lucasjramirez7@gmail.com',
      struggleWords: [],
      studentStreak: 0,
      rewards: [
        { id: 1, name: '30 mins Screen Time', cost: 500 },
        { id: 2, name: 'Trip to Park', cost: 1000 }
      ]
    };

    const updatedChildrenMap = {
      ...(childrenMap || {}),
      [lucasKey]: updatedLucasData
    };

    const saveRestoredProgress = async () => {
      try {
        const parentUid = user.uid;
        const docRef = doc(db, 'users', parentUid);
        
        console.log(`[ADMIN ACTION] Writing Lucas recovery data to users/${parentUid}...`);
        await setDoc(docRef, {
          activeChildId: lucasKey,
          children: updatedChildrenMap,
          isApproved: true,
          coppaConsented: true,
          email: 'jlivanramirez7@gmail.com',
          lastInteractionAt: serverTimestamp()
        }, { merge: true });

        console.log(`[ADMIN ACTION] Establishing student_links association for lucasjramirez7@gmail.com...`);
        await setDoc(doc(db, 'student_links', 'lucasjramirez7@gmail.com'), {
          parentUid: parentUid,
          childId: lucasKey
        }, { merge: true });

        // Sync client state
        skipSaveRef.current = true;
        setChildrenMap(updatedChildrenMap);
        setActiveChildId(lucasKey);
        setCoppaConsented(true);

        alert(`🎉 SUCCESS: Lucas's progress restored up to Homophones 6 (Tier 4)! Email association established.`);
      } catch (err) {
        console.error("Administrative recovery failed:", err);
        alert("Administrative recovery failed: " + err.message);
      }
    };

    saveRestoredProgress();
  }, [user, db, childrenMap]);

  const linkStudentEmail = useCallback(async (childId, email) => {
    setChildrenMap(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [childId]: {
          ...(prev[childId] || {}),
          studentEmail: email
        }
      };
    });


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

  const registerParentCoppa = useCallback(async (email) => {
    if (!user) return { success: false, error: "User not logged in" };
    const targetUid = isStudent ? parentUid : user.uid;
    try {
      const res = await fetch('/api/register-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, uid: targetUid })
      });
      const data = await res.json();
      if (res.ok) {
        setCoppaConsented(data.coppa_consented);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Unknown server error" };
      }
    } catch (err) {
      console.error("Error registering COPPA parent:", err);
      return { success: false, error: err.message };
    }
  }, [user, isStudent, parentUid]);

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
      return stats.easyAcc === 100 || stats.medAcc === 100 || stats.hardAcc === 100;
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

  const rawWordleScores = activeChild.wordleScores;
  const wordleScores = useMemo(() => rawWordleScores || {}, [rawWordleScores]);

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
    rewards, setRewards, purchaseReward, linkStudentEmail, coppaConsented, registerParentCoppa, isApproved, parentEmail,
    currentGradeLevel, setCurrentGradeLevel,
    tiers, resetProgress, isSectionMastered, getRecommendedDifficulty, restoreProgress,
    isLoaded, error,
    studentName, setStudentName,
    childrenMap, activeChildId, setActiveChildId: switchChild, addChild, deleteChild,
    resolveStruggleWord, redeemReward, adminRestoreLucas,
    wordleScores, addWordlePoints
  }), [
    studentPoints, setStudentPoints, addPoints, weeklyPoints, usageTime, addUsageTime,
    studentStreak, setStudentStreak,
    unlockedTiers, setUnlockedTiers,
    struggleWords, addStruggleWord, resolveStruggleWord, redeemReward, adminRestoreLucas,
    sectionScores, updateSectionScore,
    sectionAccuracy, getSectionStats,
    enablePacing, setEnablePacing,
    enableDifficultyGating, setEnableDifficultyGating,
    isDifficultyUnlocked,
    listenedLessons, markLessonListened,
    rewards, setRewards, purchaseReward, linkStudentEmail, coppaConsented, registerParentCoppa, isApproved, parentEmail,
    currentGradeLevel, setCurrentGradeLevel,
    tiers, resetProgress, isSectionMastered, getRecommendedDifficulty, restoreProgress,
    isLoaded, error,
    studentName, setStudentName,
    childrenMap, activeChildId, switchChild, addChild, deleteChild,
    wordleScores, addWordlePoints
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
