import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeFirestore, collection, onSnapshot, query } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalLongPollingOptions: { useFetchStreams: false }
}, firebaseConfig.firestoreDatabaseId);

async function test() {
  const email = "testuser_1784282067399@example.com"; // the one I just created
  const password = "Password123!";
  
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log("Connecté avec UID:", cred.user.uid);
    
    // Attach listeners
    const queries = [
      'users',
      'relationshipRequests',
      'serviceRequests',
      'establishments',
      'publications'
    ];
    
    for (const q of queries) {
      console.log(`Attaching listener to ${q}...`);
      onSnapshot(query(collection(db, q)), (snap) => {
        console.log(`Received snapshot for ${q} with ${snap.size} docs.`);
      }, (error) => {
        console.error(`ERROR for ${q}:`, error);
      });
    }
    
    setTimeout(() => {
      console.log("Done waiting.");
      process.exit(0);
    }, 5000);
  } catch (err) {
    console.error("ERREUR:", err);
    process.exit(1);
  }
}
test();
