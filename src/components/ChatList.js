import React, { useState, useEffect } from 'react';
import { ref, onValue, get, update } from 'firebase/database';
import { database, auth, messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import ChatConversation from './ChatConversation';
import GroupChat from './GroupChat';
import SendAGMoney from './SendAGMoney';
import './ChatList.css';

const ChatList = () => {
    const [activeTab, setActiveTab] = useState('activeChats');
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [chats, setChats] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const messagesRef = ref(database, 'messages');
            const unreadRef = ref(database, `unread_messages/${user.uid}`);

            // Listen for real-time updates of unread message count
            onValue(unreadRef, (snapshot) => {
                const count = snapshot.val() || 0;
                setUnreadCount(count);
                console.log(`Updated unread message count: ${count}`);
            });

            // Listen for new messages in real-time
            onValue(messagesRef, (snapshot) => {
                const messagesData = snapshot.val();
                const activeChats = [];

                Object.keys(messagesData || {}).forEach(async (key) => {
                    const message = messagesData[key];
                    const chatPartnerId = message.senderId === user.uid ? message.recipientId : message.senderId;
                    const isFollowing = await isUserFollowing(chatPartnerId);

                    if (isFollowing) {
                        const userRef = ref(database, `users/${chatPartnerId}`);
                        const userSnapshot = await get(userRef);
                        const chatPartnerDisplayName = userSnapshot.exists() ? userSnapshot.val().displayName : 'Unknown User';

                        const chatExists = activeChats.find(chat => chat.userId === chatPartnerId);
                        const isUnread = message.recipientId === user.uid && !message.isRead;

                        if (!chatExists) {
                            activeChats.push({
                                userId: chatPartnerId,
                                displayName: chatPartnerDisplayName,
                                lastMessage: message.text,
                                timestamp: message.timestamp,
                                isUnread,
                                unreadCount: isUnread ? 1 : 0,
                            });
                        } else {
                            chatExists.unreadCount += isUnread ? 1 : 0;
                            if (message.timestamp > chatExists.timestamp) {
                                chatExists.lastMessage = message.text;
                                chatExists.timestamp = message.timestamp;
                            }
                        }
                    }
                });

                const sortedChats = activeChats.sort((a, b) => b.timestamp - a.timestamp);
                setChats(sortedChats);
                setFilteredUsers(sortedChats);
            });

            requestPushNotificationPermission();
            onMessageListener();
        }
    }, []);

    // Check if the user follows the chat partner
    const isUserFollowing = async (chatPartnerId) => {
        const followingRef = ref(database, `following/${auth.currentUser.uid}`);
        const followingSnapshot = await get(followingRef);
        const following = followingSnapshot.val();
        return following && following[chatPartnerId] !== undefined;
    };

    const handleSearchChange = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        setFilteredUsers(chats.filter(chat =>
            chat.displayName.toLowerCase().includes(query)
        ));
    };

    const startConversation = (userId) => {
        const chat = chats.find(c => c.userId === userId);
        if (chat) {
            setSelectedChat(chat);

            if (chat.unreadCount > 0) {
                update(ref(database, `unread_messages/${auth.currentUser.uid}`), { count: 0 });
                setChats((prevChats) =>
                    prevChats.map((c) =>
                        c.userId === userId ? { ...c, unreadCount: 0 } : c
                    )
                );
            }
        }
    };

    // Request push notification permissions and get token
    const requestPushNotificationPermission = async () => {
        try {
            const token = await getToken(messaging, { vapidKey: 'BKxHDuFsSccMzKisFGeJFuhTqmLFvySxRk5Y3O81YoKlTKMytDTxfcB2N0Dk88jQE2APQ8KvFD5REzSsyj0YqqA' });
            console.log('FCM Token:', token);
        } catch (error) {
            console.error('Error getting FCM token:', error);
        }
    };

    // Listen for incoming push notifications
    const onMessageListener = () => {
        onMessage(messaging, (payload) => {
            console.log('New message received:', payload);
            if (payload.notification) {
                showNotification(payload.notification);
            }
        });
    };

    // Show browser notifications for new messages
    const showNotification = (notification) => {
        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.body,
                icon: '/chat-icon.png',
            });
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'activeChats':
                return selectedChat ? (
                    <ChatConversation userId={selectedChat.userId} />
                ) : (
                    <>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="search-input"
                            />
                        </div>
                        <ul className="user-list">
                            {filteredUsers.map(chat => (
                                <li
                                    key={chat.userId}
                                    onClick={() => startConversation(chat.userId)}
                                    className={chat.unreadCount > 0 ? 'unread' : ''}
                                >
                                    <span className="display-name">{chat.displayName}</span>
                                    <span className="last-message">{chat.lastMessage}</span>
                                    {chat.unreadCount > 0 && <span className="unread-indicator">({chat.unreadCount})</span>}
                                </li>
                            ))}
                        </ul>
                    </>
                );
            case 'groupChats':
                return <GroupChat />;
            case 'sendAGMoney':
                return <SendAGMoney />;
            default:
                return null;
        }
    };

    return (
        <div className="chat-list">
            <div className="tabs">
                <button
                    className={activeTab === 'activeChats' ? 'active' : ''}
                    onClick={() => {
                        setActiveTab('activeChats');
                        setSelectedChat(null);
                    }}
                >
                    Active Chats {unreadCount > 0 && <span className="unread-badge">({unreadCount})</span>}
                </button>
                <button
                    className={activeTab === 'groupChats' ? 'active' : ''}
                    onClick={() => setActiveTab('groupChats')}
                >
                    Group Chats
                </button>
                <button
                    className={activeTab === 'sendAGMoney' ? 'active' : ''}
                    onClick={() => setActiveTab('sendAGMoney')}
                >
                    Send AGMoney
                </button>
            </div>
            <div className="tab-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ChatList;
