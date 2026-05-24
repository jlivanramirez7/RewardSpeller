/* global process */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const MAX_DIFFICULTY_POINTS = {
  easy: 20,   // 20 words * 0.5 * 2
  medium: 60, // 10 words * 3 * 2
  hard: 600   // 10 words * 30 * 2
};

async function calibrateProgress() {
  console.log(`\n=================================================================`);
  console.log(`🚀 LAUNCHING FIRESTORE PROGRESS CALIBRATION & POINT ALIGNMENT`);
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
      console.error(`\n❌ ERROR: Child profile "Lucas" not found in master children dictionary.`);
      process.exit(1);
    }

    console.log(`👦 Found child profile "Lucas" [Key: ${lucasKey}]`);
    console.log(`📊 Current Registered Points: ${lucasData.studentPoints} pts`);

    const originalScores = lucasData.sectionScores || {};
    const originalAccuracy = lucasData.sectionAccuracy || {};

    const calibratedScores = {};
    const calibratedAccuracy = {};
    let auditedPointsTotal = 0;

    console.log(`\n📝 AUDITING SECTION SCORES & ACCURACIES:`);
    
    // We will collect all completed section IDs to make sure we scan them all
    const allSectionKeys = new Set([
      ...Object.keys(originalScores),
      ...Object.keys(originalAccuracy)
    ]);

    allSectionKeys.forEach((secKey) => {
      const scoreVal = originalScores[secKey] || 0;
      const accuracyVal = originalAccuracy[secKey] !== undefined ? originalAccuracy[secKey] : 0;

      // Determine difficulty suffix from key (e.g., 'g4_t2_s2-easy' -> difficulty is 'easy')
      let difficulty = 'easy';
      if (secKey.endsWith('-medium')) difficulty = 'medium';
      else if (secKey.endsWith('-hard')) difficulty = 'hard';

      const maxAllowedScore = MAX_DIFFICULTY_POINTS[difficulty];
      
      // 1. Clamp scores
      let cleanScore = scoreVal;
      if (scoreVal > maxAllowedScore) {
        cleanScore = maxAllowedScore;
        console.log(`   ⚠️ CLAMPED SCORE: [${secKey}] ${scoreVal} pts -> ${cleanScore} pts (Exceeded max limit of ${maxAllowedScore} pts)`);
      } else {
        console.log(`   ✓ Score Validated: [${secKey}] ${scoreVal} pts`);
      }
      calibratedScores[secKey] = cleanScore;
      auditedPointsTotal += cleanScore;

      // 2. Clamp accuracies
      let cleanAccuracy = accuracyVal;
      if (accuracyVal > 1.0) {
        cleanAccuracy = 1.0;
        console.log(`   ⚠️ CLAMPED ACCURACY: [${secKey}] ${Math.round(accuracyVal * 100)}% -> 100% (Exceeded 100% limit)`);
      } else {
        console.log(`   ✓ Accuracy Validated: [${secKey}] ${Math.round(accuracyVal * 100)}%`);
      }
      calibratedAccuracy[secKey] = cleanAccuracy;
    });

    console.log(`\n🧮 Audited Point Balance Sum: ${auditedPointsTotal} pts`);

    // Calibrate the Lucas profile state
    const updatedLucasData = {
      ...lucasData,
      studentPoints: auditedPointsTotal,
      weeklyPoints: auditedPointsTotal,
      sectionScores: calibratedScores,
      sectionAccuracy: calibratedAccuracy
    };

    const updatedChildren = {
      ...parentDoc.data.children,
      [lucasKey]: updatedLucasData
    };

    console.log(`\n⚙️ Saving calibrated data back to master document users/${parentDoc.id}...`);
    await setDoc(doc(db, 'users', parentDoc.id), {
      children: updatedChildren
    }, { merge: true });

    console.log(`\n🎉 SUCCESS: Lucas's progress has been perfectly calibrated, clamped, and synced!`);
    console.log(`Lucas's total point balance is now exactly: ${auditedPointsTotal} pts.`);
  } catch (err) {
    console.error(`\n❌ FATAL ERROR during database operation:`, err.message);
  }
}

calibrateProgress();
