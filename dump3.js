import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Uses (default)

async function dump() {
  const querySnapshot = await getDocs(collection(db, "users"));
  querySnapshot.forEach((doc) => {
    console.log(`users: ${doc.id} => ${JSON.stringify(doc.data())}`);
  });
  
  const querySnapshot2 = await getDocs(collection(db, "establishments"));
  querySnapshot2.forEach((doc) => {
    console.log(`est: ${doc.id} => ${JSON.stringify(doc.data())}`);
  });
  process.exit(0);
}
dump();
