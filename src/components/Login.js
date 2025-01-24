import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase'; // Ensure you have a proper database import
import { AuthContext } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [verificationPendingUser, setVerificationPendingUser] = useState(null);
    const { login } = useContext(AuthContext); // Ensure login function exists in context

const preloadFeedData = () => {
    return new Promise((resolve) => {
        const feedRef = ref(database, 'feed');
        onValue(feedRef, (snapshot) => {
            const feedData = snapshot.val();
            if (feedData) {
                const feedArray = Object.values(feedData);
                localStorage.setItem('feedContent', JSON.stringify(feedArray)); // Cache feed data
                resolve(feedArray);
            } else {
                resolve([]); // No feed data available
            }
        });
    });
};

const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if the user's email is verified
        if (!user.emailVerified) {
            setError("Your email is not verified. Please check your inbox.");
            setVerificationPendingUser(user); // Store user object here
            return;
        }

        console.log('User logged in:', userCredential);

        // Preload feed data before navigating
        await preloadFeedData();

        if (login) {
            login(user); // Call the context login function
        } else {
            console.error('login function is not available in AuthContext.');
        }

        navigate(`/profile/${user.uid}`); // Redirect to profile after login
    } catch (error) {
        setError('Failed to log in. Please check your credentials.');
        console.error('Error logging in:', error);
    } finally {
        setLoading(false);
    }
};

const resendVerificationEmail = async () => {
    if (verificationPendingUser) {
        try {
            await verificationPendingUser.reload(); // Reload user object to ensure it's up-to-date
            const user = auth.currentUser;

            if (!user.emailVerified) {
                // Send verification email
                await user.sendEmailVerification();
                alert('Verification email sent. Please check your inbox.');
            } else {
                // User's email is already verified
                alert('Your email is already verified. No email was sent.');
            }
        } catch (error) {
            console.error('Error sending verification email:', error);
            if (error.code === 'auth/too-many-requests') {
                setError('Too many requests. Please try again later.');
            } else if (error.code === 'auth/network-request-failed') {
                setError('Network error. Please check your connection.');
            } else {
                setError('Failed to send verification email. Please try again.');
            }
        }
    } else {
        console.error('No user available to send verification email.');
        setError('No user available to send verification email.');
    }
};

    return (
        <div className="login">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                {error && <p className="error">{error}</p>}
            </form>
            
            {verificationPendingUser && (
    <div className="resend-verification">
        <p>Didn’t receive the email? Click below to resend it.</p>
        <button type="button" onClick={resendVerificationEmail}>
            Resend Verification Email
        </button>
    </div>
)}
            
            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
            <p>
                Forgot your password? <Link to="/password-reset">Reset Password</Link>
            </p>
        </div>
    );
};

export default Login;
