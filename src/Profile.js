import React, { useEffect, useState } from 'react';
import { ref, onValue, push, update, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, auth } from '../firebaseconfig'; // Update to use firebaseconfig
import { IconButton } from '@mui/material';
import { ThumbUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import './Post.css';

const Profile = () => {
    const [editing, setEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        displayName: '',
        bio: '',
        profilePicture: 'default-avatar.png',
    });
    const [brandData, setBrandData] = useState({
        businessName: '',
        category: '',
        description: '',
        logo: '',
        tools: [],
    });
    const [brands, setBrands] = useState([]);
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [likes, setLikes] = useState({});
    const [isAdmin, setIsAdmin] = useState(false); // New state for admin check
    const [loading, setLoading] = useState(true);  // New state for loading
    const navigate = useNavigate();

    const toolsOptions = [
        'Shop/Store',
        'Booking/Consult',
        'Blog',
        'Courses',
        'Services',
    ];

    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (user) {
                const brandsRef = ref(database, `users/${user.uid}/brands`);
                onValue(brandsRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setBrands(Object.values(snapshot.val()));
                    }
                });
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchProfileData = async () => {
            const user = auth.currentUser;
            if (user) {
                await user.getIdToken(true); // Force token refresh

                const userRef = ref(database, `users/${user.uid}`);
                onValue(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setProfileData(snapshot.val());
                    }
                });

                const postsRef = ref(database, `posts/${user.uid}`);
                onValue(postsRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setPosts(Object.values(snapshot.val()));
                    }
                });

                const likesRef = ref(database, 'likes');
                onValue(likesRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setLikes(snapshot.val());
                    }
                });

                // Fetch custom claims to check for admin or superAdmin role
                const idTokenResult = await user.getIdTokenResult();
                if (idTokenResult.claims.admin || idTokenResult.claims.superAdmin) {
                    setIsAdmin(true);
                }
                setLoading(false); // Stop loading once custom claims are checked
            }
        };
        fetchProfileData();
    }, []);

    const handleProfilePictureChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const storage = getStorage();
            const profilePictureRef = storageRef(storage, `profile_pictures/${auth.currentUser.uid}`);
            await uploadBytes(profilePictureRef, file);
            const url = await getDownloadURL(profilePictureRef);
            setProfileData({ ...profileData, profilePicture: url });

            const user = auth.currentUser;
            if (user) {
                await update(ref(database, `users/${user.uid}`), { profilePicture: url });
            }
        }
    };

    const handleSave = async () => {
        const user = auth.currentUser;
        if (user) {
            await update(ref(database, `users/${user.uid}`), profileData);
        }
        setEditing(false);
    };

    const handlePost = async () => {
        if (newPost.trim() === '' && !mediaFile) return;

        const user = auth.currentUser;
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) return;

        const userData = snapshot.val();
        const displayName = userData.displayName || "Anonymous";
        const postId = push(ref(database, 'posts')).key;

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
            displayName,
            text: newPost,
            mediaUrl,
            timestamp: new Date().getTime(),
        };

        const updates = {};
        updates[`/posts/${user.uid}/${postId}`] = post;
        updates[`/feed/${postId}`] = post;

        await update(ref(database), updates);
        setPosts([...posts, post]);
        setNewPost('');
        setMediaFile(null);
    };

    const handleBrandCreation = async () => {
        if (brandData.businessName === '' || brandData.category === '' || brandData.description === '') {
            alert("Please fill in all the required fields.");
            return;
        }

        const user = auth.currentUser;
        if (user) {
            const userBrandsRef = ref(database, `users/${user.uid}/brands`);
            const snapshot = await get(userBrandsRef);

            if (snapshot.exists() && Object.keys(snapshot.val()).length >= 5) {
                alert("You can only create up to 5 brands.");
                return;
            }

            const brandId = push(ref(database, 'brands')).key;
            let logoUrl = '';

            if (brandData.logo) {
                const storage = getStorage();
                const logoRef = storageRef(storage, `brands/${brandId}/${brandData.logo.name}`);
                await uploadBytes(logoRef, brandData.logo);
                logoUrl = await getDownloadURL(logoRef);
            }

            const brand = {
                id: brandId,
                userId: user.uid,
                businessName: brandData.businessName,
                category: brandData.category,
                description: brandData.description,
                tools: brandData.tools,
                logoUrl,
                status: 'pending',
            };

            await update(ref(database, `brands/${brandId}`), brand);
            await update(ref(database, `users/${user.uid}/brands/${brandId}`), { brandId, logoUrl });

            setBrandData({ businessName: '', category: '', description: '', logo: '', tools: [] });
            alert('Your brand has been submitted for review.');
        }
    };

    const handleLike = (postId) => {
        const user = auth.currentUser;
        const newLikes = {
            ...likes,
            [postId]: (likes[postId] || 0) + 1,
        };
        setLikes(newLikes);
        update(ref(database, `likes/${postId}`), newLikes[postId]);
    };

    // Navigate to AGBank Dashboard for Admins
    const handleDashboardNavigation = () => {
        navigate('/agbank-dashboard');
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-picture-container">
                    <img src={profileData.profilePicture} alt="Profile" className="profile-picture" />
                    {editing && (
                        <>
                            <input
                                type="file"
                                id="profilePictureUpload"
                                onChange={handleProfilePictureChange}
                                className="profile-picture-upload"
                            />
                            <label htmlFor="profilePictureUpload" className="profile-picture-upload-label">
                                Upload Picture
                            </label>
                        </>
                    )}
                </div>
                <div className="profile-details">
                    {editing ? (
                        <>
                            <input
                                type="text"
                                value={profileData.displayName}
                                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                className="profile-name-input"
                                placeholder="Display Name"
                            />
                            <textarea
                                value={profileData.bio}
                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                className="profile-bio-input"
                                placeholder="Bio"
                            />
                            <button onClick={handleSave} className="save-button">Save</button>
                        </>
                    ) : (
                        <>
                            <h3 className="profile-name">{profileData.displayName}</h3>
                            <p className="profile-bio">{profileData.bio}</p>
                            <button onClick={() => setEditing(true)} className="edit-button">Edit Profile</button>
                        </>
                    )}
                    <button onClick={() => auth.signOut()} className="logout-button">Logout</button>

                    {/* AGBank Dashboard Button (Only for Admins or Super Admins) */}
                    {isAdmin && (
                        <button onClick={handleDashboardNavigation} className="admin-dashboard-button">
                            Go to AGBank Dashboard
                        </button>
                    )}
                </div>
            </div>

            <div className="profile-content">
                <div className="status-update">
                    <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="What's on your mind?"
                        className="status-textarea"
                    />
                    <input
                        type="file"
                        onChange={(e) => setMediaFile(e.target.files[0])}
                        className="media-upload"
                    />
                    <button onClick={handlePost} className="post-button">Post</button>
                </div>

                <div className="brand-logos-section">
                    {brands.map((brand) => (
                        <img
                            key={brand.brandId}
                            src={brand.logoUrl}
                            alt={brand.businessName}
                            className="brand-logo-button"
                            onClick={() => navigate(`/brand/${brand.brandId}`)} // Route to BrandDetails
                        />
                    ))}
                </div>

                <div className="mybrand-section">
                    <h3>MyBrand</h3>
                    <input
                        type="text"
                        value={brandData.businessName}
                        onChange={(e) => setBrandData({ ...brandData, businessName: e.target.value })}
                        placeholder="Brand Name"
                        className="brand-input"
                    />
                    <textarea
                        value={brandData.description}
                        onChange={(e) => setBrandData({ ...brandData, description: e.target.value })}
                        placeholder="Brand Description"
                        className="brand-description-input"
                    />
                    <select
                        value={brandData.category}
                        onChange={(e) => setBrandData({ ...brandData, category: e.target.value })}
                        className="brand-category-select"
                    >
                        <option value="">Select Category</option>
                        <option value="Technology">Technology</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Music">Music</option>
                        <option value="Food & Drink">Food & Drink</option>
                    </select>
                    <label>Select Tools for Your Brand:</label>
                    {toolsOptions.map((tool, index) => (
                        <label key={index}>
                            <input
                                type="checkbox"
                                value={tool}
                                checked={brandData.tools.includes(tool)}
                                onChange={(e) => {
                                    const newTools = e.target.checked
                                        ? [...brandData.tools, tool]
                                        : brandData.tools.filter(t => t !== tool);
                                    setBrandData({ ...brandData, tools: newTools });
                                }}
                            />
                            {tool}
                        </label>
                    ))}
                    <input
                        type="file"
                        onChange={(e) => setBrandData({ ...brandData, logo: e.target.files[0] })}
                        className="brand-logo-upload"
                    />
                    <button onClick={handleBrandCreation} className="create-brand-button">Create Brand</button>
                </div>

                <div className="posts-section">
                    <h3>Posts</h3>
                    {posts.map((post) => (
                        <div key={post.id} className="post">
                            <p>{post.text}</p>
                            {post.mediaUrl && <img src={post.mediaUrl} alt="Post media" className="post-media" />}
                            <span>{new Date(post.timestamp).toLocaleString()}</span>
                            <IconButton onClick={() => handleLike(post.id)} aria-label="like">
                                <ThumbUp /> {likes[post.id] || 0}
                            </IconButton>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Profile;
