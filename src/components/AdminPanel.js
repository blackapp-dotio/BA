import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseconfig'; // Import functions from firebaseconfig.js

const AdminPanel = () => {
  const [userId, setUserId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [superAdminStatus, setSuperAdminStatus] = useState('');

  // Function to assign admin role
  const assignAdminRole = async () => {
    const setAdminRole = httpsCallable(functions, 'setAdminRole');
    try {
      const result = await setAdminRole({ uid: userId });
      setStatusMessage(result.data.message);
    } catch (error) {
      console.error('Error assigning admin role:', error);
      setStatusMessage('Error assigning admin role.');
    }
  };

  // Function to assign super admin role
  const assignSuperAdmin = async () => {
    const setSuperAdminRole = httpsCallable(functions, 'setSuperAdminRole');
    try {
      const result = await setSuperAdminRole(); // No need to pass UID, it's hardcoded
      setSuperAdminStatus(result.data.message);
    } catch (error) {
      console.error('Error assigning super admin role:', error);
      setSuperAdminStatus('Error assigning super admin role.');
    }
  };

  return (
    <div>
      <h2>Admin Panel</h2>

      {/* Admin Role Assignment */}
      <input
        type="text"
        placeholder="Enter User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button onClick={assignAdminRole}>Make Admin</button>
      {statusMessage && <p>{statusMessage}</p>}

      {/* Super Admin Role Assignment */}
      <h3>Super Admin Panel</h3>
      <button onClick={assignSuperAdmin}>Assign Super Admin Role</button>
      {superAdminStatus && <p>{superAdminStatus}</p>}
    </div>
  );
};

export default AdminPanel;
