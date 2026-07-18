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
  await signInWithEmailAndPassword(auth, email, password);
  
  const userRef = collection(db, "users");
  const userSnap = await getDocs(userRef);
  
  userSnap.forEach(user => {
    if (user.data().email === 'urbain.traore@zaka.bf') {
      console.dir(user.data(), { depth: null });
    }
  });
  process.exit(0);
}
run();
