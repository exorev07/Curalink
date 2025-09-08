// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9_UqNfJekvzTaqv_LgGraFdyP0LmWuGo",
  databaseURL: "https://curalink-6a722-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "curalink-6a722"
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
