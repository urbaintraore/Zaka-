import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeFirestore, collection, getDocs, query, where } from "firebase/firestore";
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
    const q = query(usersRef, where("email", "==", "urbain.traoreurb@gmail.com"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("No user document found for urbain.traoreurb@gmail.com.");
    } else {
      snapshot.forEach(doc => {
        console.log(`Found user doc ${doc.id}:`, doc.data());
      });
    }
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
