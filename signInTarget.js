import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function run() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "urbain.traore@zaka.bf", "zaka2026"); // just guessing pass
    console.log("Logged in with uid:", cred.user.uid);
  } catch(e) {
    console.error("Error signing in:", e.message);
  }
  process.exit(0);
}
run();
