import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

console.log("[Firebase Initialization]", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || "(default)",
  currentDomain: typeof window !== 'undefined' ? window.location.hostname : 'node-environment'
});

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Explicitly set session persistence to local
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("[Firebase Auth] Persistance configurée sur browserLocalPersistence.");
  })
  .catch((error) => {
    console.error("[Firebase Auth] Échec de la configuration de la persistance :", error);
  });

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);
