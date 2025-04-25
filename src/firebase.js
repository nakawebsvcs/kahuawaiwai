// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const functions = getFunctions(app);

export { db, analytics, auth, functions };
