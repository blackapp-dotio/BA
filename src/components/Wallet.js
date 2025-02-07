import React, { useState, useEffect, useContext, memo } from 'react';
import { FaPaypal, FaDollarSign, FaQrcode } from 'react-icons/fa';
import { SiCashapp } from 'react-icons/si';
import { MdMobileScreenShare } from 'react-icons/md'; // Icon for MOMO
import { ref, onValue, set, push, update, get } from 'firebase/database';
import { database } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Wallet.css';

const Wallet = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [sendAmount, setSendAmount] = useState(''); // Field to enter amount to send after scanning
  const [recipientId, setRecipientId] = useState(''); // Recipient ID from QR code scan
  const [paypalEmail, setPayPalEmail] = useState('');
  const [cashAppUsername, setCashAppUsername] = useState(''); // Cash App username
  const [momoPhoneNumber, setMomoPhoneNumber] = useState(''); // Mobile Money phone number
  const [scannerOpen, setScannerOpen] = useState(false); // Control scanner visibility
  const [selectedMethod, setSelectedMethod] = useState(null); // Selected payment method for deposit/cashout
  const [platformFeeBalance, setPlatformFeeBalance] = useState(0);

  // Fetch user wallet and transaction data when the user is available
useEffect(() => {
  if (user) {
    const balanceRef = ref(database, `users/${user.uid}/wallet/balance`);
    onValue(balanceRef, (snapshot) => setBalance(snapshot.val() || 0));

    const transactionsRef = ref(database, 'transactions');
    onValue(transactionsRef, (snapshot) => {
      const transactionsData = snapshot.val();
      if (transactionsData) {
        const filteredTransactions = Object.values(transactionsData)
          .filter(
            (transaction) =>
              transaction.senderId === user.uid ||
              transaction.recipientId === user.uid ||
              transaction.buyerId === user.uid // Capture purchase transactions specifically
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort transactions by timestamp

        setTransactions(filteredTransactions);
      } else {
        setTransactions([]);
      }
    });
    
   
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      const names = {};
      Object.keys(usersData || {}).forEach((uid) => {
        names[uid] = usersData[uid].displayName;
      });
      setUserNames(names);
    });
  }
}, [user?.uid]);

  /*********************************************/
  /*          Send Money to Recipient          */
  /*********************************************/
  const handleSendMoney = () => {
    if (!sendAmount || sendAmount <= 0) {
      setPaymentStatus('Please enter a valid amount to send.');
      return;
    }

    if (!recipientId) {
      setPaymentStatus('Recipient ID not found. Please scan a valid QR code.');
      return;
    }

    const fee = calculatePlatformFee(sendAmount); // Calculate 2% platform fee
    const netAmount = sendAmount - fee;

    if (balance < sendAmount) {
      setPaymentStatus('Insufficient balance for this transaction.');
      return;
    }

    // Deduct the amount from the sender's balance and log the transaction
    const newBalance = balance - sendAmount;
    const balanceRef = ref(database, `users/${user.uid}/wallet/balance`);
    set(balanceRef, newBalance);
    setBalance(newBalance);

    // Log the transaction to Firebase
    logTransaction({
      senderId: user.uid,
      recipientId: recipientId,
      amount: netAmount,
      type: 'SendMoney',
      platformFee: fee, // Log the fee amount
      timestamp: Date.now(),
    });

    setPaymentStatus(`Successfully sent $${netAmount.toFixed(2)} to ${userNames[recipientId] || 'Unknown User'} with a 2% fee of $${fee.toFixed(2)}.`);
  };

  // Calculate and store the 2% fee in the AGBank's wallet
  const calculatePlatformFee = (amount) => {
    const fee = amount * 0.02; // Calculate 2% fee
    setPlatformFeeBalance((prevBalance) => prevBalance + fee); // Update local state
    const agBankRef = ref(database, 'AGBank/totalFees');
    update(agBankRef, { totalFees: platformFeeBalance + fee });
    return fee;
  };

  // Log a transaction in the Firebase database
  const logTransaction = async (transaction) => {
    const transactionsRef = ref(database, 'transactions');
    await push(transactionsRef, transaction);
  };

  /*********************************************/
  /*          MoMo Payment Integration         */
  /*********************************************/
  const handleMoMoTransfer = async () => {
    if (!momoPhoneNumber || !sendAmount || sendAmount <= 0) {
      setPaymentStatus('Invalid phone number or amount.');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('Processing MoMo transfer...');

    try {
      const response = await fetch('/momo-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: sendAmount,
          phoneNumber: momoPhoneNumber,
        }),
      });

      if (response.ok) {
        setPaymentStatus('MoMo Transfer Successful!');
        const newBalance = balance - parseFloat(sendAmount);
        setBalance(newBalance);

        logTransaction({
          senderId: user.uid,
          recipientId: user.uid,
          amount: parseFloat(sendAmount),
          type: 'MoMoTransfer',
          timestamp: Date.now(),
        });
      } else {
        const errorData = await response.json();
        setPaymentStatus(`MoMo Transfer Failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('MoMo Transfer Error:', error);
      setPaymentStatus('MoMo Transfer Failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /*********************************************/
  /*        Handle CashApp and PayPal          */
  /*********************************************/
  const handleCashAppDeposit = () => {
    if (!cashAppUsername || !depositAmount || depositAmount <= 0) {
      setPaymentStatus('Invalid Cash App username or deposit amount.');
      return;
    }

    const cashAppUrl = `https://cash.app/$${cashAppUsername}/${depositAmount}`;
    window.open(cashAppUrl, '_blank');
    setPaymentStatus('Redirecting to Cash App...');

    const newBalance = balance + parseFloat(depositAmount);
    const balanceRef = ref(database, `users/${user.uid}/wallet/balance`);
    set(balanceRef, newBalance);
    setBalance(newBalance);

    logTransaction({
      senderId: user.uid,
      recipientId: user.uid,
      amount: parseFloat(depositAmount),
      type: 'Deposit',
      method: 'Cash App',
      timestamp: Date.now(),
    });
  };

  const handleCashAppCashout = () => {
    if (!cashAppUsername || !cashoutAmount || cashoutAmount <= 0) {
      setPaymentStatus('Invalid Cash App username or cashout amount.');
      return;
    }

    const fee = calculatePlatformFee(parseFloat(cashoutAmount)); // Calculate the 2% fee
    const netAmount = parseFloat(cashoutAmount) - fee;

    const newBalance = balance - parseFloat(cashoutAmount);
    if (newBalance < 0) {
      setPaymentStatus('Insufficient balance for cashout.');
      return;
    }

    setBalance(newBalance);
    setPaymentStatus(`Cash App cashout successful! 2% platform fee deducted: $${fee.toFixed(2)}`);

    logTransaction({
      senderId: user.uid,
      recipientId: user.uid,
      amount: netAmount,
      type: 'Cashout',
      method: 'Cash App',
      platformFee: fee, // Log the fee amount
      timestamp: Date.now(),
    });
  };
  
  const handleConfirmDelivery = async (transactionId) => {
  try {
    const transactionRef = ref(database, `transactions/${transactionId}`);
    const snapshot = await get(transactionRef);

    if (snapshot.exists()) {
      const transaction = snapshot.val();

      // Check if the transaction is in a "pending" state
      if (transaction.status === "pending") {
        // Add funds to the seller's wallet
        const sellerWalletRef = ref(database, `users/${transaction.recipientId}/wallet/balance`);
        const sellerSnapshot = await get(sellerWalletRef);
        const sellerBalance = sellerSnapshot.val() || 0;

        await set(sellerWalletRef, sellerBalance + transaction.amount);

        // Deduct platform fee and add it to AGBank
        const agBankRef = ref(database, "AGBank/totalFees");
        const agBankSnapshot = await get(agBankRef);
        const agBankBalance = agBankSnapshot.val() || 0;

        await set(agBankRef, agBankBalance + transaction.platformFee);

        // Mark transaction as "completed"
        await update(transactionRef, { status: "completed" });

        setPaymentStatus("Transaction successfully confirmed and completed!");
      } else {
        setPaymentStatus("Transaction is not in a pending state.");
      }
    } else {
      setPaymentStatus("Transaction not found.");
    }
  } catch (error) {
    console.error("Error confirming delivery:", error);
    setPaymentStatus("An error occurred while confirming the delivery.");
  }
};

const handleRaiseDispute = async (transactionId) => {
  try {
    const transactionRef = ref(database, `transactions/${transactionId}`);
    const snapshot = await get(transactionRef);

    if (snapshot.exists()) {
      const transaction = snapshot.val();

      if (transaction.status === "pending") {
        // Mark transaction as "disputed"
        await update(transactionRef, { status: "disputed" });

        setPaymentStatus("Dispute raised. Our team will review the transaction.");
      } else {
        setPaymentStatus("Only pending transactions can be disputed.");
      }
    } else {
      setPaymentStatus("Transaction not found.");
    }
  } catch (error) {
    console.error("Error raising dispute:", error);
    setPaymentStatus("An error occurred while raising the dispute.");
  }
};

const handleConfirmReceipt = async (transactionId) => {
  try {
    // Fetch the transaction details
    const transactionRef = ref(database, `transactions/${transactionId}`);
    const transactionSnapshot = await get(transactionRef);

    if (!transactionSnapshot.exists()) {
      alert("Transaction not found.");
      return;
    }

    const transaction = transactionSnapshot.val();

    // Check if the transaction is already completed
    if (transaction.status === "completed") {
      alert("Transaction is already completed.");
      return;
    }

    // Acknowledgment prompt
    const acknowledgment = window.confirm(
      `By confirming receipt of the item/service, you are agreeing that:\n\n` +
      `1. You have received the item or service as described.\n` +
      `2. You are authorizing the release of $${transaction.amount.toFixed(2)} AGMoney to the seller.\n` +
      `3. This action is final, and you will not be able to raise a dispute after confirmation.\n\n` +
      `Do you agree to proceed?`
    );

    if (!acknowledgment) {
      alert("Transaction confirmation canceled.");
      return;
    }

    // Update the seller's wallet balance
    const sellerWalletRef = ref(
      database,
      `users/${transaction.sellerId}/wallet/balance`
    );
    const sellerBalanceSnapshot = await get(sellerWalletRef);
    const sellerBalance = sellerBalanceSnapshot.val() || 0;

    const updatedBalance = sellerBalance + transaction.amount;

    // Update transaction status to "completed"
    const updates = {
      [`transactions/${transactionId}/status`]: "completed",
      [`users/${transaction.sellerId}/wallet/balance`]: updatedBalance,
    };

    await update(ref(database), updates);

    alert("Receipt confirmed! Funds have been released to the seller.");
  } catch (error) {
    console.error("Error confirming receipt:", error);
    alert("An error occurred while confirming the receipt.");
  }
};



  const handlePayPalDeposit = () => {
    if (!paypalEmail || !depositAmount || depositAmount <= 0) {
      setPaymentStatus('Invalid PayPal email or deposit amount.');
      return;
    }

    setIsProcessing(true);

    window.initializePayPalButton('paypal-deposit-button', depositAmount, async (order) => {
      try {
        setPaymentStatus('PayPal deposit successful!');
        const newBalance = balance + parseFloat(depositAmount);

        const balanceRef = ref(database, `users/${user.uid}/wallet/balance`);
        await set(balanceRef, newBalance);
        setBalance(newBalance);

        await logTransaction({
          senderId: user.uid,
          recipientId: user.uid,
          amount: parseFloat(depositAmount),
          type: 'Deposit',
          method: 'PayPal',
          timestamp: Date.now(),
          transactionId: order.id, // PayPal transaction ID
        });
      } catch (error) {
        console.error('Error capturing PayPal deposit:', error);
        setPaymentStatus('PayPal deposit failed.');
      } finally {
        setIsProcessing(false);
      }
    });
  };

  const handlePayPalCashout = () => {
    if (!paypalEmail || !cashoutAmount || cashoutAmount <= 0) {
      setPaymentStatus('Invalid PayPal email or cashout amount.');
      return;
    }

    const fee = calculatePlatformFee(parseFloat(cashoutAmount)); // Calculate the 2% fee
    const netAmount = parseFloat(cashoutAmount) - fee;

    setIsProcessing(true);

    window.initializePayPalButton('paypal-cashout-button', cashoutAmount, async (order) => {
      try {
        setPaymentStatus(`PayPal cashout successful! 2% platform fee deducted: $${fee.toFixed(2)}`);
        const newBalance = balance - parseFloat(cashoutAmount);

        const balanceRef = ref(database, `users/${user.uid}/wallet/balance`);
        await set(balanceRef, newBalance);
        setBalance(newBalance);

        await logTransaction({
          senderId: user.uid,
          recipientId: user.uid,
          amount: netAmount,
          type: 'Cashout',
          method: 'PayPal',
          platformFee: fee, // Log the fee amount
          timestamp: Date.now(),
          transactionId: order.id, // PayPal transaction ID
        });
      } catch (error) {
        console.error('Error capturing PayPal cashout:', error);
        setPaymentStatus('PayPal cashout failed.');
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // Handle selecting a payment method
  const handleMethodSelection = (method) => {
    setSelectedMethod(method);
    setDepositAmount('');
    setCashoutAmount('');
    setPaymentStatus(null);
  };

const formatAmount = (amount) => {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "0"; // Fallback for invalid values
  }
  return Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};



  // Render the form for the selected payment method
  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case 'CashApp':
        return (
          <>
            <h4><SiCashapp /> Cash App</h4>
            <input
              type="text"
              value={cashAppUsername}
              onChange={(e) => setCashAppUsername(e.target.value)}
              placeholder="Enter Cash App username"
            />
            <input
              type="number"
              value={depositAmount || cashoutAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <button className="submit-btn" onClick={handleCashAppDeposit}>
              {isProcessing ? 'Processing...' : 'Submit Cash App Deposit'}
            </button>
            <button className="submit-btn" onClick={handleCashAppCashout}>
              {isProcessing ? 'Processing...' : 'Submit Cash App Cashout'}
            </button>
          </>
        );
      case 'PayPal':
        return (
          <>
            <h4><FaPaypal /> PayPal</h4>
            <input
              type="text"
              value={paypalEmail}
              onChange={(e) => setPayPalEmail(e.target.value)}
              placeholder="Enter PayPal email"
            />
            <input
              type="number"
              value={depositAmount || cashoutAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <button className="submit-btn" onClick={handlePayPalDeposit}>
              {isProcessing ? 'Processing...' : 'Submit PayPal Deposit'}
            </button>
            <button className="submit-btn" onClick={handlePayPalCashout}>
              {isProcessing ? 'Processing...' : 'Submit PayPal Cashout'}
            </button>
          </>
        );
      case 'MOMO':
        return (
          <>
            <h4><MdMobileScreenShare /> Mobile Money (MOMO)</h4>
            <input
              type="text"
              value={momoPhoneNumber}
              onChange={(e) => setMomoPhoneNumber(e.target.value)}
              placeholder="Enter MOMO phone number"
            />
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <button className="submit-btn" onClick={handleMoMoTransfer}>
              {isProcessing ? 'Processing...' : 'Submit MOMO Transfer'}
            </button>
          </>
        );
      default:
        return null;
    }
  };
  
const validTransactions = transactions.filter(
  (transaction) => typeof transaction.amount === "number" && !isNaN(transaction.amount)
);  

  return (
    <div className="wallet-container">
      <h2>Your Wallet</h2>
      <div className="balance-card">
        <div className="balance-label">Current Balance</div>
        <div className="balance-amount">
          <FaDollarSign /> {balance.toFixed(2)}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="payment-methods">
        <h3>Choose a Payment Method</h3>
        <div className="method-buttons">
          <button className="method-btn cashapp" onClick={() => handleMethodSelection('CashApp')}>
            <SiCashapp size={32} /> Cash App
          </button>
          <button className="method-btn paypal" onClick={() => handleMethodSelection('PayPal')}>
            <FaPaypal size={32} /> PayPal
          </button>
          <button className="method-btn momo" onClick={() => handleMethodSelection('MOMO')}>
            <MdMobileScreenShare size={32} /> MOMO
          </button>
        </div>
      </div>

      {/* Render the selected payment form */}
      <div className="payment-form">{selectedMethod && renderPaymentForm()}</div>

      {paymentStatus && <p>{paymentStatus}</p>}

      


<div className="pending-transactions">
  <h3>Pending Transactions</h3>
  {transactions
    .filter(
      (transaction) =>
        transaction &&
        transaction.buyerId === user?.uid &&
        transaction.status === "pending"
    )
    .map((transaction) => {
      // Safely extract and fallback to default values
      const itemName = transaction.itemName || "Unknown Item";
      const amount = transaction.amount ?? 0; // Default to 0 if amount is missing

      return (
        <div key={transaction.transactionId || Math.random()} className="transaction-card">
          <p>
            <strong>Item:</strong> {itemName}
          </p>
          <p>
            <strong>Amount:</strong> ${amount.toFixed(2)}
          </p>
          <button
            className="confirm-button"
            onClick={() => handleConfirmDelivery(transaction.transactionId)}
          >
            Confirm Delivery
          </button>
          <button
            className="dispute-button"
            onClick={() => handleRaiseDispute(transaction.transactionId)}
          >
            Raise Dispute
          </button>
        </div>
      );
    })}
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
          <th>Status</th>
          {/** Optional action column for pending transactions */}
          <th>Action</th>
        </tr>
      </thead>

<tbody>
  {validTransactions.map((transaction, index) => (
    <tr key={transaction.id || index}>
      <td>
        {transaction.senderId === user?.uid
          ? "You sent"
          : transaction.recipientId === user?.uid
          ? "You received"
          : "Purchase"}
      </td>
      <td>${formatAmount(transaction.amount)}</td>
      <td>
        {transaction.timestamp
          ? new Date(transaction.timestamp).toLocaleString()
          : "N/A"}
      </td>
      <td>{transaction.status || "Unknown"}</td>
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
