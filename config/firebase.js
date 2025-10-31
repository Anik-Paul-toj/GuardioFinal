// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAsRDBT1_OkTOVJXa92Z4veoqRbra3-T2o",
  authDomain: "guardio-500a0.firebaseapp.com",
  projectId: "guardio-500a0",
  storageBucket: "guardio-500a0.firebasestorage.app",
  messagingSenderId: "306632039905",
  appId: "1:306632039905:web:a05da0839bbd6425b8c6a0",
  measurementId: "G-25GG6SNYS7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
