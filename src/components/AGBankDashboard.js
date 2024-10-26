import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove, set, get } from 'firebase/database';
import { database, functions } from '../firebaseconfig';
import { httpsCallable } from 'firebase/functions';
import './AGBankDashboard.css';

const AGBankDashboard = () => {
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [appStats, setAppStats] = useState({});
  const [transactionFees, setTransactionFees] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [agBankBalance, setAgBankBalance] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch all brands
    const brandsRef = ref(database, 'brands');
    onValue(brandsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBrands(Object.values(data));
      }
    });

    // Fetch all users
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(Object.values(data));
      }
    });

    // Fetch transaction data and categorize by status
    const transactionsRef = ref(database, 'transactions');
    onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transactionsList = Object.values(data);
        const pending = transactionsList.filter((transaction) => transaction.status === 'pending');
        const completed = transactionsList.filter((transaction) => transaction.status === 'completed');
        const disputed = transactionsList.filter((transaction) => transaction.status === 'disputed');

        setTransactions(transactionsList); // Full transaction list
        setPendingTransactions(pending); // Set pending transactions
        setDisputes(disputed); // Set disputes

        // Calculate total platform fees (2% of each transaction)
        const fees = transactionsList.reduce((acc, transaction) => {
          const fee = transaction.platformFee || 0; // Use the fee logged in each transaction
          return acc + fee;
        }, 0);
        setTransactionFees(fees.toFixed(2)); // Rounded to 2 decimals
        setTotalRevenue(fees.toFixed(2)); // Total revenue to the app from transaction fees
      }
    });

    // Fetch AGBank total fees
    const agBankRef = ref(database, 'AGBank/totalFees');
    onValue(agBankRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAgBankBalance(data.totalFees || 0);
      }
    });

    // Fetch notifications
    const notificationsRef = ref(database, 'notifications');
    onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNotifications(Object.values(data));
      }
    });

    // Fetch app statistics
    const fetchStats = async () => {
      const totalUsers = await countData('users');
      const totalPosts = await countData('posts');
      const totalComments = await countData('comments');
      const totalLikes = await countData('likes');

      setAppStats({
        totalUsers,
        totalPosts,
        totalComments,
        totalLikes,
      });
    };

    fetchStats();
  }, []);

  // Function to count database nodes
  const countData = (path) => {
    return new Promise((resolve) => {
      const refData = ref(database, path);
      onValue(refData, (snapshot) => {
        resolve(snapshot.size);
      });
    });
  };

  // Approve or reject brands
  const handleBrandApproval = async (brandId, status) => {
    await update(ref(database, `brands/${brandId}`), { status });
    alert(`Brand ${status === 'approved' ? 'approved' : 'rejected'}`);
  };

  // Delete brand
  const handleBrandDeletion = async (brandId) => {
    await remove(ref(database, `brands/${brandId}`));
    alert('Brand deleted successfully.');
  };

  // Resolve disputes and release funds to either buyer or seller
  const handleResolveDispute = async (transactionId, resolution) => {
    const disputeRef = ref(database, `transactions/${transactionId}`);
    const snapshot = await get(disputeRef);
    const transaction = snapshot.val();

    if (transaction && transaction.status === 'disputed') {
      if (resolution === 'refund') {
        // Refund buyer and update transaction status
        const buyerWalletRef = ref(database, `users/${transaction.senderId}/wallet/balance`);
        const buyerSnapshot = await get(buyerWalletRef);
        const buyerBalance = buyerSnapshot.val() || 0;

        await update(buyerWalletRef, buyerBalance + transaction.amount);
        await update(disputeRef, { status: 'refunded' });
        alert(`Transaction ${transactionId} has been refunded to the buyer.`);
      } else if (resolution === 'release') {
        // Release funds to seller and update transaction status
        const sellerWalletRef = ref(database, `users/${transaction.recipientId}/wallet/balance`);
        const sellerSnapshot = await get(sellerWalletRef);
        const sellerBalance = sellerSnapshot.val() || 0;

        await update(sellerWalletRef, sellerBalance + transaction.amount);
        await update(disputeRef, { status: 'released' });
        alert(`Funds for transaction ${transactionId} have been released to the seller.`);
      }
    }
  };

  // Handle admin notifications and actions
  const handleNotificationAction = async (notificationId, action) => {
    const notificationRef = ref(database, `notifications/${notificationId}`);

    if (action === 'markRead') {
      await update(notificationRef, { read: true });
      alert('Notification marked as read.');
    } else if (action === 'delete') {
      await remove(notificationRef);
      alert('Notification deleted.');
    }
  };

  // Assign or remove admin role
  const handleAdminRole = async (userId, action) => {
    const setAdminRole = httpsCallable(functions, 'setAdminRole');
    try {
      const result = await setAdminRole({ uid: userId, action });
      alert(result.data.message);
    } catch (error) {
      alert('Error in updating admin role');
    }
  };

  // Handle fund transfer from AGBank to a recipient (user)
  const handleFundTransfer = async () => {
    if (!transferRecipient || !recipientId || !transferAmount || transferAmount <= 0) {
      alert('Please enter a valid recipient and transfer amount.');
      return;
    }

    if (parseFloat(transferAmount) > agBankBalance) {
      alert('Insufficient AGBank balance for this transfer.');
      return;
    }

    // Deduct the transfer amount from AGBank's balance
    const newAgBankBalance = agBankBalance - parseFloat(transferAmount);
    const agBankRef = ref(database, 'AGBank/totalFees');
    await update(agBankRef, { totalFees: newAgBankBalance });
    setAgBankBalance(newAgBankBalance);

    // Add the transferred amount to the recipient's balance
    const recipientBalanceRef = ref(database, `users/${recipientId}/wallet/balance`);
    onValue(recipientBalanceRef, async (snapshot) => {
      const recipientBalance = snapshot.val() || 0;
      await set(recipientBalanceRef, recipientBalance + parseFloat(transferAmount));
    });

    alert(`Successfully transferred $${transferAmount} to ${transferRecipient}.`);
  };

  // Handle selection of transfer recipient and set recipient ID
  const handleRecipientSelection = (displayName) => {
    const selectedUser = users.find((user) => user.displayName === displayName);
    if (selectedUser) {
      setRecipientId(selectedUser.uid);
      setTransferRecipient(displayName);
    }
  };

  // Filter user list based on search term
  const filteredUsers = users.filter((user) =>
    (user.displayName || 'Anonymous').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <h2>AGBank Dashboard</h2>

      {/* Notification Section */}
      <section className="dashboard-section">
        <h3>Notifications</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Message</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {notifications.length === 0 ? (
              <tr>
                <td colSpan="2">No new notifications.</td>
              </tr>
            ) : (
              notifications.map((notification) => (
                <tr key={notification.id}>
                  <td>{notification.message}</td>
                  <td>
                    {!notification.read && (
                      <button
                        className="mark-read-btn"
                        onClick={() => handleNotificationAction(notification.id, 'markRead')}
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => handleNotificationAction(notification.id, 'delete')}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Pending Transactions Section */}
      <section className="dashboard-section">
        <h3>Pending Transactions</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Sender</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingTransactions.length === 0 ? (
              <tr>
                <td colSpan="5">No pending transactions.</td>
              </tr>
            ) : (
              pendingTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.id}</td>
                  <td>{transaction.senderId}</td>
                  <td>{transaction.recipientId}</td>
                  <td>${transaction.amount}</td>
                  <td>
                    <button
                      className="release-btn"
                      onClick={() => handleResolveDispute(transaction.id, 'release')}
                    >
                      Release Funds
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Dispute Management Section */}
      <section className="dashboard-section">
        <h3>Dispute Management</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Sender</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.length === 0 ? (
              <tr>
                <td colSpan="5">No disputes to resolve.</td>
              </tr>
            ) : (
              disputes.map((dispute) => (
                <tr key={dispute.id}>
                  <td>{dispute.id}</td>
                  <td>{dispute.senderId}</td>
                  <td>{dispute.recipientId}</td>
                  <td>${dispute.amount}</td>
                  <td>
                    <button
                      className="refund-btn"
                      onClick={() => handleResolveDispute(dispute.id, 'refund')}
                    >
                      Refund Buyer
                    </button>
                    <button
                      className="release-btn"
                      onClick={() => handleResolveDispute(dispute.id, 'release')}
                    >
                      Release to Seller
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Brand Management Section */}
      <section className="dashboard-section">
        <h3>Brand Management</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Brand Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td>{brand.businessName}</td>
                <td>{brand.category}</td>
                <td>{brand.status}</td>
                <td>
                  {brand.status === 'pending' && (
                    <>
                      <button
                        className="approve-btn"
                        onClick={() => handleBrandApproval(brand.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleBrandApproval(brand.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => handleBrandDeletion(brand.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* User & Admin Management Section */}
      <section className="dashboard-section">
        <h3>User & Admin Management</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td>{user.displayName || 'Anonymous'}</td>
                <td>{user.email}</td>
                <td>{user.isAdmin ? 'Admin' : 'User'}</td>
                <td>
                  <button
                    className="assign-admin-btn"
                    onClick={() => handleAdminRole(user.uid, 'grant')}
                  >
                    Grant Admin
                  </button>
                  {user.isAdmin && (
                    <button
                      className="remove-admin-btn"
                      onClick={() => handleAdminRole(user.uid, 'revoke')}
                    >
                      Remove Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Financial Overview Section */}
      <section className="dashboard-section">
        <h3>Financial Overview</h3>
        <div className="financial-stats">
          <p>Total Platform Fees (2%): ${transactionFees}</p>
          <p>Total Revenue: ${totalRevenue}</p>
          <p>AGBank Total Balance: ${agBankBalance}</p>
        </div>
      </section>

      {/* Transaction History Section */}
      <section className="dashboard-section">
        <h3>Transaction History</h3>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Sender</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Fees</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6">No transaction history available.</td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.id}</td>
                  <td>{transaction.senderId}</td>
                  <td>{transaction.recipientId}</td>
                  <td>${transaction.amount.toFixed(2)}</td>
                  <td>${transaction.platformFee ? transaction.platformFee.toFixed(2) : '0.00'}</td>
                  <td>{transaction.status}</td>
                </tr>
              ))
            )}
            <tr>
              <td colSpan="4"><strong>Total Fees:</strong></td>
              <td colSpan="2"><strong>${transactionFees}</strong></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* App Statistics Section */}
      <section className="dashboard-section">
        <h3>App Statistics</h3>
        <ul className="stats-list">
          <li>Total Users: {appStats.totalUsers || 0}</li>
          <li>Total Posts: {appStats.totalPosts || 0}</li>
          <li>Total Comments: {appStats.totalComments || 0}</li>
          <li>Total Likes: {appStats.totalLikes || 0}</li>
        </ul>
      </section>
    </div>
  );
};

export default AGBankDashboard;
