import React, { useState, useEffect } from 'react';
import { ref, set, push, onValue, remove, update } from 'firebase/database';
import { database, auth } from '../firebaseconfig';

const TestCircleAnalytics = () => {
  const [members, setMembers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [newMember, setNewMember] = useState({ id: '', interactions: 0, lastInteraction: '' });

  const userId = auth.currentUser.uid; // Assume the user is logged in
  const membersRef = ref(database, `users/${userId}/circle/members`);
  const analyticsRef = ref(database, `users/${userId}/circleAnalytics`);

  // Fetch members and analytics data
  useEffect(() => {
    const fetchMembers = onValue(membersRef, (snapshot) => {
      if (snapshot.exists()) setMembers(Object.entries(snapshot.val() || {}));
      else setMembers([]);
    });

    const fetchAnalytics = onValue(analyticsRef, (snapshot) => {
      if (snapshot.exists()) setAnalytics(snapshot.val());
      else setAnalytics({});
    });

    return () => {
      fetchMembers();
      fetchAnalytics();
    };
  }, [membersRef, analyticsRef]);

  // Add or update a member
  const handleAddMember = () => {
    if (!newMember.id || !newMember.interactions || !newMember.lastInteraction) {
      alert('Please fill out all fields.');
      return;
    }
    set(ref(database, `users/${userId}/circle/members/${newMember.id}`), {
      interactions: parseInt(newMember.interactions, 10),
      lastInteraction: newMember.lastInteraction,
    });
    setNewMember({ id: '', interactions: 0, lastInteraction: '' });
  };

  // Remove a member
  const handleRemoveMember = (id) => {
    remove(ref(database, `users/${userId}/circle/members/${id}`));
  };

  return (
    <div>
      <h2>Circle Analytics Testing</h2>

      {/* Display Current Analytics */}
      <div>
        <h3>Analytics</h3>
        <p><strong>Most Engaged:</strong> {analytics.mostEngaged || 'N/A'}</p>
        <p><strong>Recently Interacted:</strong> {analytics.recentlyInteracted?.join(', ') || 'None'}</p>
      </div>

      {/* Display Current Members */}
      <div>
        <h3>Circle Members</h3>
        <ul>
          {members.map(([id, member]) => (
            <li key={id}>
              <strong>ID:</strong> {id} | <strong>Interactions:</strong> {member.interactions} | 
              <strong>Last Interaction:</strong> {member.lastInteraction}{' '}
              <button onClick={() => handleRemoveMember(id)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Add New Member */}
      <div>
        <h3>Add / Update Member</h3>
        <input
          type="text"
          placeholder="Member ID"
          value={newMember.id}
          onChange={(e) => setNewMember({ ...newMember, id: e.target.value })}
        />
        <input
          type="number"
          placeholder="Interactions"
          value={newMember.interactions}
          onChange={(e) => setNewMember({ ...newMember, interactions: e.target.value })}
        />
        <input
          type="date"
          placeholder="Last Interaction"
          value={newMember.lastInteraction}
          onChange={(e) => setNewMember({ ...newMember, lastInteraction: e.target.value })}
        />
        <button onClick={handleAddMember}>Add / Update Member</button>
      </div>
    </div>
  );
};

export default TestCircleAnalytics;
