import React, { useState, useEffect } from 'react';
import { ref, get, update, push } from 'firebase/database';
import { database, auth } from '../firebaseconfig';
import { calculatePlatformFee } from '../utils/feeUtils';
import './DirectPayment.css';

const DirectPayment = ({ item, brandOwnerId, onClose }) => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('paypal');
  const [transactionSummary, setTransactionSummary] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch the user's wallet balance if signed in
    if (auth.currentUser) {
      const balanceRef = ref(database, `users/${auth.currentUser.uid}/wallet/balance`);
      get(balanceRef).then((snapshot) => {
        if (snapshot.exists()) {
          setWalletBalance(parseFloat(snapshot.val()) || 0);
        } else {
          setWalletBalance(0);
        }
      });
    }
  }, []);

  const generateTransactionSummary = () => {
    const { platformFee, totalAmount } = calculatePlatformFee(item.price, 'purchase');
    setTransactionSummary({
      itemName: item.name || item.title,
      itemPrice: parseFloat(item.price),
      platformFee,
      totalAmount,
    });
  };

  const handlePayment = async () => {
    if (!transactionSummary) {
      setPaymentStatus('Error: No transaction summary available.');
      return;
    }

    const { totalAmount, platformFee, itemPrice } = transactionSummary;

    if (selectedPaymentMethod === 'wallet') {
      // Wallet Payment Logic
      if (walletBalance < totalAmount) {
        setPaymentStatus('Insufficient wallet balance. Please deposit more funds.');
        return;
      }

      const buyerId = auth.currentUser.uid;
      const newWalletBalance = walletBalance - totalAmount;

      try {
        // Deduct wallet balance
        await update(ref(database, `users/${buyerId}/wallet`), {
          balance: newWalletBalance,
        });

        // Record the transaction
        const transactionId = push(ref(database, 'transactions')).key;
        const transaction = {
          transactionId,
          buyerId,
          sellerId: brandOwnerId,
          itemId: item.id,
          itemName: item.name || item.title,
          price: itemPrice,
          platformFee,
          totalAmount,
          paymentMethod: 'wallet',
          timestamp: Date.now(),
          status: 'pending', // Default status
        };

        await update(ref(database, `transactions/${transactionId}`), transaction);

        setPaymentStatus('Payment successful! Awaiting confirmation.');
        setTimeout(() => onClose(), 2000);
      } catch (error) {
        setPaymentStatus('Wallet payment failed. Please try again.');
      }
    } else if (selectedPaymentMethod === 'paypal') {
      // Redirect to PayPal
      window.open(`https://www.paypal.com/paypalme/brandowner/${totalAmount}`, '_blank');
      setPaymentStatus('Redirecting to PayPal for payment...');
    } else if (selectedPaymentMethod === 'cashapp') {
      // Redirect to CashApp
      window.open(`https://cash.app/$brandowner/${totalAmount}`, '_blank');
      setPaymentStatus('Redirecting to CashApp for payment...');
    }
  };

  return (
    <div className="direct-payment-modal">
      <div className="modal-content">
        <h3>Complete Your Purchase</h3>
        {transactionSummary ? (
          <div className="transaction-summary">
            <p><strong>Item:</strong> {transactionSummary.itemName}</p>
            <p><strong>Price:</strong> ${transactionSummary.itemPrice.toFixed(2)}</p>
            <p><strong>Platform Fee:</strong> ${transactionSummary.platformFee.toFixed(2)}</p>
            <p><strong>Total:</strong> ${transactionSummary.totalAmount.toFixed(2)}</p>
          </div>
        ) : (
          <button className="generate-summary-button" onClick={generateTransactionSummary}>
            Generate Transaction Summary
          </button>
        )}

        {transactionSummary && (
          <div className="payment-method-selection">
            <h4>Select Payment Method</h4>
            <div className="payment-options">
              {auth.currentUser && (
                <div>
                  <input
                    type="radio"
                    id="wallet"
                    name="paymentMethod"
                    value="wallet"
                    checked={selectedPaymentMethod === 'wallet'}
                    onChange={() => setSelectedPaymentMethod('wallet')}
                  />
                  <label htmlFor="wallet">
                    Platform Wallet (Balance: ${walletBalance.toFixed(2)})
                  </label>
                </div>
              )}
              <div>
                <input
                  type="radio"
                  id="paypal"
                  name="paymentMethod"
                  value="paypal"
                  checked={selectedPaymentMethod === 'paypal'}
                  onChange={() => setSelectedPaymentMethod('paypal')}
                />
                <label htmlFor="paypal">PayPal</label>
              </div>
              <div>
                <input
                  type="radio"
                  id="cashapp"
                  name="paymentMethod"
                  value="cashapp"
                  checked={selectedPaymentMethod === 'cashapp'}
                  onChange={() => setSelectedPaymentMethod('cashapp')}
                />
                <label htmlFor="cashapp">CashApp</label>
              </div>
            </div>
          </div>
        )}

        <div className="payment-actions">
          <button
            className="confirm-payment-button"
            onClick={handlePayment}
            disabled={!transactionSummary || loading}
          >
            Confirm Payment
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>

        {paymentStatus && <p className="payment-status">{paymentStatus}</p>}
      </div>
    </div>
  );
};

export default DirectPayment;
