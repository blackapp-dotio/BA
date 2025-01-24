// src/components/Payment.js
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import './Payment.css';

const stripePromise = loadStripe('pk_live_51PgcwEDMo9PoF6U3Yo5oyegDHpqq2voaFZbXwIVdDTYk9ojEobiUxJeACxHJjXonHBSUSWjP3OqqjHB7cMVhVc3p00DKIMZGAF');

const handleMomoPayment = async () => {
    // Mock API call or implement Momo integration logic
    alert("Momo payment initiated!");
};

const handleCashAppPayment = () => {
    alert("CashApp payment initiated!");
};


const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        if (!stripe || !elements) {
            setLoading(false);
            return;
        }

        const cardElement = elements.getElement(CardElement);

        try {
            // Create a PaymentIntent on the server
            const { data: { clientSecret } } = await axios.post('http://localhost:3001/create-payment-intent', { amount: 5000 }); // Example amount: 5000 cents ($50)

            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                },
            });

            if (error) {
                setError(error.message);
            } else {
                alert('Payment Successful!');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
    
    	  <button type="button" onClick={handleMomoPayment}>Pay with Momo</button>
	  <button type="button" onClick={handleCashAppPayment}>Pay with CashApp</button>
    
        <form onSubmit={handleSubmit} className="payment-form">
            <CardElement />
            <button type="submit" disabled={!stripe || loading}>
                {loading ? 'Processing...' : 'Pay'}
            </button>
            {error && <div className="payment-error">{error}</div>}
        </form>
    );
};

const Payment = () => (
    <Elements stripe={stripePromise}>
        <CheckoutForm />
    </Elements>
);

export default Payment;
