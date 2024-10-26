import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './PasswordReset.css';

const PasswordReset = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset email sent. Please check your inbox.');
            navigate('/login');
        } catch (error) {
            setError('Failed to send password reset email. Please try again.');
            console.error('Error sending password reset email:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="password-reset">
            <h2>Reset Password</h2>
            <form onSubmit={handlePasswordReset}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Email'}
                </button>
                {message && <p className="message">{message}</p>}
                {error && <p className="error">{error}</p>}
            </form>
        </div>
    );
};

export default PasswordReset;
