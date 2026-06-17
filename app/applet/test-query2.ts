import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";

import fs from 'fs';
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  await signInWithEmailAndPassword(auth, "manikantasaivootla@gmail.com", "password123").catch(e => console.log("Login failed", e.message));
  if (!auth.currentUser) return;
  console.log("Logged in as", auth.currentUser.uid);
  try {
    const q1 = query(collection(db, 'trips'), where('members', 'array-contains', auth.currentUser.uid));
    const snap = await getDocs(q1);
    console.log("Q1 success. docs:", snap.docs.length);
  } catch (e) {
    console.error("Q1 error:", e);
  }
}
run();
