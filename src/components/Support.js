import React, { useState } from 'react';
import { ref, push } from 'firebase/database';
import { database } from '../firebaseconfig';
import './Support.css';

const Support = () => {
    const [message, setMessage] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const supportAccountId = 'TrISZb4hOgUyonJoSwlpwGE3PxF2'; // Support account unique ID.

    const handleFormToggle = () => {
        setIsFormOpen(!isFormOpen);
        setIsSent(false); // Reset message sent status when form toggles.
        setMessage(''); // Clear the input field.
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            alert('Please enter a message.');
            return;
        }

        try {
            // Save the message to the chat for the support account.
            const chatRef = ref(database, `chats/${supportAccountId}`);
            await push(chatRef, {
                message,
                sender: 'Anonymous User', // Replace with user information if available.
                timestamp: Date.now(),
            });

            // Update the UI to reflect the success.
            setIsSent(true);
            setMessage(''); // Clear the input field.
        } catch (error) {
            console.error('Error sending support message:', error);
            alert('Failed to send your message. Please try again.');
        }
    };

    return (
        <div>
            {/* Futuristic Support Button */}
            <div className="support-button" onClick={handleFormToggle}>
                <span className="question-mark">?</span>
            </div>

            {isFormOpen && (
                <div className="support-container">
                    <h2>Support</h2>
                    <p>If you need help, send us a message below:</p>
                    <form onSubmit={handleSubmit}>
                        <textarea
                            placeholder="Type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                        />
                        <button type="submit" className="send-button">
                            Send Message
                        </button>
                    </form>
                    {isSent && <p className="success-message">Your message has been sent to support!</p>}
                </div>
            )}
        </div>
    );
};

export default Support;
