import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import fetch from "node-fetch";

// We need to inject polyfills for firestore in node
globalThis.fetch = fetch;

import fs from "fs";
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// We would need the user's password, which we don't have.
