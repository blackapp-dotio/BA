// src/components/Cashout.js
import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import './Cashout.css';

const Cashout = () => {
    const [amount, setAmount] = useState('');
    const [cashoutMethod, setCashoutMethod] = useState('PayPal');
    const [accountDetails, setAccountDetails] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCashout = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!amount || !accountDetails) {
            setError("Please fill in all fields.");
            setLoading(false);
            return;
        }

        try {
            // Deduct AGMoney from user's balance
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                agmoney: increment(-amount)
            });

            // Record cashout request (you can extend this to integrate with your payment system)
            await addDoc(collection(db, 'cashouts'), {
                user: auth.currentUser.email,
                amount,
                method: cashoutMethod,
                accountDetails,
                timestamp: new Date(),
                status: 'pending'
            });

            setSuccess("Cashout request submitted successfully!");
        } catch (error) {
            console.error("Error processing cashout:", error);
            setError("Error processing cashout. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cashout-container">
            <h2>Cashout AGMoney</h2>
            <form onSubmit={handleCashout} className="cashout-form">
                <label>
                    Amount (AGMoney):
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </label>
                <label>
                    Cashout Method:
                    <select value={cashoutMethod} onChange={(e) => setCashoutMethod(e.target.value)}>
                        <option value="PayPal">PayPal</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cryptocurrency">Cryptocurrency</option>
                    </select>
                </label>
                <label>
                    Account Details:
                    <input type="text" value={accountDetails} onChange={(e) => setAccountDetails(e.target.value)} placeholder="Enter PayPal email, bank details, or wallet address" />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Request Cashout'}
                </button>
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
            </form>
        </div>
    );
};

export default Cashout;
