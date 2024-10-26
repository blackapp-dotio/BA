import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database, auth } from '../firebase';
import './SendAGMoney.css';

const SendAGMoney = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        const usersRef = ref(database, 'users');
        onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            const userList = Object.keys(usersData || {}).map(key => ({
                uid: key,
                ...usersData[key],
            })).filter(user => user.uid !== auth.currentUser.uid);
            setUsers(userList);
        });
    }, []);

    const handleSendMoney = async () => {
        if (!selectedUser || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
            alert('Please select a user and enter a valid amount.');
            return;
        }

        const senderRef = ref(database, `users/${auth.currentUser.uid}/wallet/balance`);
        const recipientRef = ref(database, `users/${selectedUser}/wallet/balance`);

        let senderBalance = 0;
        let recipientBalance = 0;

        onValue(senderRef, (snapshot) => {
            senderBalance = snapshot.val();
        }, { onlyOnce: true });

        onValue(recipientRef, (snapshot) => {
            recipientBalance = snapshot.val();
        }, { onlyOnce: true });

        if (senderBalance >= parseFloat(amount)) {
            const updates = {};
            updates[`users/${auth.currentUser.uid}/wallet/balance`] = senderBalance - parseFloat(amount);
            updates[`users/${selectedUser}/wallet/balance`] = recipientBalance + parseFloat(amount);

            try {
                await update(ref(database), updates);
                alert('AGMoney sent successfully!');
                setAmount('');
            } catch (error) {
                console.error('Error sending AGMoney:', error);
            }
        } else {
            alert('Insufficient balance.');
        }
    };

    return (
        <div className="send-money-container">
            <div className="send-money-header">
                <h3>Send AGMoney</h3>
            </div>
            <div className="send-money-form">
                <select
                    className="user-select"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                >
                    <option value="">Select User</option>
                    {users.map((user) => (
                        <option key={user.uid} value={user.uid}>
                            {user.displayName}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    className="amount-input"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <button
                    className="send-money-button"
                    onClick={handleSendMoney}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default SendAGMoney;
