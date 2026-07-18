import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

// Wait, firebase-admin needs credentials. I can't use it easily without a service account.
// Let me use REST API or just ignore it.
