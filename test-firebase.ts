import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import * as fs from 'fs';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  await signInWithEmailAndPassword(auth, 'manisai19j@gmail.com', 'testing');
  console.log('Logged in as:', auth.currentUser?.uid);
  try {
    const q = query(
      collection(db, 'trips'),
      where('members', 'array-contains', auth.currentUser?.uid)
    );
    const snap = await getDocs(q);
    console.log('Success, docs:', snap.docs.length);
  } catch (e) {
    console.error('Error fetching trips:', e);
  }
}

run();
