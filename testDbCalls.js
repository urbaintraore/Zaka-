import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, doc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

const col = collection(db, "users");
console.log(col.path); // should be "users"
const d = doc(db, "users", "123");
console.log(d.path); // should be "users/123"

