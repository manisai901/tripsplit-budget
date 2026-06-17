import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "manikantasaivootla@gmail.com", "password123");
    console.log("Logged in");
  } catch (e: any) {
    console.log("Can't login as user, error", e.message);
    process.exit(1);
  }

  const user = auth.currentUser!;
  console.log("UID:", user.uid);

  try {
    const q = query(collection(db, 'trips'), where('members', 'array-contains', user.uid));
    const snap = await getDocs(q);
    console.log("Success! Docs:", snap.size);
  } catch(e: any) {
    console.error("List failed:", e.message);
  }
  process.exit(0);
}
run();
