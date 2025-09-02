// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  databaseURL: "https://demo-project-default-rtdb.firebaseio.com/",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Check if we're using demo config
const isDemoMode = firebaseConfig.apiKey === "demo-api-key";

if (isDemoMode) {
  console.warn("🚧 DEMO MODE: Using placeholder Firebase config. Please replace with your actual Firebase configuration.");
}

let app;
let auth;
let database;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  console.log("Please check your Firebase configuration in src/firebase/config.js");
}

export { auth, database, isDemoMode };
export default app;
