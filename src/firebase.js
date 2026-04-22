// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDlNjJ73aAtXcB-gwTMq-oSO4xV4k0KAig",
  authDomain: "public-issue-reporting-s-812d8.firebaseapp.com",
  projectId: "public-issue-reporting-s-812d8",
  storageBucket: "public-issue-reporting-s-812d8.firebasestorage.app",
  messagingSenderId: "238003513958",
  appId: "1:238003513958:web:7896546c1476d033ce1ba7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;

