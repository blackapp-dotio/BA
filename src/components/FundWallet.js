// FundWallet.js
import React, { useState } from 'react';
import { getFirestore, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { loadStripe } from '@stripe/stripe-js';
import './FundWallet.css';

const stripePromise = loadStripe('pk_live_51PgcwEDMo9PoF6U3Yo5oyegDHpqq2voaFZbXwIVdDTYk9ojEobiUxJeACxHJjXonHBSUSWjP3OqqjHB7cMVhVc3p00DKIMZGAF');

const FundWallet = () => {
  const [amount, setAmount] = useState('');
  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  const handleFund = async () => {
    if (!user) {
      alert('You must be logged in to fund your wallet.');
      return;
    }

    try {
      // Call your backend to create the PaymentIntent
      const response = await fetch('http://localhost:3001/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, userId: user.uid }),
      });

      const { clientSecret } = await response.json();

      // Confirm the payment on the client side
      const stripe = await stripePromise;
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            number: '4242424242424242',
            exp_month: 12,
            exp_year: 2024,
            cvc: '123',
          },
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        alert('There was an error processing your payment.');
      } else if (paymentIntent.status === 'succeeded') {
        // Payment was successful
        alert('Payment successful! Wallet will be funded shortly.');

        // No need to manually update the wallet balance here,
        // as the webhook will handle this.
      }
    } catch (error) {
      console.error('Error funding wallet:', error);
      alert('There was an error funding your wallet. Please try again.');
    }
  };

  return (
    <div className="fund-wallet">
      <h2>Fund Your Wallet</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
      />
      <button onClick={handleFund}>Fund Wallet</button>
    </div>
  );
};

export default FundWallet;
