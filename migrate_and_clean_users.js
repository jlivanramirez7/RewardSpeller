/* global process */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

async function runMigration() {
  console.log(`\n=================================================================`);
  console.log(`🚀 LAUNCHING FIRESTORE DATABASE CLEANUP & MIGRATION UTILITY`);
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

    let lucasLegacyDoc = null;
    let parentDoc = null;
    const otherLegacyDocs = [];

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const email = data.email || '';

      console.log(`🔹 Document [${id}] -> Email: "${email}"`);

      if (email === 'jlivanramirez7@gmail.com') {
        parentDoc = { id, data };
        console.log(`   ⭐ Identified jlivanramirez7@gmail.com's Master Account`);
      }

      // Check if this document contains a child named "Lucas"
      let hasLucas = false;
      if (data.children && typeof data.children === 'object') {
        hasLucas = Object.values(data.children).some(
          child => child && child.studentName && child.studentName.trim().toLowerCase() === 'lucas'
        );
      }

      if (hasLucas) {
        lucasLegacyDoc = { id, data };
        console.log(`   👦 Identified Legacy Account containing child profile "Lucas"`);
      } else if (email !== 'jlivanramirez7@gmail.com') {
        otherLegacyDocs.push({ id, email });
        console.log(`   🗑️ Identified Other Legacy User (Queued for deletion)`);
      }
    });

    if (lucasLegacyDoc) {
      if (parentDoc) {
        console.log(`\n==================================================`);
        console.log(`🔗 MIGRATING LUCAS PROFILE TO MASTER ACCOUNT...`);
        console.log(`==================================================`);
        
        const mergedChildren = {
          ...(parentDoc.data.children || {}),
          ...(lucasLegacyDoc.data.children || {})
        };

        const activeChildId = lucasLegacyDoc.data.activeChildId || parentDoc.data.activeChildId || 'child_1';

        console.log(`⚙️ Writing merged profile to master account users/${parentDoc.id}...`);
        await setDoc(doc(db, 'users', parentDoc.id), {
          children: mergedChildren,
          activeChildId: activeChildId,
          isApproved: true,
          isAdmin: true, // Make sure jlivanramirez7@gmail.com is the ONLY admin
          coppaConsented: true,
          email: 'jlivanramirez7@gmail.com'
        }, { merge: true });
        console.log(`✅ Master account jlivanramirez7@gmail.com successfully updated and set as ADMIN.`);

        // If the legacy Lucas doc was a separate document, delete it
        if (lucasLegacyDoc.id !== parentDoc.id) {
          console.log(`🧹 Deleting redundant legacy Lucas document users/${lucasLegacyDoc.id}...`);
          await deleteDoc(doc(db, 'users', lucasLegacyDoc.id));
          console.log(`✅ Deleted legacy document users/${lucasLegacyDoc.id}`);
        }
      } else {
        console.log(`\n==================================================`);
        console.log(`👑 INITIALIZING MASTER ACCOUNT WITH LUCAS DATA...`);
        console.log(`==================================================`);
        console.log(`⚠️ Master account jlivanramirez7@gmail.com does not have a Firestore document yet.`);
        console.log(`💡 Instruction: Please log into RewardSpeller once with jlivanramirez7@gmail.com first to create the UID document, then re-run this script to complete the migration!`);
      }
    } else {
      console.log(`\nℹ️ No separate legacy account containing "Lucas" was found (it may already be merged).`);
      if (parentDoc) {
        console.log(`👑 Ensuring master account jlivanramirez7@gmail.com is set as approved ADMIN...`);
        await setDoc(doc(db, 'users', parentDoc.id), {
          isApproved: true,
          isAdmin: true
        }, { merge: true });
        console.log(`✅ Master account jlivanramirez7@gmail.com is verified as ADMIN.`);
      }
    }

    // Delete other legacy users
    if (otherLegacyDocs.length > 0) {
      console.log(`\n==================================================`);
      console.log(`🧹 DELETING OTHER LEGACY USER DOCUMENTS...`);
      console.log(`==================================================`);
      for (const other of otherLegacyDocs) {
        console.log(`🗑️ Deleting legacy user ${other.email} (ID: ${other.id})...`);
        await deleteDoc(doc(db, 'users', other.id));
        console.log(`✅ Successfully deleted users/${other.id}`);
      }
    } else {
      console.log(`\nℹ️ No other legacy user documents were found for deletion.`);
    }

    console.log(`\n🎉 DATABASE MIGRATION & CLEANUP COMPLETE!`);
  } catch (err) {
    console.error(`\n❌ FATAL ERROR during database operation:`, err.message);
  }
}

runMigration();
