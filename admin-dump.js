import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-blueprint.json', 'utf8')); // Wait, I don't have service account here.
