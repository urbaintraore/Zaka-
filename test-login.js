import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testLogin() {
  try {
    await signInWithEmailAndPassword(auth, "70000000@zaka.bf", "password_goes_here"); // I don't know the password
    console.log("Success");
  } catch (e) {
    console.log(e.code);
  }
  process.exit(0);
}
testLogin();
