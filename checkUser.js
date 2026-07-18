import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", "urbain.traore@zaka.bf"));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log("No user document found for urbain.traore@zaka.bf by email query.");
    // also maybe check auth users? But we only have firebase-client here. Wait, we don't have firebase-admin unless we install it. Let's see if we have it in package.json.
  } else {
    snapshot.forEach(doc => {
      console.log(`Found user doc ${doc.id}:`, doc.data());
    });
  }
  process.exit(0);
}
run();
