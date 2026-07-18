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
    console.log("Logged in");
    
    const estRef = collection(db, "establishments");
    const snapshot = await getDocs(estRef);
    
    snapshot.forEach(doc => {
      console.log(`Estab ${doc.id}:`, doc.data());
    });

  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
