import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeFirestore, collection, getDocs } from "firebase/firestore";
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
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    
    snapshot.forEach(doc => {
      console.log(`User ${doc.id}:`, doc.data());
    });
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
