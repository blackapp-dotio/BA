import React, { useState, useEffect } from 'react';
import { ref, query, orderByChild, startAt, endAt, get, update } from 'firebase/database';
import { database } from '../firebase'; // Adjust the path to your Firebase setup

const AddMember = ({ circleId, currentMembers, onClose, onMemberAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      console.log(`Searching for users with query: "${searchQuery}"`);

      try {
        const usersRef = ref(database, 'users');
        const userQuery = query(
          usersRef,
          orderByChild('displayName'),
          startAt(searchQuery),
          endAt(searchQuery + '\uf8ff')
        );

        const snapshot = await get(userQuery);

        if (snapshot.exists()) {
          const users = [];
          snapshot.forEach((child) => {
            const userData = { uid: child.key, ...child.val() };
            // Exclude members already in the circle
            if (!currentMembers.includes(userData.uid)) {
              users.push(userData);
            }
          });
          setSearchResults(users);
        } else {
          setSearchResults([]);
          console.log('No users found.');
        }
      } catch (err) {
        console.error('Error searching users:', err);
        setError('Failed to fetch users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [searchQuery, currentMembers]);

  const handleAddMember = async (userId) => {
    try {
      const membersRef = ref(database, `circles/${circleId}/members`);
      await update(membersRef, { [userId]: true });
      console.log(`User ${userId} added to circle ${circleId}`);
      onMemberAdded(userId);
      onClose();
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member. Please try again.');
    }
  };

  return (
    <div className="add-member">
      <h2>Add Member to Circle</h2>
      <input
        type="text"
        placeholder="Search by name"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <div className="results">
        {searchResults.map((user) => (
          <div key={user.uid} className="user">
            <span>{user.displayName}</span>
            <button onClick={() => handleAddMember(user.uid)}>Add</button>
          </div>
        ))}
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default AddMember;
