import React, { useState } from 'react';
import { Modal, Box, TextField, Button } from '@mui/material';
import { ref, push, update } from 'firebase/database';
import { database, auth } from '../firebase';

const CreatePost = ({ open, handleClose, displayName, loading, setLoading }) => {
    const [newPost, setNewPost] = useState('');
    const [mediaFile, setMediaFile] = useState(null);

    const handleAddPost = async () => {
        if (newPost.trim() === '' && !mediaFile) return;

        setLoading(true);  // Start loading state
        const user = auth.currentUser;

        if (!user) {
            console.error("User not authenticated.");
            setLoading(false);
            return;
        }

        const postId = push(ref(database, 'feed')).key;

        let mediaUrl = '';
        if (mediaFile) {
            const storage = getStorage();
            const mediaStorageRef = storageRef(storage, `posts/${postId}/${mediaFile.name}`);
            await uploadBytes(mediaStorageRef, mediaFile);
            mediaUrl = await getDownloadURL(mediaStorageRef);
        }

        const post = {
            id: postId,
            userId: user.uid,
            displayName,  // Use the displayName passed from FloatingButton
            text: newPost,
            mediaUrl,
            timestamp: new Date().getTime(),
        };

        const updates = {};
        updates[`/posts/${user.uid}/${postId}`] = post;
        updates[`/feed/${postId}`] = post;

        try {
            await update(ref(database), updates);
            setNewPost('');
            setMediaFile(null);
            handleClose();
        } catch (error) {
            console.error("Error posting:", error);
        } finally {
            setLoading(false);  // Reset loading state
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
                <TextField
                    label="What's on your mind?"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    disabled={loading}  // Disable input when loading
                />
                <input
                    type="file"
                    onChange={(e) => setMediaFile(e.target.files[0])}
                    disabled={loading}  // Disable file input when loading
                />
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleAddPost} 
                    disabled={loading}  // Disable button when loading
                >
                    {loading ? 'Posting...' : 'Post'}
                </Button>
            </Box>
        </Modal>
    );
};

export default CreatePost;
