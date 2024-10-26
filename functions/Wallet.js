import React, { useEffect, useState, useContext, useRef, memo } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import QRCode from 'qrcode';
import './Wallet.css';

const Wallet = () => {
  console.log('Wallet component rendered'); // Debug log to detect renders

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const { user } = useContext(AuthContext);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const cardContainerRef = useRef(null); // Ref for the Square payment form container
  const isPaymentFormAttached = useRef(false); // Guard to prevent multiple attachments

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
      isPaymentFormAttached.current = true; // Mark as attached to prevent duplicate attachments
    }
  }, []);

  const handlePayment = async () => {
    // Add payment handling logic if necessary
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
          {/* This is where the Square Payment Form will be rendered */}
          <div id="card-container" ref={cardContainerRef}></div>
          <button onClick={handlePayment}>Submit Payment</button>
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
        <h3>Your Unique QR Code</h3>
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
