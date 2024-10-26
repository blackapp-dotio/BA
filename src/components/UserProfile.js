import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { database, auth } from '../firebase';
import { Button, Typography } from '@mui/material';
import './UserProfile.css';

const UserProfile = () => {
    const { uid } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (uid) {
            const userRef = ref(database, `users/${uid}`);
            onValue(userRef, (snapshot) => {
                console.log('User data:', snapshot.val()); // Add console log for debugging
                setProfileData(snapshot.val());
            });

            if (currentUser) {
                const followingRef = ref(database, `following/${currentUser.uid}`);
                onValue(followingRef, (snapshot) => {
                    const followingData = snapshot.val();
                    console.log('Following data:', followingData); // Add console log for debugging
                    if (followingData) {
                        // Adjust for different data structures
                        if (Array.isArray(followingData)) {
                            setIsFollowing(followingData.includes(uid));
                        } else {
                            setIsFollowing(Object.keys(followingData).includes(uid));
                        }
                    }
                });
            }
        }
    }, [uid, currentUser]);

    const handleFollow = async () => {
        if (currentUser && profileData) {
            const followingRef = ref(database, `following/${currentUser.uid}`);
            const followersRef = ref(database, `followers/${uid}`);

            if (isFollowing) {
                // Unfollow
                await update(followingRef, {
                    [uid]: null,
                });
                await update(followersRef, {
                    [currentUser.uid]: null,
                });
            } else {
                // Follow
                await update(followingRef, {
                    [uid]: profileData.displayName,
                });
                await update(followersRef, {
                    [currentUser.uid]: currentUser.displayName || 'Anonymous',
                });
            }

            setIsFollowing(!isFollowing);
        }
    };

    if (!profileData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="user-profile">
            <img src={profileData.profilePicture || 'default-avatar.png'} alt="Profile" className="profile-picture" />
            <Typography variant="h4">{profileData.displayName}</Typography>
            <Typography variant="body1">{profileData.bio}</Typography>
            <Button variant="contained" color="primary" onClick={handleFollow}>
                {isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
        </div>
    );
};

export default UserProfile;
