// Import the necessary Firebase functions
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions'; // Import Firebase Functions

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9mGSTs5QMRoS86QhOeOl7iIf4bcRjn-w",
  authDomain: "wakandan-app.firebaseapp.com",
  databaseURL: "https://wakandan-app-default-rtdb.firebaseio.com",
  projectId: "wakandan-app",
  storageBucket: "wakandan-app.appspot.com",
  messagingSenderId: "624055451312",
  appId: "1:624055451312:web:2ea14e906244e4e9538575",
  measurementId: "G-GN28DGVQ18"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const functions = getFunctions(app); // Initialize Firebase Functions

// Export the initialized instances for use in your app
export { app, auth, database, functions }; // Ensure functions is exported here
