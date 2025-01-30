importScripts("https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.4.0/firebase-messaging-compat.js");


// Initialize Firebase with your configuration
firebase.initializeApp({
  apiKey: "AIzaSyB9mGSTs5QMRoS86QhOeOl7iIf4bcRjn-w",
  authDomain: "wakandan-app.firebaseapp.com",
  databaseURL: "https://wakandan-app-default-rtdb.firebaseio.com",
  projectId: "wakandan-app",
  storageBucket: "wakandan-app.appspot.com",
  messagingSenderId: "624055451312",
  appId: "1:624055451312:web:2ea14e906244e4e9538575",
  measurementId: "G-GN28DGVQ18"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Ensure the correct path to your logo
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received.');

  event.notification.close(); // Close the notification

  // Handle the click action, e.g., open a specific URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If the app is already open, focus on it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If the app is not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/'); // Replace '/' with the URL you want to open
      }
    })
  );
});
