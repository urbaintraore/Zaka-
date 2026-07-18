import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp({
  projectId: firebaseConfig.projectId
});

const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const authUser = await getAuth().getUserByEmail("urbain.traore@zaka.bf");
    console.log("Auth User found:", authUser.uid, authUser.email);
    
    const docRef = db.collection('users').doc(authUser.uid);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      console.log("Firestore User doc:", docSnap.data());
    } else {
      console.log("No Firestore User doc found for UID:", authUser.uid);
    }
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
