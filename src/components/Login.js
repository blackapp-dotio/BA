import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext); // Ensure login function exists in context

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('User logged in:', userCredential);
            if (login) {
                login(userCredential.user); // Ensure login is called
            } else {
                console.error('login function is not available in AuthContext.');
            }
            navigate('/feed');
        } catch (error) {
            setError('Failed to log in. Please check your credentials.');
            console.error('Error logging in:', error);
        } finally {
            setLoading(false);
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
