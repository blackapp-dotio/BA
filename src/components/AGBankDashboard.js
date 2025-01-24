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
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchDashboardData();
    fetchAGBankBalance();
  }, []);

const fetchUsers = async () => {
  try {
    const fetchAllUsers = httpsCallable(functions, 'fetchAllUsers'); // Call the Firebase function
    const result = await fetchAllUsers();
    const users = result.data.users;

    console.log("Fetched users:", users); // Debug log

    setUsers(
      users.map((user) => ({
        uid: user.uid,
        email: user.email || 'No Email', // Use 'No Email' if email is missing
        displayName: user.displayName || user.email || user.uid, // Fallback to email or UID if displayName is missing
        isAdmin: user.customClaims?.admin || false, // Check for admin claims
        disabled: user.disabled || false, // Include disabled status
      }))
    );
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

const fetchDashboardData = async () => {
  try {
    // Fetch users
    await fetchUsers();

    // Fetch all brands
    const brandsRef = ref(database, 'brands');
    onValue(brandsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBrands(Object.values(data));
      }
    });

    // Fetch transaction data and categorize by status
    const transactionsRef = ref(database, 'transactions');
    onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transactionsList = Object.values(data);
        const pending = transactionsList.filter((transaction) => transaction.status === 'pending');
        const disputed = transactionsList.filter((transaction) => transaction.status === 'disputed');

        setTransactions(transactionsList);
        setPendingTransactions(pending);
        setDisputes(disputed);

        // Calculate total platform fees and revenue
        const fees = transactionsList.reduce((acc, transaction) => {
          const fee = transaction.platformFee || 0;
          return acc + fee;
        }, 0);
        setTransactionFees(parseFloat(fees).toFixed(2));
        setTotalRevenue(parseFloat(fees).toFixed(2));
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
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }



    // Fetch transaction data and categorize by status
    const transactionsRef = ref(database, 'transactions');
    onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transactionsList = Object.values(data);
        const pending = transactionsList.filter((transaction) => transaction.status === 'pending');
        const disputed = transactionsList.filter((transaction) => transaction.status === 'disputed');

        setTransactions(transactionsList);
        setPendingTransactions(pending);
        setDisputes(disputed);

        // Calculate total platform fees and revenue
        const fees = transactionsList.reduce((acc, transaction) => {
          const fee = transaction.platformFee || 0;
          return acc + fee;
        }, 0);
        setTransactionFees(parseFloat(fees).toFixed(2));
        setTotalRevenue(parseFloat(fees).toFixed(2));
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
  };

  const fetchAGBankBalance = () => {
    const agBankRef = ref(database, 'AGBank/totalFees');
    onValue(agBankRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAgBankBalance(parseFloat(data));
      }
    });
  };

  // Function to count database nodes
  const countData = (path) => {
    return new Promise((resolve) => {
      const refData = ref(database, path);
      onValue(refData, (snapshot) => {
        resolve(snapshot.size);
      });
    });
  };

  // Approve, suspend, reinstate, or reject brands and publish them if approved
  const handleBrandStatusChange = async (brandId, status) => {
    await update(ref(database, `brands/${brandId}`), { status });
    if (status === 'approved') {
      await update(ref(database, `explore/brands/${brandId}`), { published: true });
    } else {
      await remove(ref(database, `explore/brands/${brandId}`));
    }
    alert(`Brand ${status === 'approved' ? 'approved and published' : status}`);
  };

  // Delete brand
  const handleBrandDeletion = async (brandId) => {
    await remove(ref(database, `brands/${brandId}`));
    alert('Brand deleted successfully.');
  };

  // Resolve disputes and release funds to either buyer or seller
const handleResolveDispute = async (transactionId, resolution) => {
    const transactionRef = ref(database, `transactions/${transactionId}`);
    const snapshot = await get(transactionRef);
    const transaction = snapshot.val();

    if (!transaction || transaction.status !== "disputed") {
        alert("Invalid or resolved transaction.");
        return;
    }

    const { sellerId, buyerId, totalAmount, platformFee } = transaction;

    if (resolution === "refund") {
        // Refund the buyer
        const buyerWalletRef = ref(database, `users/${buyerId}/wallet/balance`);
        const buyerWalletSnapshot = await get(buyerWalletRef);
        const currentBuyerBalance = buyerWalletSnapshot.val() || 0;

        await update(buyerWalletRef, { balance: currentBuyerBalance + totalAmount });
        console.log(`Refunded ${totalAmount} AGMoney to buyer.`);
    } else if (resolution === "release") {
        // Release funds to the seller
        const sellerWalletRef = ref(database, `users/${sellerId}/wallet/balance`);
        const sellerWalletSnapshot = await get(sellerWalletRef);
        const currentSellerBalance = sellerWalletSnapshot.val() || 0;

        await update(sellerWalletRef, {
            balance: currentSellerBalance + (totalAmount - platformFee),
        });
        console.log(`Released ${totalAmount - platformFee} AGMoney to seller.`);

        // Update AGBank balance
        const agBankRef = ref(database, "AGBank/totalFees");
        const agBankSnapshot = await get(agBankRef);
        const currentAgBankBalance = agBankSnapshot.val() || 0;

        await update(agBankRef, { totalFees: currentAgBankBalance + platformFee });
        console.log(`Added ${platformFee} AGMoney to AGBank.`);
    }

    // Mark the transaction as resolved
    await update(transactionRef, { status: resolution === "refund" ? "refunded" : "released" });
    alert(`Transaction ${resolution === "refund" ? "refunded to buyer" : "released to seller"}.`);
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

    const newAgBankBalance = agBankBalance - parseFloat(transferAmount);
    await update(ref(database, 'AGBank/totalFees'), { totalFees: newAgBankBalance });
    setAgBankBalance(newAgBankBalance);

    const recipientBalanceRef = ref(database, `users/${recipientId}/wallet/balance`);
    onValue(recipientBalanceRef, async (snapshot) => {
      const recipientBalance = snapshot.val() || 0;
      await set(recipientBalanceRef, recipientBalance + parseFloat(transferAmount));
    });

    alert(`Successfully transferred $${transferAmount} to ${transferRecipient}.`);
  };

  const handleRecipientSelection = (displayName) => {
    const selectedUser = users.find((user) => user.displayName === displayName);
    if (selectedUser) {
      setRecipientId(selectedUser.uid);
      setTransferRecipient(displayName);
    }
  };

  const filteredUsers = users.filter((user) =>
    (user.displayName || 'Anonymous').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };
  
  // Suspend user
const handleSuspendUser = async (userId) => {
  if (!window.confirm('Are you sure you want to suspend this user?')) return;

  try {
    // Update the user's `disabled` status directly in the database
    await update(ref(database, `users/${userId}`), { disabled: true });
    alert('User suspended successfully.');

    // Update the local state
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.uid === userId ? { ...user, disabled: true } : user
      )
    );
  } catch (error) {
    console.error('Error suspending user:', error);
    alert('Failed to suspend user. Please try again.');
  }
};

const handleReinstateUser = async (userId) => {
  if (!window.confirm('Are you sure you want to reinstate this user?')) return;

  try {
    // Update the user's `disabled` status directly in the database
    await update(ref(database, `users/${userId}`), { disabled: false });
    alert('User reinstated successfully.');

    // Update the local state
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.uid === userId ? { ...user, disabled: false } : user
      )
    );
  } catch (error) {
    console.error('Error reinstating user:', error);
    alert('Failed to reinstate user. Please try again.');
  }
};


// Delete user
const handleDeleteUser = async (userId) => {
  if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

  try {
    // Remove the user data from the Realtime Database
    await remove(ref(database, `users/${userId}`));
    alert('User deleted successfully.');

    // Remove the user from the local state
    setUsers((prevUsers) => prevUsers.filter((user) => user.uid !== userId));
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Failed to delete user. Please try again.');
  }
};


  const renderTabContent = () => {
    if (selectedTab === 'dashboard') {
      return (
        <div>
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
                  notifications.map((notification, index) => (
                    <tr key={notification.id || index}>
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
                  pendingTransactions.map((transaction, index) => (
                    <tr key={transaction.id || index}>
                      <td>{transaction.id}</td>
                      <td>{transaction.senderId}</td>
                      <td>{transaction.recipientId}</td>
                      <td>${(transaction.amount || 0).toFixed(2)}</td>
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
                  disputes.map((dispute, index) => (
                    <tr key={dispute.id || index}>
                      <td>{dispute.id}</td>
                      <td>{dispute.senderId}</td>
                      <td>{dispute.recipientId}</td>
                      <td>${(dispute.amount || 0).toFixed(2)}</td>
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
                {brands.map((brand, index) => (
                  <tr key={brand.id || index}>
                    <td>{brand.businessName}</td>
                    <td>{brand.category}</td>
                    <td>{brand.status}</td>
                    <td>
                      {brand.status === 'pending' && (
                        <>
                          <button
                            className="approve-btn"
                            onClick={() => handleBrandStatusChange(brand.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => handleBrandStatusChange(brand.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {brand.status === 'approved' && (
                        <button
                          className="suspend-btn"
                          onClick={() => handleBrandStatusChange(brand.id, 'suspended')}
                        >
                          Suspend
                        </button>
                      )}
                      {brand.status === 'suspended' && (
                        <button
                          className="reinstate-btn"
                          onClick={() => handleBrandStatusChange(brand.id, 'approved')}
                        >
                          Reinstate
                        </button>
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

          {/* Users Section */}
          <section className="dashboard-section">
            <h3>User Management</h3>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
               {users.map((user, index) => (
                  <tr key={user.uid || index}>
                    <td>{user.displayName || 'Anonymous'}</td>
                    <td>{user.email}</td>      <td>{user.disabled ? 'Disabled' : 'Active'}</td>
      <td>
        <button
          className="suspend-btn"
          onClick={() => handleSuspendUser(user.uid)}
        >
          Suspend
        </button>
        {user.disabled && (
          <button
            className="reinstate-btn"
            onClick={() => handleReinstateUser(user.uid)}
          >
            Reinstate
          </button>
        )}
        <button
          className="delete-btn"
          onClick={() => handleDeleteUser(user.uid)}
        >
          Delete
        </button>
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
              <p>Total Platform Fees (2%): ${(parseFloat(transactionFees) || 0).toFixed(2)}</p>
              <p>Total Revenue: ${(parseFloat(totalRevenue) || 0).toFixed(2)}</p>
              <p>AGBank Total Balance: ${(parseFloat(agBankBalance) || 0).toFixed(2)}</p>
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
                  transactions.map((transaction, index) => (
                    <tr key={transaction.id || index}>
                      <td>{transaction.id}</td>
                      <td>{transaction.senderId}</td>
                      <td>{transaction.recipientId}</td>
                      <td>${(transaction.amount || 0).toFixed(2)}</td>
                      <td>${(transaction.platformFee || 0).toFixed(2)}</td>
                      <td>{transaction.status}</td>
                    </tr>
                  ))
                )}
                <tr>
                  <td colSpan="4"><strong>Total Fees:</strong></td>
                  <td colSpan="2"><strong>${(parseFloat(transactionFees) || 0).toFixed(2)}</strong></td>
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
    } else if (selectedTab === 'agbank') {
      return (
        <div className="agbank-tab">
          <h3>AGBank Overview</h3>
          <p>Total Platform Fees Collected: ${(parseFloat(agBankBalance) || 0).toFixed(2)}</p>
          <h4>Transfer Funds</h4>
          <div className="transfer-section">
            <input
              type="text"
              placeholder="Recipient's Name"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount to Transfer"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
            <button className="transfer-button" onClick={handleFundTransfer}>
              Transfer Funds
            </button>
          </div>
          <h4>Financial Summary</h4>
          <div className="financial-summary">
            <p>Transaction Fees (2%): ${(parseFloat(transactionFees) || 0).toFixed(2)}</p>
            <p>Total Revenue: ${(parseFloat(totalRevenue) || 0).toFixed(2)}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container">
      <h2>AGBank Dashboard</h2>
      <div className="tabs">
        <button
          className={`tab-button ${selectedTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-button ${selectedTab === 'agbank' ? 'active' : ''}`}
          onClick={() => handleTabChange('agbank')}
        >
          AGBank
        </button>
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AGBankDashboard;
