import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database, auth } from '../firebase';
import ChatList from './ChatList';
import ChatConversation from './ChatConversation';
import GroupChat from './GroupChat';
import SendAGMoney from './SendAGMoney';
import './Chat.css';

const Chat = ({ onMessagesRead }) => {
    const [unreadMessages, setUnreadMessages] = useState(0);
    const navigate = useNavigate();

    const requestNotificationPermission = async () => {
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    };

    const showPushNotification = (message) => {
        if (Notification.permission === 'granted') {
            new Notification(`New message from ${message.senderName}`, {
                body: message.text,
                icon: '/path-to-notification-icon.png'
            });
        }
    };

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const messagesRef = ref(database, 'messages');
            onValue(messagesRef, (snapshot) => {
                const messagesData = snapshot.val();
                let count = 0;
                Object.keys(messagesData || {}).forEach(key => {
                    const message = messagesData[key];
                    if (message.recipientId === user.uid && !message.isRead) {
                        count++;
                        showPushNotification(message); // Show push notification
                    }
                });
                setUnreadMessages(count);
                onMessagesRead(count);
            });

            // Request notification permission on component load
            requestNotificationPermission();
        }
    }, []);

    return (
        <div className="chat-container">
            <div className="tabs">
                <Link to="/chat/active-chats">
                    <button className={window.location.pathname === "/chat/active-chats" ? "active" : ""}>Active Chats</button>
                </Link>
                <Link to="/chat/group-chat">
                    <button className={window.location.pathname === "/chat/group-chat" ? "active" : ""}>Group Chat</button>
                </Link>
                <Link to="/chat/send-money">
                    <button className={window.location.pathname === "/chat/send-money" ? "active" : ""}>Send AGMoney</button>
                </Link>
            </div>
            <div className="chat-section">
                <Routes>
                    <Route path="/active-chats" element={<ChatList />} />
                    <Route path="/conversation/:userId" element={<ChatConversation onMessagesRead={onMessagesRead} />} />
                    <Route path="/group-chat" element={<GroupChat />} />
                    <Route path="/send-money" element={<SendAGMoney />} />
                </Routes>
            </div>
        </div>
    );
};

export default Chat;
