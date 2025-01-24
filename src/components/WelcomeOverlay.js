import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeOverlay.css';

const WelcomeOverlay = () => {
    const navigate = useNavigate();
    const [fadeOut, setFadeOut] = useState(false);
    const [logoVisible, setLogoVisible] = useState(false);

    useEffect(() => {
        // Trigger the logo fade-in after the component mounts
        setTimeout(() => setLogoVisible(true), 500); // Delay to start the fade-in
    }, []);

    const handleClick = (route) => {
        setFadeOut(true);
        setTimeout(() => {
            navigate(route);
        }, 500);  // Delay navigation to match the fade-out transition
    };

    return (
        <div className={`welcome-overlay ${fadeOut ? 'fade-out' : ''}`}>
            <div className="welcome-content">
                <div className="welcome-message">
                    <h1> BlackApp </h1>
 		<h2> The social Business Hub </h2>
                </div>
                <img 
                    src={'./logo192.png'}  // Replace with the actual path to your logo
                    alt="Logo"
                    className={`welcome-logo ${logoVisible ? 'fade-in' : ''}`}  // Apply fade-in class when logo is visible
                />
                <div className="cta-buttons">
                    <button className="cta-button" onClick={() => handleClick('/login')}>Sign In</button>
                    <button className="cta-button" onClick={() => handleClick('/register')}>Register</button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeOverlay;
