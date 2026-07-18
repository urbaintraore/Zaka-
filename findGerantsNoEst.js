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
    
    const estRef = collection(db, "establishments");
    const estSnap = await getDocs(estRef);
    const ownerIds = new Set(estSnap.docs.map(d => d.data().ownerId));
    
    const userRef = collection(db, "users");
    const userSnap = await getDocs(userRef);
    
    console.log("Users with role 'gerant' but no establishment:");
    userSnap.forEach(user => {
      if (user.data().role === 'gerant') {
        if (!ownerIds.has(user.id)) {
          console.log(`- ${user.data().email} (UID: ${user.id}, Name: ${user.data().name})`);
        }
      }
    });

  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
