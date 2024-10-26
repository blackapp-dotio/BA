// SendMoney.js
import React, { useState } from 'react';
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './SendMoney.css';

const SendMoney = () => {
  const [amount, setAmount] = useState('');
  const [recipientDisplayName, setRecipientDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  const handleSendMoney = async () => {
    if (!user) {
      alert('You must be logged in to send money.');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('displayName', '==', recipientDisplayName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const recipientDoc = querySnapshot.docs[0];
        const recipientId = recipientDoc.id;

        const senderRef = doc(db, 'users', user.uid);
        const recipientRef = doc(db, 'users', recipientId);

        await updateDoc(senderRef, {
          balance: increment(-parseFloat(amount)),
        });

        await updateDoc(recipientRef, {
          balance: increment(parseFloat(amount)),
        });

        setMessage('Money sent successfully!');
      } else {
        setMessage('Recipient display name not found!');
      }
    } catch (error) {
      console.error('Error sending money:', error);
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="send-money-container">
      <h2>Send AGMoney</h2>
      <input
        type="text"
        placeholder="Recipient Display Name"
        value={recipientDisplayName}
        onChange={(e) => setRecipientDisplayName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSendMoney}>Send AGMoney</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default SendMoney;
