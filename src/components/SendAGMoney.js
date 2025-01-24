import React, { useState, useEffect } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { database, auth } from '../firebase';
import { calculatePlatformFee } from '../utils/feeUtils'; // Import the fee utility
import './SendAGMoney.css';

const SendAGMoney = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [amount, setAmount] = useState('');
    const [senderBalance, setSenderBalance] = useState(0);

    useEffect(() => {
        // Fetch the list of users excluding the current user
        const usersRef = ref(database, 'users');
        onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            const userList = Object.keys(usersData || {}).map(key => ({
                uid: key,
                ...usersData[key],
            })).filter(user => user.uid !== auth.currentUser.uid);
            setUsers(userList);
        });

        // Fetch the sender's wallet balance
        const senderRef = ref(database, `users/${auth.currentUser.uid}/wallet/balance`);
        onValue(senderRef, (snapshot) => {
            setSenderBalance(snapshot.val() || 0);
        }, { onlyOnce: true });
    }, []);

const handleSendMoney = async () => {
    const transferAmount = parseFloat(amount);

    if (!selectedUser || isNaN(transferAmount) || transferAmount <= 0) {
        alert('Please select a user and enter a valid amount.');
        return;
    }

    if (senderBalance < transferAmount) {
        alert('Insufficient balance.');
        return;
    }

    try {
        // Calculate platform fee and net amount
        const { platformFee, totalAmount, responsibleParty } = calculatePlatformFee(transferAmount, 'transfer');
        const recipientNetAmount = responsibleParty === 'recipient'
            ? transferAmount - platformFee
            : transferAmount;

        if (isNaN(recipientNetAmount) || isNaN(platformFee)) {
            throw new Error('Net Amount or Platform Fee is invalid. Check calculations.');
        }

        // Fetch recipient's balance
        const recipientRef = ref(database, `users/${selectedUser}/wallet/balance`);
        const recipientSnapshot = await get(recipientRef); // Use `get` instead of `onValue`
        const recipientBalance = recipientSnapshot.val() || 0;

        // Fetch platform fee balance
        const agbankRef = ref(database, 'agbank/platformFees');
        const agBankSnapshot = await get(agbankRef);
        const currentPlatformFees = agBankSnapshot.val() || 0;

        // Prepare database updates
        const updates = {};
        updates[`users/${auth.currentUser.uid}/wallet/balance`] = senderBalance - transferAmount;
        updates[`users/${selectedUser}/wallet/balance`] = recipientBalance + recipientNetAmount;
        updates['agbank/platformFees'] = currentPlatformFees + platformFee;

        // Update Firebase
        await update(ref(database), updates);

        alert(`AGMoney sent successfully! The recipient received ${recipientNetAmount.toFixed(2)} AGMoney after fees.`);
        setAmount(''); // Reset the amount field
    } catch (error) {
        console.error('Error sending AGMoney:', error);
        alert('An error occurred while sending AGMoney. Please try again.');
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
