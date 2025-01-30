import React, { useState, useEffect } from "react";
import { ref, onValue, push, update, remove, get } from "firebase/database";
import { database, auth } from "../firebase";
import EmojiPicker from "emoji-picker-react";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import "./GroupChat.css";

const GroupChat = () => {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [newGroupName, setNewGroupName] = useState("");
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [groupMembers, setGroupMembers] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);

    useEffect(() => {
        const groupsRef = ref(database, "groupChats");
        onValue(groupsRef, (snapshot) => {
            const data = snapshot.val();
            const loadedGroups = data ? Object.keys(data).map((key) => ({
                id: key,
                ...data[key]
            })) : [];
            setGroups(loadedGroups);
        });

        const usersRef = ref(database, "users");
        onValue(usersRef, (snapshot) => {
            const usersData = snapshot.val();
            if (usersData) {
                const userList = Object.keys(usersData).map((key) => ({
                    id: key,
                    displayName: usersData[key].displayName || "Unknown User"
                }));
                setUsers(userList);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            const messagesRef = ref(database, `groupMessages/${selectedGroup.id}`);
            onValue(messagesRef, (snapshot) => {
                const data = snapshot.val();
                const loadedMessages = data ? Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key]
                })) : [];
                setMessages(loadedMessages);
            });

            const membersRef = ref(database, `groupChats/${selectedGroup.id}/members`);
            onValue(membersRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setGroupMembers(Object.keys(data).map((userId) => ({
                        id: userId,
                        displayName: data[userId].displayName || "Unknown User"
                    })));
                }
            });
        }
    }, [selectedGroup]);

    const createGroup = async () => {
        if (newGroupName.trim() === "") return alert("Please enter a group name!");

        const user = auth.currentUser;
        const groupRef = push(ref(database, "groupChats"));

        await update(groupRef, {
            id: groupRef.key,
            name: newGroupName,
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
            members: {
                [user.uid]: { displayName: user.displayName || "Unknown User" }
            }
        });

        setNewGroupName("");
    };

    const joinGroup = async (groupId) => {
        const user = auth.currentUser;
        const groupRef = ref(database, `groupChats/${groupId}/members/${user.uid}`);

        await update(groupRef, {
            displayName: user.displayName || "Unknown User",
            joinedAt: new Date().toISOString()
        });

        setSelectedGroup(groups.find((group) => group.id === groupId));
    };

    const handleUserSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSelectedUser(query);
        if (query) {
            const suggestions = users.filter((user) =>
                user.displayName.toLowerCase().includes(query)
            );
            setFilteredUsers(suggestions);
        } else {
            setFilteredUsers([]);
        }
    };

    const selectUser = (user) => {
        setSelectedUser(user.displayName);
        setFilteredUsers([]);
    };

    const addUserToGroup = async () => {
        if (!selectedGroup) return alert("Select a group first!");
        if (!selectedUser.trim()) return alert("Select a user!");

        const userToAdd = users.find((user) => user.displayName === selectedUser);
        if (!userToAdd) return alert("User not found!");

        const memberRef = ref(database, `groupChats/${selectedGroup.id}/members/${userToAdd.id}`);
        await update(memberRef, {
            displayName: userToAdd.displayName,
            addedAt: new Date().toISOString()
        });

        setSelectedUser("");
    };

    const sendMessage = async () => {
        if (newMessage.trim() === "" || !selectedGroup) return;

        const user = auth.currentUser;
        const messageRef = push(ref(database, `groupMessages/${selectedGroup.id}`));

        await messageRef.set({
            id: messageRef.key,
            text: newMessage,
            senderId: user.uid,
            senderName: user.displayName || "Unknown User",
            timestamp: new Date().toISOString()
        });

        setNewMessage("");
    };

    const deleteMessage = async (messageId) => {
        await remove(ref(database, `groupMessages/${selectedGroup.id}/${messageId}`));
    };

    const handleEmojiSelect = (event, emojiObject) => {
        setNewMessage((prevMessage) => prevMessage + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    return (
        <div className="group-chat">
            <div className="group-sidebar">
                <h3>Group Chats</h3>
                <div className="create-group">
                    <input
                        type="text"
                        placeholder="Create new group..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <button onClick={createGroup}>
                        <AddIcon />
                    </button>
                </div>
                <ul>
                    {groups.map((group) => (
                        <li
                            key={group.id}
                            onClick={() => joinGroup(group.id)}
                            className={selectedGroup?.id === group.id ? "active" : ""}
                        >
                            {group.name}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="group-chat-window">
                {selectedGroup ? (
                    <>
                        <h3>{selectedGroup.name}</h3>
                        <p><strong>Members:</strong> {groupMembers.map((m) => m.displayName).join(", ")}</p>

                        <div className="add-user">
                            <input
                                type="text"
                                placeholder="Search user by name..."
                                value={selectedUser}
                                onChange={handleUserSearch}
                            />
                            {filteredUsers.length > 0 && (
                                <ul className="user-suggestions">
                                    {filteredUsers.map((user) => (
                                        <li key={user.id} onClick={() => selectUser(user)}>
                                            {user.displayName}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button onClick={addUserToGroup}>Add User</button>
                        </div>

                        <div className="messages">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`message ${msg.senderId === auth.currentUser.uid ? "sent" : "received"}`}>
                                    <p><strong>{msg.senderName}: </strong>{msg.text}</p>
                                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                    {msg.senderId === auth.currentUser.uid && (
                                        <DeleteIcon onClick={() => deleteMessage(msg.id)} className="delete-icon" />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="message-input">
                            {showEmojiPicker && <EmojiPicker onEmojiClick={handleEmojiSelect} />}
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                            />
                            <div className="input-actions">
                                <button onClick={sendMessage} className="send-button">Send</button>
                                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="emoji-button">😊</button>
                            </div>
                        </div>
                    </>
                ) : (
                    <p>Select or create a group to start chatting.</p>
                )}
            </div>
        </div>
    );
};

export default GroupChat;
