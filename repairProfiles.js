import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeFirestore, collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalLongPollingOptions: { useFetchStreams: false }
}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const email = "testuser_1784282067399@example.com";
  const password = "Password123!";
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    const userRef = collection(db, "users");
    const userSnap = await getDocs(userRef);
    
    for (const u of userSnap.docs) {
      let data = u.data();
      let changed = false;
      
      if (data.role === 'Maquis' || data.role === 'maquis') {
        data.role = 'gerant';
        changed = true;
      }
      
      // Ensure all fields exist
      if (!data.role) {
        data.role = 'client';
        changed = true;
      }
      
      if (changed) {
        console.log(`Repaired user ${u.id}`);
        await setDoc(doc(db, "users", u.id), data);
      }
    }
    
    // Also check orphan establishments
    const estRef = collection(db, "establishments");
    const estSnap = await getDocs(estRef);
    
    for (const est of estSnap.docs) {
      const ownerId = est.data().ownerId;
      const oRef = doc(db, "users", ownerId);
      const oSnap = await getDoc(oRef);
      if (!oSnap.exists()) {
        console.log(`Creating user doc for orphan establishment owner ${ownerId}`);
        await setDoc(oRef, {
          role: 'gerant',
          email: 'unknown@zaka.bf',
          name: est.data().name + ' Owner',
          phone: est.data().phone || '',
          city: est.data().city || '',
          country: est.data().country || ''
        });
      }
    }
    
    console.log("Migration finished.");
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
