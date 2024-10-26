import React, { useEffect, useState, useContext, useRef, memo } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import QRCode from 'qrcode';
import './Wallet.css';

const Wallet = () => {
  console.log('Wallet component rendered');

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // Track processing state
  const [paymentStatus, setPaymentStatus] = useState(null);
  const { user } = useContext(AuthContext);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const cardContainerRef = useRef(null);
  const isPaymentFormAttached = useRef(false);

  // Fetch user wallet and transactions data
  useEffect(() => {
    console.log('User changed:', user);
    if (user) {
      const balanceRef = ref(database, `users/${user.uid}/wallet/balance`);
      onValue(balanceRef, (snapshot) => setBalance(snapshot.val() || 0));

      const transactionsRef = ref(database, 'transactions');
      onValue(transactionsRef, (snapshot) => {
        const transactionsData = snapshot.val();
        const filteredTransactions = Object.keys(transactionsData || {}).map(key => transactionsData[key])
          .filter(transaction => transaction.senderId === user.uid || transaction.recipientId === user.uid);
        setTransactions(filteredTransactions);
      });

      const usersRef = ref(database, 'users');
      onValue(usersRef, (snapshot) => {
        const usersData = snapshot.val();
        const names = {};
        Object.keys(usersData || {}).forEach(uid => {
          names[uid] = usersData[uid].displayName;
        });
        setUserNames(names);
      });

      generateQrCode();
    }
  }, [user?.uid]);

  // Generate QR code once per user
  const generateQrCode = async () => {
    if (user) {
      const qrCodeData = JSON.stringify({ recipientId: user.uid, action: 'follow' });
      const url = await QRCode.toDataURL(qrCodeData);
      setQrCodeUrl(url);
    }
  };

  // Attach the Square Payment Form to the cardContainerRef div after component mounts
  useEffect(() => {
    if (cardContainerRef.current && !isPaymentFormAttached.current) {
      console.log('Attaching Square Payment Form to container...');
      window.initializeSquarePaymentForm(cardContainerRef.current.id); // Use global initialization
      isPaymentFormAttached.current = true;
    }
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true); // Set processing state to true
    console.log('Processing payment...');

    const sourceId = window.getSquarePaymentSourceId();
    if (!sourceId) {
      console.log('Card instance not available!');
      setPaymentStatus('Card instance not available');
      setIsProcessing(false); // Reset the processing state
      return;
    }

    if (!depositAmount || depositAmount <= 0) {
      console.log('Invalid deposit amount:', depositAmount);
      setPaymentStatus('Invalid deposit amount');
      setIsProcessing(false); // Reset the processing state
      return;
    }

    try {
      const response = await fetch('https://us-central1-wakandan-app.cloudfunctions.net/processPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceId, amount: parseInt(depositAmount) * 100 }), // Convert to cents
      });

      const result = await response.json();
      if (result.success) {
        console.log('Payment successful:', result);
        setPaymentStatus('Payment successful!');
      } else {
        console.log('Payment failed:', result.error);
        setPaymentStatus(`Payment failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error during payment:', error);
      setPaymentStatus(`Payment error: ${error.message}`);
    }

    setIsProcessing(false); // Reset the processing state after payment
  };

  return (
    <div className="wallet-container">
      <h2>Your Wallet</h2>
      <div className="balance-card">
        <div className="balance-label">Current Balance</div>
        <div className="balance-amount">${balance.toFixed(2)}</div>
      </div>

      <div className="actions-container">
        <div className="action-card">
          <h3>Deposit Funds</h3>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Enter deposit amount"
          />
          <div id="card-container" ref={cardContainerRef}></div>
          <button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Submit Payment'}
          </button>
          {paymentStatus && <p>{paymentStatus}</p>}
        </div>

        <div className="action-card">
          <h3>Cashout Funds</h3>
          <input
            type="number"
            value={cashoutAmount}
            onChange={(e) => setCashoutAmount(e.target.value)}
            placeholder="Enter amount to cash out"
          />
          <button>Cash Out</button>
        </div>
      </div>

      <div className="qr-section">
        <h3>Your Black Card</h3>
        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" />}
      </div>

      <div className="transactions">
        <h3>Transaction History</h3>
        {transactions.length === 0 ? (
          <p>No transactions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index}>
                  <td>{transaction.senderId === user.uid ? 'You sent' : 'Received'}</td>
                  <td>${transaction.amount.toFixed(2)}</td>
                  <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default memo(Wallet);