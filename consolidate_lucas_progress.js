/* global process */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

async function runMigration() {
  console.log(`\n=================================================================`);
  console.log(`🚀 LAUNCHING FIRESTORE PROGRESS CONSOLIDATION & CLEANUP UTILITY`);
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
    console.log(`🔍 Scanning Firestore 'users' collection...`);
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`📊 Found ${usersSnap.size} total documents in 'users' collection.\n`);

    let masterDoc = null;
    let legacyLucasDoc = null;
    const irrelevantLegacyDocs = [];

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const email = data.email || '';

      if (email === 'jlivanramirez7@gmail.com') {
        masterDoc = { id, data };
        console.log(`⭐ Identified jlivanramirez7@gmail.com's Master Document [ID: ${id}]`);
      } else if (email === 'lucasjramirez7@gmail.com' || id.includes('lucas')) {
        legacyLucasDoc = { id, data };
        console.log(`👦 Identified Standalone Legacy Lucas Document [ID: ${id}]`);
      } else if (!email && data.children && typeof data.children === 'object') {
        // Fallback: check if this unlabeled document contains a child named "Lucas"
        const hasLucas = Object.values(data.children).some(
          c => c && c.studentName && c.studentName.trim().toLowerCase() === 'lucas'
        );
        if (hasLucas) {
          legacyLucasDoc = { id, data };
          console.log(`👦 Identified Unlabeled Legacy Document containing "Lucas" [ID: ${id}]`);
        } else {
          irrelevantLegacyDocs.push({ id, email: 'Unlabeled Legacy' });
        }
      } else if (email !== 'jlivanramirez7@gmail.com') {
        irrelevantLegacyDocs.push({ id, email });
      }
    });

    if (!masterDoc) {
      console.error(`\n❌ ERROR: Master parent account jlivanramirez7@gmail.com does not have a document in the 'users' collection yet.`);
      console.error(`💡 Instruction: Please log into the application once as jlivanramirez7@gmail.com to create the master document, then re-run this script.\n`);
      process.exit(1);
    }

    if (legacyLucasDoc) {
      console.log(`\n==================================================`);
      console.log(`🔗 CONSOLIDATING PROGRESS AND MERGING DATA...`);
      console.log(`==================================================`);

      // Find Lucas's profile in master children list
      let masterLucasKey = null;
      let masterLucasData = null;

      if (masterDoc.data.children && typeof masterDoc.data.children === 'object') {
        for (const [cId, child] of Object.entries(masterDoc.data.children)) {
          if (child && child.studentName && child.studentName.trim().toLowerCase() === 'lucas') {
            masterLucasKey = cId;
            masterLucasData = child;
            break;
          }
        }
      }

      // Find Lucas's profile in legacy children list
      let legacyLucasData = null;
      if (legacyLucasDoc.data.children && typeof legacyLucasDoc.data.children === 'object') {
        legacyLucasData = Object.values(legacyLucasDoc.data.children).find(
          c => c && c.studentName && c.studentName.trim().toLowerCase() === 'lucas'
        );
      } else if (legacyLucasDoc.data.studentPoints !== undefined) {
        // Legacy single-student document format fallback
        legacyLucasData = {
          studentName: 'Lucas',
          studentPoints: legacyLucasDoc.data.studentPoints || 0,
          studentStreak: legacyLucasDoc.data.studentStreak || 0,
          unlockedTiers: legacyLucasDoc.data.unlockedTiers || [],
          struggleWords: legacyLucasDoc.data.struggleWords || [],
          sectionScores: legacyLucasDoc.data.sectionScores || {},
          sectionAccuracy: legacyLucasDoc.data.sectionAccuracy || {},
          listenedLessons: legacyLucasDoc.data.listenedLessons || [],
          rewards: legacyLucasDoc.data.rewards || [],
          currentGradeLevel: legacyLucasDoc.data.currentGradeLevel || '4th'
        };
      }

      if (legacyLucasData) {
        console.log(`\n📊 PROGRESS COMPARISON FOR "LUCAS":`);
        const masterPoints = masterLucasData ? (masterLucasData.studentPoints || 0) : 0;
        const legacyPoints = legacyLucasData.studentPoints || 0;
        console.log(`   - Master Account Profile Points: ${masterPoints} pts`);
        console.log(`   - Standalone Legacy Document Points: ${legacyPoints} pts`);

        // Take the data that is furthest along (max points)
        let unifiedLucasData;
        if (legacyPoints > masterPoints) {
          console.log(`🚀 CRITICAL DECISION: Legacy document is further along. Merging Legacy progress to Master.`);
          unifiedLucasData = {
            ...legacyLucasData,
            studentEmail: 'lucasjramirez7@gmail.com' // Ensure linked student email is preserved
          };
        } else {
          console.log(`🚀 CRITICAL DECISION: Master account profile is further along (or equal). Keeping Master progress.`);
          unifiedLucasData = {
            ...(masterLucasData || legacyLucasData),
            studentEmail: 'lucasjramirez7@gmail.com'
          };
        }

        const childKey = masterLucasKey || `child_${Date.now()}`;
        const updatedChildren = {
          ...(masterDoc.data.children || {}),
          [childKey]: unifiedLucasData
        };

        console.log(`\n⚙️ Writing consolidated childrenMap to master users/${masterDoc.id}...`);
        await setDoc(doc(db, 'users', masterDoc.id), {
          children: updatedChildren,
          activeChildId: childKey,
          isApproved: true,
          isAdmin: true, // Ensure jlivanramirez7@gmail.com is approved as the ONLY admin
          email: 'jlivanramirez7@gmail.com'
        }, { merge: true });
        console.log(`✅ Successfully saved unified children profiles to master account.`);

        if (legacyLucasDoc.id !== masterDoc.id) {
          console.log(`🧹 Deleting redundant legacy Lucas document users/${legacyLucasDoc.id}...`);
          await deleteDoc(doc(db, 'users', legacyLucasDoc.id));
          console.log(`✅ Successfully deleted users/${legacyLucasDoc.id}`);
        }
      } else {
        console.log(`⚠️ Could not resolve specific child profile "Lucas" inside legacy document.`);
      }
    } else {
      console.log(`ℹ️ No legacy document containing child "Lucas" was identified. Making sure master is admin...`);
      await setDoc(doc(db, 'users', masterDoc.id), {
        isApproved: true,
        isAdmin: true,
        email: 'jlivanramirez7@gmail.com'
      }, { merge: true });
      console.log(`✅ Master account jlivanramirez7@gmail.com verified as approved ADMIN.`);
    }

    // Delete other irrelevant legacy documents
    if (irrelevantLegacyDocs.length > 0) {
      console.log(`\n==================================================`);
      console.log(`🧹 DELETING IRRELEVANT LEGACY DOCUMENTS...`);
      console.log(`==================================================`);
      for (const docInfo of irrelevantLegacyDocs) {
        console.log(`🗑️ Deleting users/${docInfo.id} (${docInfo.email})...`);
        await deleteDoc(doc(db, 'users', docInfo.id));
        console.log(`✅ Deleted users/${docInfo.id}`);
      }
    } else {
      console.log(`\nℹ️ No other legacy user documents were found for deletion.`);
    }

    console.log(`\n🎉 PROGRESS CONSOLIDATION & DATABASE CLEANUP COMPLETE!`);
  } catch (err) {
    console.error(`\n❌ FATAL ERROR during database operation:`, err.message);
  }
}

runMigration();
