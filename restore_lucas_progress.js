/* global process */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const TARGET_SECTIONS = [
  'g4_t1_s1', // I before E Vowel Team
  'g4_t1_s2', // EE Vowel Team
  'g4_t1_s3', // EA Vowel Team
  'g4_t1_s4', // OU/OW Vowels
  'g4_t1_s5', // Bossy R
  'g4_t1_s6', // Magic E
  'g4_t2_s1'  // Root: STRUCT (The only lesson before Root: PORT in Tier 2)
];

const MASTERY_SECTIONS = [
  'tier_1_mastery'
];

async function restoreLucasProgress() {
  console.log(`\n=================================================================`);
  console.log(`🚀 LAUNCHING FIRESTORE Lucas PROGRESS RESTORATION UTILITY`);
  console.log(`=================================================================\n`);

  let config;
  try {
    console.log(`📡 Fetching active Firebase configuration from local dev server...`);
    const res = await fetch('http://localhost:5173/api/config');
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    config = await res.json();
    console.log(`✅ Successfully loaded Firebase project config: ${config.VITE_FIREBASE_PROJECT_ID}`);
  } catch (err) {
    console.error(`\n❌ ERROR: Local Vite dev server must be running to fetch config:`, err.message);
    console.error(`Please run "npm run dev" in a separate terminal and try again.\n`);
    process.exit(1);
  }

  const firebaseConfig = {
    apiKey: config.VITE_FIREBASE_API_KEY,
    authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.VITE_FIREBASE_APP_ID,
    measurementId: config.VITE_FIREBASE_MEASUREMENT_ID
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    console.log(`🔍 Scanning Firestore 'users' collection for master account...`);
    const usersSnap = await getDocs(collection(db, 'users'));

    let parentDoc = null;
    usersSnap.forEach((docSnap) => {
      if (docSnap.data().email === 'jlivanramirez7@gmail.com') {
        parentDoc = { id: docSnap.id, data: docSnap.data() };
      }
    });

    if (!parentDoc) {
      console.error(`\n❌ ERROR: Master parent account jlivanramirez7@gmail.com not found in database.`);
      process.exit(1);
    }

    console.log(`✅ Found master parent document [ID: ${parentDoc.id}]`);

    let lucasKey = null;
    let lucasData = null;

    if (parentDoc.data.children && typeof parentDoc.data.children === 'object') {
      for (const [cId, child] of Object.entries(parentDoc.data.children)) {
        if (child && child.studentName && child.studentName.trim().toLowerCase() === 'lucas') {
          lucasKey = cId;
          lucasData = child;
          break;
        }
      }
    }

    if (!lucasData) {
      console.log(`⚠️ Child profile "Lucas" not found. Let's automatically initialize a new profile key...`);
      lucasKey = `child_${Date.now()}`;
      lucasData = {
        studentName: 'Lucas',
        currentGradeLevel: '4th',
        studentStreak: 0,
        usageTime: 1800 // 30 mins baseline
      };
    }

    console.log(`👦 Calibrating progress for profile "Lucas" [Key: ${lucasKey}]`);

    const sectionScores = {};
    const sectionAccuracy = {};
    const listenedLessons = [];
    let pointsTotal = 0;

    // Hydrate Tier 1 and Tier 2 previous sections
    TARGET_SECTIONS.forEach((secId) => {
      // 1. Easy Difficulty (20 pts max)
      const easyKey = `${secId}-easy`;
      sectionScores[easyKey] = 20;
      sectionAccuracy[easyKey] = 1.0;
      pointsTotal += 20;

      // 2. Medium Difficulty (60 pts max)
      const mediumKey = `${secId}-medium`;
      sectionScores[mediumKey] = 60;
      sectionAccuracy[mediumKey] = 1.0;
      pointsTotal += 60;

      // 3. Hard Difficulty (600 pts max)
      const hardKey = `${secId}-hard`;
      sectionScores[hardKey] = 600;
      sectionAccuracy[hardKey] = 1.0;
      pointsTotal += 600;

      // Mark as listened
      listenedLessons.push(secId);
    });

    // Hydrate Tier Mastery
    MASTERY_SECTIONS.forEach((masteryId) => {
      // Mastery has only hard difficulty (15 words * 30 pts * 2 perfect multiplier = 900 pts max)
      const masteryKey = `${masteryId}-hard`;
      sectionScores[masteryKey] = 900;
      sectionAccuracy[masteryKey] = 1.0;
      pointsTotal += 900;

      listenedLessons.push(masteryId);
    });

    console.log(`\n📈 RESTORATION PROFILE:`);
    console.log(`   - Completed Lessons Listened: ${listenedLessons.length}`);
    console.log(`   - Points Restored: ${pointsTotal} pts`);

    const updatedLucasData = {
      ...lucasData,
      studentPoints: pointsTotal,
      weeklyPoints: pointsTotal,
      unlockedTiers: ['tier_1', 'tier_2'],
      listenedLessons: listenedLessons,
      sectionScores: sectionScores,
      sectionAccuracy: sectionAccuracy,
      studentEmail: 'lucasjramirez7@gmail.com' // Re-link linked email
    };

    const updatedChildren = {
      ...parentDoc.data.children,
      [lucasKey]: updatedLucasData
    };

    console.log(`\n⚙️ Saving restored Lucas profile to Firestore users/${parentDoc.id}...`);
    await setDoc(doc(db, 'users', parentDoc.id), {
      children: updatedChildren,
      activeChildId: lucasKey,
      isApproved: true,
      coppaConsented: true
    }, { merge: true });

    console.log(`\n🎉 SUCCESS: Lucas's progress has been fully restored!`);
    console.log(`Lucas is now positioned right at "Root: PORT" with 100% completions for Tier 1 and a point balance of: ${pointsTotal} pts.`);
  } catch (err) {
    console.error(`\n❌ FATAL ERROR during database operation:`, err.message);
  }
}

restoreLucasProgress();
