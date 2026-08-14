import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore, Firestore, memoryLocalCache } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

console.log("[Firebase Initialization]", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || "(default)",
  currentDomain: typeof window !== 'undefined' ? window.location.hostname : 'node-environment'
});

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Explicitly set session persistence to local
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("[Firebase Auth] Persistance configurée sur browserLocalPersistence.");
  })
  .catch((error) => {
    console.warn("[Firebase Auth] Échec de la configuration de la persistance :", error);
  });

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: memoryLocalCache()
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.warn("[Firebase Firestore] Fallback initializing Firestore:", e);
  firestoreDb = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
