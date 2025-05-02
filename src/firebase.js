// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "REMOVED",
  authDomain: "kahua-waiwai.firebaseapp.com",
  projectId: "kahua-waiwai",
  storageBucket: "kahua-waiwai.firebasestorage.app",
  messagingSenderId: "548021501750",
  appId: "1:548021501750:web:bc1ea76f36ed08c774fd97",
  measurementId: "G-LCJNQHY48L",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const functions = getFunctions(app, "us-central1");

export { db, analytics, app, auth, functions };