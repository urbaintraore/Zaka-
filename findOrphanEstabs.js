import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { initializeFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
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
    const estRef = collection(db, "establishments");
    const snapshot = await getDocs(estRef);
    
    for (const est of snapshot.docs) {
      const ownerId = est.data().ownerId;
      const userRef = doc(db, "users", ownerId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        console.log(`Orphan Establishment: ${est.id} (Owner UID: ${ownerId}) -> NO USER DOC FOUND`);
        console.log("Estab Data:", est.data());
      } else {
        console.log(`Estab ${est.id} owner ${ownerId} has a user doc.`);
      }
    }
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
