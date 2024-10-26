import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import './DepositForm.css';

const DepositForm = ({ onPaymentSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [depositAmount, setDepositAmount] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleDeposit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);

        try {
            // Fetch the client secret from the backend
            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount: depositAmount * 100 }), // Convert to cents
            });

            const { clientSecret } = await response.json();

            if (!clientSecret) {
                throw new Error("Client secret is missing from the response.");
            }

            const cardElement = elements.getElement(CardElement);

            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                },
            });

            if (error) {
                setError(error.message);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Pass the deposit amount and payment intent details to the parent component
                onPaymentSuccess(depositAmount, paymentIntent);
                setDepositAmount('');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleDeposit} className="deposit-form">
            <h3>Deposit Funds</h3>
            <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount to deposit"
                required
            />
            <CardElement className="StripeElement" />
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={processing}>
                {processing ? 'Processing...' : 'Deposit'}
            </button>
        </form>
    );
};

export default DepositForm;
