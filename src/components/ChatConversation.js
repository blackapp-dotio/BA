import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { database, auth } from '../firebase';
import EmojiPicker from 'emoji-picker-react';
import DeleteIcon from '@mui/icons-material/Delete';  // Importing delete icon from Material UI
import './ChatConversation.css';

const ChatConversation = ({ userId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const messagesRef = ref(database, 'messages');
            onValue(messagesRef, (snapshot) => {
                const messagesData = snapshot.val();
                const messagesList = Object.keys(messagesData || {}).map(key => ({
                    id: key,
                    ...messagesData[key],
                }));

                const userMessages = messagesList.filter(msg => 
                    (msg.senderId === user.uid && msg.recipientId === userId) ||
                    (msg.senderId === userId && msg.recipientId === user.uid)
                );

                setMessages(userMessages);
                markMessagesAsRead(userMessages); // Mark the messages as read when loading them
            });
        }
    }, [userId]);

    // Mark messages as read
    const markMessagesAsRead = (messages) => {
        const user = auth.currentUser;

        const unreadMessages = messages.filter(msg => msg.recipientId === user.uid && !msg.isRead);

        const updates = {};
        unreadMessages.forEach((msg) => {
            updates[`/messages/${msg.id}/isRead`] = true;
        });

        if (Object.keys(updates).length > 0) {
            update(ref(database), updates);
        }
    };

    // Send message
    const sendMessage = async () => {
        if (newMessage.trim() === '') {
            alert("Please enter a message.");
            return;
        }

        const user = auth.currentUser;

        const message = {
            text: newMessage,
            senderId: user.uid,
            recipientId: userId,
            timestamp: new Date().toISOString(),
            isRead: false,
        };

        try {
            await push(ref(database, 'messages'), message);
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // Handle emoji selection
    const handleEmojiSelect = (event, emojiObject) => {
        setNewMessage(prevMessage => prevMessage + emojiObject.emoji); // Append selected emoji
        setShowEmojiPicker(false); // Close emoji picker after selecting
    };

    // Delete individual message
    const deleteMessage = (messageId) => {
        const messageRef = ref(database, `messages/${messageId}`);
        remove(messageRef)
            .then(() => console.log("Message deleted"))
            .catch((error) => console.error("Error deleting message:", error));
    };

    // Delete entire chat
    const deleteChat = () => {
        const user = auth.currentUser;
        const messagesRef = ref(database, 'messages');

        onValue(messagesRef, (snapshot) => {
            const messagesData = snapshot.val();
            const userMessages = Object.keys(messagesData || {}).filter(key => {
                const msg = messagesData[key];
                return (msg.senderId === user.uid && msg.recipientId === userId) || 
                       (msg.senderId === userId && msg.recipientId === user.uid);
            });

            userMessages.forEach((messageId) => {
                const messageRef = ref(database, `messages/${messageId}`);
                remove(messageRef).catch((error) => console.error("Error deleting message:", error));
            });
        });
    };

    return (
        <div className="chat-conversation">
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.senderId === auth.currentUser.uid ? 'sent' : 'received'}`}>
                        <p>{msg.text}</p>
                        <span>{new Date(msg.timestamp).toLocaleString()}</span>
                        {msg.senderId === auth.currentUser.uid && ( // Allow deletion only for sent messages
                            <DeleteIcon 
                                onClick={() => deleteMessage(msg.id)} 
                                style={{ cursor: 'pointer', color: 'red' }}
                                className="delete-icon"
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="message-input">
                {showEmojiPicker && (
                    <EmojiPicker onEmojiClick={handleEmojiSelect} />
                )}
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message"
                />
                <div className="input-actions">
                    <button onClick={sendMessage} className="send-button">Send</button>
                    <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="emoji-button">
                        😊
                    </button>
                    <button onClick={deleteChat} className="delete-chat-button">Delete Chat</button>
                </div>
            </div>
        </div>
    );
};

export default ChatConversation;
