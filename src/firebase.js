// Import the necessary Firebase functions
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

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
const messaging = getMessaging(app);

// Export the initialized services for use throughout your project
export { auth, app, database, messaging };