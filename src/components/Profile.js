import React, { useEffect, useState } from 'react';
import { ref, onValue, push, update, remove, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, auth } from '../firebaseconfig';
import Select from 'react-select';
import { useNavigate, useParams } from 'react-router-dom';
import { FaHeart, FaComment, FaShare } from 'react-icons/fa';
import './Profile.css';
import './styles/buttons.css';

const Profile = () => {
  const { uid } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const toolsOptions = [
    { value: 'shop', label: 'Shop/Store' },
    { value: 'consult', label: 'Booking/Consult' },
    { value: 'blog', label: 'Blog' },
    { value: 'courses', label: 'Courses' },
    { value: 'services', label: 'Services' },
  ];

  const categoryOptions = [
    { value: 'Technology', label: 'Technology' },
    { value: 'Fashion', label: 'Fashion' },
    { value: 'Food and Drinks', label: 'Food and Drinks' },
    { value: 'Music', label: 'Music' },
    { value: 'Health and Fitness', label: 'Health and Fitness' },
    { value: 'Education', label: 'Education' },
    { value: 'Travel', label: 'Travel' },
  ];

  // Custom styles for react-select components
  const customSelectStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: '#ffffff',
      border: '1px solid #555555',
      boxShadow: 'none',
      cursor: 'pointer',
    }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected
        ? 'rgba(0, 123, 255, 0.7)'
        : isFocused
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.7)',
      color: '#ffffff',
      cursor: 'pointer',
    }),
    singleValue: (styles) => ({
      ...styles,
      color: '#ffffff',
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    }),
    placeholder: (styles) => ({
      ...styles,
      color: '#cccccc',
    }),
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      const userId = uid || currentUser?.uid;
      if (userId) {
        const userRef = ref(database, `users/${userId}`);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfileData(snapshot.val());
          }
        });

        const postsRef = ref(database, `posts/${userId}`);
        onValue(postsRef, (snapshot) => {
          if (snapshot.exists()) {
            setPosts(Object.values(snapshot.val()));
          }
        });

        const brandsRef = ref(database, `users/${userId}/brands`);
        onValue(brandsRef, (snapshot) => {
          if (snapshot.exists()) {
            setBrands(Object.values(snapshot.val()));
          }
        });

        const likesRef = ref(database, 'likes');
        onValue(likesRef, (snapshot) => {
          if (snapshot.exists()) {
            setLikes(snapshot.val());
          }
        });

        if (uid && currentUser) {
          const followingRef = ref(database, `following/${currentUser.uid}`);
          onValue(followingRef, (snapshot) => {
            const followingData = snapshot.val() || {};
            setIsFollowing(!!followingData[uid]);
          });
        }

        if (!uid) {
          const idTokenResult = await currentUser.getIdTokenResult();
          if (idTokenResult.claims.admin || idTokenResult.claims.superAdmin) {
            setIsAdmin(true);
          }
        }
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [uid, currentUser]);

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const storage = getStorage();
      const profilePictureRef = storageRef(storage, `profile_pictures/${auth.currentUser.uid}`);
      await uploadBytes(profilePictureRef, file);
      const url = await getDownloadURL(profilePictureRef);
      setProfileData({ ...profileData, profilePicture: url });

      if (currentUser) {
        await update(ref(database, `users/${currentUser.uid}`), { profilePicture: url });
      }
    }
  };

  const handleSave = async () => {
    if (currentUser) {
      await update(ref(database, `users/${currentUser.uid}`), profileData);
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
    const displayName = userData.displayName || 'Anonymous';
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

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await remove(ref(database, `posts/${currentUser.uid}/${postId}`));
        await remove(ref(database, `feed/${postId}`));
        setPosts(posts.filter((post) => post.id !== postId));
        alert('Post deleted successfully.');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('An error occurred while deleting the post. Please try again.');
      }
    }
  };

  const handleLike = (postId) => {
    const newLikes = {
      ...likes,
      [postId]: (likes[postId] || 0) + 1,
    };
    setLikes(newLikes);
    update(ref(database, `likes/${postId}`), newLikes[postId]);
  };

  const handleComment = (postId) => {
    alert(`Comment on post ${postId}`);
  };

  const handleShare = (postId) => {
    alert(`Share post ${postId}`);
  };

  const handleBrandCreation = async () => {
    if (!brandData.businessName || !brandData.category || !brandData.description || brandData.tools.length === 0) {
      alert('Please fill in all the required fields and select at least one tool.');
      return;
    }

    const user = auth.currentUser;
    if (user) {
      const brandId = editingBrand ? editingBrand.id : push(ref(database, 'brands')).key;
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
        logoUrl: logoUrl || (editingBrand && editingBrand.logoUrl) || '',
        status: 'pending',
      };

      await update(ref(database, `brands/${brandId}`), brand);
      await update(ref(database, `users/${user.uid}/brands/${brandId}`), { brandId, logoUrl });

      setBrandData({ businessName: '', category: '', description: '', logo: '', tools: [] });
      setEditingBrand(null);
      alert('Your brand has been submitted.');
    }
  };

  const handleBrandLogoChange = (event) => {
    setBrandData({ ...brandData, logo: event.target.files[0] });
  };

  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandData({
      businessName: brand.businessName,
      category: brand.category,
      description: brand.description,
      logo: brand.logoUrl,
      tools: brand.tools,
    });
  };

  const handleDeleteBrand = async (brandId) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      await remove(ref(database, `brands/${brandId}`));
      await remove(ref(database, `users/${auth.currentUser.uid}/brands/${brandId}`));
      alert('Brand deleted successfully.');
    }
  };

  const handleDashboardNavigation = () => {
    navigate('/agbank-dashboard');
  };

  const handleFollow = async () => {
    if (currentUser && profileData) {
      const followingRef = ref(database, `following/${currentUser.uid}`);
      const followersRef = ref(database, `followers/${uid}`);

      if (isFollowing) {
        await update(followingRef, { [uid]: null });
        await update(followersRef, { [currentUser.uid]: null });
      } else {
        await update(followingRef, { [uid]: profileData.displayName });
        await update(followersRef, { [currentUser.uid]: currentUser.displayName || 'Anonymous' });
      }
      setIsFollowing(!isFollowing);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-picture-container">
          <img src={profileData.profilePicture} alt="Profile" className="profile-picture" />
          {editing && uid === undefined && (
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
          {editing && uid === undefined ? (
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
              {uid === undefined && (
                <button onClick={() => setEditing(true)} className="edit-button">Edit Profile</button>
              )}
            </>
          )}
          {uid !== undefined && uid !== currentUser?.uid && (
            <button className="follow-button" onClick={handleFollow}>
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
          {uid === undefined && (
            <button onClick={() => auth.signOut()} className="logout-button">Logout</button>
          )}
          {isAdmin && (
            <button onClick={handleDashboardNavigation} className="admin-dashboard-button">
              Go to AGBank Dashboard
            </button>
          )}
        </div>
      </div>

      <div className="profile-content">
        {uid === undefined && (
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
        )}

        <div className="brand-logos-section">
          <h3>Your Brands</h3>
          {brands.map((brand) => (
            <div key={brand.brandId} className="brand-logo-wrapper">
              <img
                src={brand.logoUrl}
                alt={brand.businessName}
                className="brand-logo-button"
                onClick={() => navigate(`/brand-management/${brand.brandId}`)}
              />
              <div className="brand-actions">
                {uid === undefined && (
                  <>
                    <button className="edit-button" onClick={() => handleEditBrand(brand)}>
                      Edit
                    </button>
                    <button className="delete-button" onClick={() => handleDeleteBrand(brand.brandId)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {uid === undefined && (
          <div className="mybrand-section">
            <h3>{editingBrand ? 'Edit Brand' : 'Create a Brand'}</h3>
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
            <Select
              options={categoryOptions}
              onChange={(selectedOption) => setBrandData({ ...brandData, category: selectedOption.value })}
              placeholder="Select Category"
              className="brand-category-select"
              styles={customSelectStyles}
            />
            <Select
              options={toolsOptions}
              isMulti
              onChange={(selectedOptions) => setBrandData({ ...brandData, tools: selectedOptions.map(option => option.value) })}
              placeholder="Select Tools"
              className="brand-tools-select"
              styles={customSelectStyles}
            />
            <label htmlFor="brandLogo" className="brand-logo-upload-label">
              Upload Logo
            </label>
            <input
              type="file"
              id="brandLogo"
              onChange={handleBrandLogoChange}
              className="brand-logo-upload"
            />
            <button onClick={handleBrandCreation} className="create-brand-button">
              {editingBrand ? 'Update Brand' : 'Create Brand'}
            </button>
          </div>
        )}

        <div className="posts-section">
          <h3>Posts</h3>
          {posts.map((post) => (
            <div key={post.id} className="post">
              <p>{post.text}</p>
              {post.mediaUrl && <img src={post.mediaUrl} alt="Post media" className="post-media" />}
              <span>{new Date(post.timestamp).toLocaleString()}</span>
              <div className="post-actions">
                <button className="like-button" onClick={() => handleLike(post.id)}>
                  <FaHeart /> ({likes[post.id] || 0})
                </button>
                <button className="comment-button" onClick={() => handleComment(post.id)}>
                  <FaComment />
                </button>
                <button className="share-button" onClick={() => handleShare(post.id)}>
                  <FaShare />
                </button>
                {uid === undefined && (
                  <button className="delete-button" onClick={() => handleDeletePost(post.id)}>
                    Delete Post
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
