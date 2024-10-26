const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Use default credentials
  databaseURL: 'https://wakandan-app-default-rtdb.firebaseio.com' // Your Firebase database URL
});

// Function to assign the superAdmin role to a user
async function assignSuperAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email); // Get user by email
    await admin.auth().setCustomUserClaims(user.uid, { superAdmin: true }); // Assign superAdmin role
    console.log(`Super admin role assigned to ${user.email}`);
  } catch (error) {
    console.error('Error assigning super admin role:', error);
  }
}

// Call the function to assign superAdmin role to 'achiriglobal@gmail.com'
assignSuperAdmin('achiriglobal@gmail.com');
