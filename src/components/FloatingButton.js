import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ref, get } from 'firebase/database';
import { database, auth } from '../firebase';
import CreatePost from './CreatePost';

const FloatingButton = () => {
    const [open, setOpen] = useState(false);
    const [displayName, setDisplayName] = useState('Anonymous');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch the user's displayName from Firebase when the component mounts
        const fetchDisplayName = async () => {
            const user = auth.currentUser;
            if (user) {
                const userRef = ref(database, `users/${user.uid}`);
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    setDisplayName(userData.displayName || 'Anonymous');
                }
            }
        };

        fetchDisplayName();
    }, []);

    const handlePostClick = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, backgroundColor: 'red' }}>
                <IconButton onClick={handlePostClick} style={{ color: 'white' }}>
                    <AddIcon />
                </IconButton>
            </div>
            <CreatePost
                open={open}
                handleClose={handleClose}
                displayName={displayName}  // Pass the retrieved displayName to CreatePost
                loading={loading}
                setLoading={setLoading}
            />
        </div>
    );
};

export default FloatingButton;
