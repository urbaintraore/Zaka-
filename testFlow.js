import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  experimentalLongPollingOptions: { useFetchStreams: false }
}, firebaseConfig.firestoreDatabaseId);

async function test() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = "Password123!";
  
  try {
    console.log("1. Création de compte...");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Compte créé avec UID:", cred.user.uid);
    
    console.log("2. Écriture du profil dans Firestore...");
    await setDoc(doc(db, "users", cred.user.uid), {
      name: "Test User",
      email: email,
      role: "client"
    });
    console.log("Profil écrit.");
    
    console.log("3. Déconnexion...");
    await signOut(auth);
    console.log("Déconnecté.");
    
    console.log("4. Reconnexion...");
    const cred2 = await signInWithEmailAndPassword(auth, email, password);
    console.log("Connecté avec UID:", cred2.user.uid);
    
    console.log("5. Lecture du profil dans Firestore...");
    const snap = await getDoc(doc(db, "users", cred2.user.uid));
    console.log("Profil lu:", snap.data());
    
    process.exit(0);
  } catch (err) {
    console.error("ERREUR EXACTE:", err);
    process.exit(1);
  }
}
test();
