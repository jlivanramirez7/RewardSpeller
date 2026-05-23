/* global process */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

async function adjustPoints() {
  console.log(`\n=================================================================`);
  console.log(`🚀 LAUNCHING FIRESTORE POINT AUDIT & CALIBRATION UTILITY`);
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
    console.log(`🔍 Scanning Firestore 'users' collection for jlivanramirez7@gmail.com...`);
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

    console.log(`✅ Found master document [ID: ${parentDoc.id}]`);

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
      console.error(`\n❌ ERROR: Child profile "Lucas" not found in master account children list.`);
      process.exit(1);
    }

    console.log(`👦 Found child profile "Lucas" [Key: ${lucasKey}]`);
    console.log(`📊 Current Points registered in database: ${lucasData.studentPoints} pts`);

    // Audit and sum all section scores
    const scores = lucasData.sectionScores || {};
    console.log(`\n📝 Auditing section scores:`);
    let auditedTotal = 0;

    Object.entries(scores).forEach(([sectionKey, score]) => {
      console.log(`   - Section [${sectionKey}] achieved score: ${score} pts`);
      auditedTotal += score;
    });

    console.log(`\n🧮 Audited Lifetime Points Sum: ${auditedTotal} pts`);

    if (auditedTotal === 0) {
      console.warn(`⚠️ Lucas has 0 section scores recorded. Keeping a baseline of 20 pts (1 perfect Easy session) or 0.`);
      auditedTotal = Math.max(0, auditedTotal);
    }

    // Calibrate his point balances
    const updatedLucasData = {
      ...lucasData,
      studentPoints: auditedTotal,
      weeklyPoints: auditedTotal // Reset weekly to match lifetime for this sync
    };

    const updatedChildren = {
      ...parentDoc.data.children,
      [lucasKey]: updatedLucasData
    };

    console.log(`\n⚙️ Calibrating point balances and writing to Firestore users/${parentDoc.id}...`);
    await setDoc(doc(db, 'users', parentDoc.id), {
      children: updatedChildren
    }, { merge: true });

    console.log(`✅ SUCCESS: Lucas's point balances have been successfully calibrated to ${auditedTotal} pts!`);
  } catch (err) {
    console.error(`\n❌ FATAL ERROR during database operation:`, err.message);
  }
}

adjustPoints();
