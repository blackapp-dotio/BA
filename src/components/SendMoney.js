import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database, auth } from '../firebase';
import { calculatePlatformFee } from '../utils/feeUtils'; // Import the fee utility
import './SendAGMoney.css';



const SendAGMoney = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [amount, setAmount] = useState('');
    const [senderBalance, setSenderBalance] = useState(0);

    useEffect(() => {
    	   console.log('SendAGMoney component loaded');
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

  console.log('Transfer Amount:', transferAmount);

  try {
    // Calculate platform fee and net amount
    const { platformFee, netAmount } = calculatePlatformFee(transferAmount, 'transfer');
    console.log('Platform Fee:', platformFee, 'Net Amount:', netAmount);

    // Fetch recipient's balance
    const recipientRef = ref(database, `users/${selectedUser}/wallet/balance`);
    const recipientSnapshot = await get(recipientRef);
    const recipientBalance = parseFloat(recipientSnapshot.val() || 0);
    console.log('Recipient Balance:', recipientBalance);

    // Fetch platform fees in AGBank
    const agbankRef = ref(database, 'agbank/platformFees');
    const platformFeesSnapshot = await get(agbankRef);
    const currentPlatformFees = parseFloat(platformFeesSnapshot.val() || 0);
    console.log('Current Platform Fees:', currentPlatformFees);

    // Validate all numbers
    const validationChecks = [
      { label: 'Sender Balance', value: senderBalance },
      { label: 'Transfer Amount', value: transferAmount },
      { label: 'Recipient Balance', value: recipientBalance },
      { label: 'Platform Fee', value: platformFee },
      { label: 'Net Amount', value: netAmount },
      { label: 'Current Platform Fees', value: currentPlatformFees },
    ];
    validationChecks.forEach(({ label, value }) => {
      if (!Number.isFinite(value)) {
        console.error(`${label} is invalid:`, value);
        throw new Error(`${label} is invalid. Value must be a valid number.`);
      }
    });

    // Prepare updates
    const updates = {
      [`users/${auth.currentUser.uid}/wallet/balance`]: senderBalance - transferAmount,
      [`users/${selectedUser}/wallet/balance`]: recipientBalance + netAmount,
      ['agbank/platformFees']: currentPlatformFees + platformFee,
    };

    console.log('Updates to Apply:', updates);

    // Apply updates
    await update(ref(database), updates);

    alert(`AGMoney sent successfully! The recipient received ${netAmount.toFixed(2)} AGMoney after fees.`);
    setAmount('');
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
