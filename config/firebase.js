// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

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

// Initialize Firebase Auth with AsyncStorage persistence for React Native
// Use a function to handle already initialized error
const getFirebaseAuth = () => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    // If already initialized, just get the existing instance
    if (error.code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw error;
  }
};

export const auth = getFirebaseAuth();

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Realtime Database (for Arduino ESP8266 devices)
export const rtdb = getDatabase(app);

export default app;
