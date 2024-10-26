import React, { useState, useEffect, useContext } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import './UserList.css';

const UserList = ({ onSelectUser }) => {
    const [users, setUsers] = useState([]);
    const { user } = useContext(AuthContext);
    const [highlightedUsers, setHighlightedUsers] = useState([]);

    useEffect(() => {
        const usersRef = ref(database, 'users');
        onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            const usersList = Object.keys(usersData || {}).map(key => ({ uid: key, ...usersData[key] }));
            setUsers(usersList);
        });

        const messagesRef = ref(database, 'messages');
        onValue(messagesRef, (snapshot) => {
            const messagesData = snapshot.val();
            const newHighlightedUsers = [];
            Object.keys(messagesData || {}).forEach(key => {
                const message = messagesData[key];
                if (message.recipientId === user.uid && !message.read) {
                    newHighlightedUsers.push(message.senderId);
                }
            });
            setHighlightedUsers(newHighlightedUsers);
        });
    }, [user]);

    return (
        <div className="user-list">
            <ul>
                {users.map((userItem) => (
                    <li
                        key={userItem.uid}
                        className={highlightedUsers.includes(userItem.uid) ? 'highlighted' : ''}
                        onClick={() => onSelectUser(userItem)}
                    >
                        {userItem.displayName || userItem.email}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserList;
