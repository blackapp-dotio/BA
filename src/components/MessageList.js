import React from 'react';
import './Chat.css';

const MessageList = ({ messages, currentUser }) => {
    return (
        <div className="messages">
            {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}>
                    <p>{msg.text}</p>
                    <span>{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

export default MessageList;
