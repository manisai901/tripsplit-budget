import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    await signInAnonymously(auth);
    console.log("Anon user:", auth.currentUser?.uid);
    
    console.log("Testing basic list query...");
    const q1 = query(collection(db, 'trips'), where('members', 'array-contains', auth.currentUser?.uid));
    const snap1 = await getDocs(q1);
    console.log("Success! docs:", snap1.size);
    
    console.log("Testing list query with orderBy...");
    const q2 = query(collection(db, 'trips'), where('members', 'array-contains', auth.currentUser?.uid), orderBy('createdAt', 'desc'));
    const snap2 = await getDocs(q2);
    console.log("Success with orderBy! docs:", snap2.size);
  } catch (e: any) {
    console.log("CODE:", e.code);
    console.error("ERROR:", e);
  }
  process.exit(0);
}
run();
