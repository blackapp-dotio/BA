import React from 'react';
import { createRoot } from 'react-dom/client';
import AppWrapper from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

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

let messaging = null;

// Check if the browser supports IndexedDB (required for Firebase Messaging)
if (!('indexedDB' in window)) {
  console.warn("This browser doesn't support IndexedDB. Firebase Messaging will not work.");
} else {
  try {
    // Initialize Firebase Messaging service
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Error initializing Firebase Messaging: ", error.message);
    if (error.code === 'messaging/unsupported-browser' || error.code === 'messaging/indexed-db-unsupported') {
      // Handle unsupported browser or environment cases here
      alert("Push notifications are not supported in this browser or environment.");
    }
  }
}

// Register the Firebase messaging service worker
if ('serviceWorker' in navigator && messaging) {
  navigator.serviceWorker
    .register(`${process.env.PUBLIC_URL}/firebase-messaging-sw.js`)
    .then((registration) => {
      console.log('Firebase Messaging Service Worker registration successful with scope: ', registration.scope);
    })
    .catch((error) => {
      console.error('Firebase Messaging Service Worker registration failed:', error);
    });
}

// Register the default service worker if using one (Optional)
serviceWorker.register();

// Create and render the root element using React 18's createRoot API
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  </React.StrictMode>
);
