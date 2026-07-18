import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testReg() {
  try {
    await createUserWithEmailAndPassword(auth, "70000000@zaka.bf", "123456");
    console.log("Created successfully");
  } catch (e) {
    console.log(e.code);
  }
  process.exit(0);
}
testReg();
