import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, push, update, remove, get, set, query, orderByChild, startAt, endAt, child } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, auth } from '../firebaseconfig';
import Select from 'react-select';
import CircleSection from './CircleSection';
import CircleManager from './CircleManager';
import CircleInsights from './CircleInsights';
import ARCircle from './ARCircle'; // Adjust the path as needed
import { useNavigate, useParams } from 'react-router-dom';
import { FaHeart, FaComment, FaShare } from 'react-icons/fa';
import AddMember from './AddMember';
import './Profile.css';
import AROrb from './AROrb'; // Adjust the path if needed
import './styles/ARorb.css'; // Ensure the CSS file path is correct
import './CircleSection.css'; 
import './styles/buttons.css';

const Profile = () => {
  const { uid } = useParams();
  const [editing, setEditing] = useState(false);
// const [brands, setBrands] = useState([]);
// const navigate = useNavigate();
  
  const [showExpanded, setShowExpanded] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [insights, aiInsights, faiInsights, setAiInsights] = useState({});
  const [selectedCircleInsights, setSelectedCircleInsights] = useState(null); // Insights for the selected circl
  const [viewMode, setViewMode] = useState('AI'); // Toggle between 'AI' and 'AR'  
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState(null);
  const [selectedCircleMembers, setSelectedCircleMembers] = useState([]);

  const [circles, setCircles] = useState([
    { name: 'Friends', color: '#FF0000', members: [] }, 
    { name: 'Family', color: '#00FF00',  members: [] },
    { name: 'Business', color: '#0000FF', members: [] },
    { name: 'Romance', color: '#FF0000', members: [] },     
  ]);
  
  const platformUsers = [
  { uid: '1', displayName: 'John Doe' },
  { uid: '2', displayName: 'Jane Smith' },
  { uid: '3', displayName: 'Alex Johnson' },
];

  const fetchAiInsights = async (circleName) => {
    const database = getDatabase();
    const insightsRef = ref(database, `analytics/${circleName}`);
    try {
      const snapshot = await get(insightsRef);
      if (snapshot.exists()) {
        setAiInsights((prev) => ({
          ...prev,
          [circleName]: snapshot.val(),
        }));
      } else {
        console.log("No insights available for this circle.");
      }
    } catch (error) {
      console.error("Error fetching AI insights:", error);
    }
  };



  const handleCircleClick = (circleName) => {
  console.log(`Circle clicked: ${circleName}`);
  setSelectedCircle(circleName);
  fetchCircleMembers(circleName, setSelectedCircleMembers);
};

  const handleBackToCircles = () => {
    setSelectedCircle(null);
    setShowExpanded(false);
  };

  const handleToggleView = () => {
    setViewMode(viewMode === 'AI' ? 'AR' : 'AI');
  };

  // const handleAddCircle = () => {
    // const circleName = prompt('Enter a name for your new circle:');
    // const circleColor = prompt('Enter a color for your new circle (hex or name):');
    // if (circleName && circleColor) {
     // const newCircle = { name: circleName, color: circleColor };
      // setCircles([...circles, newCircle]);
    // }
  // };  
  
    const [setPlatformUsers] = useState([]);
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
  const [circle, showCircleManager, setShowCircleManager] = useState(false); // Add state for modal visibility
  const [brands, setBrands] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [likes, setLikes] = useState({});
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [members, setMembers] = useState([]);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const toolsOptions = [
    { value: 'shop', label: 'Shop/Store' },
    { value: 'Booking', label: 'Booking' },
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
        
          if (selectedCircle && viewMode === "AI") {
      fetchAiInsights(selectedCircle);
    }
  // }, [selectedCircle, viewMode]);
  
        

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
        
        
    const fetchUsers = async () => {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const users = [];
      snapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          displayName: childSnapshot.val().displayName,
        });
      });
      setPlatformUsers(users);
    });
  };

 // fetchUsers();
// }; 
// []);

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

const handleLike = async (postId) => {
  const user = auth.currentUser;

  if (!user) {
    alert("You need to log in to like a post.");
    return;
  }

  const postLikeRef = ref(database, `likes/${postId}`);
  const userLikeRef = ref(database, `likes/${postId}/users/${user.uid}`);
  
  const userSnapshot = await get(userLikeRef);

  if (userSnapshot.exists()) {
    alert("You've already liked this post!");
    return;
  }

  // Fetch the current like count safely
  const snapshot = await get(postLikeRef);
  const currentLikes = snapshot.exists() && typeof snapshot.val().count === 'number'
    ? snapshot.val().count
    : 0;

  const newLikes = currentLikes + 1;

  // Update the like count and add the user ID
  await update(postLikeRef, {
    count: newLikes,
    [`users/${user.uid}`]: true, // Add this user to the list of users who liked the post
  });

  // Update local state to reflect the new like count immediately
  setLikes((prevLikes) => ({
    ...prevLikes,
    [postId]: newLikes,
  }));
};

const handleUnlike = async (postId) => {
  const user = auth.currentUser;

  if (!user) {
    alert("You need to log in to unlike a post.");
    return;
  }

  const postLikeRef = ref(database, `likes/${postId}`);
  const userLikeRef = ref(database, `likes/${postId}/users/${user.uid}`);

  const snapshot = await get(postLikeRef);
  const currentLikes = snapshot.exists() && typeof snapshot.val().count === 'number'
    ? snapshot.val().count
    : 0;

  if (!currentLikes || !snapshot.child(`users/${user.uid}`).exists()) {
    alert("You haven't liked this post yet!");
    return;
  }

  const newLikes = currentLikes - 1;

  // Update the like count and remove the user ID
  await update(postLikeRef, {
    count: newLikes,
  });

  await remove(userLikeRef);

  // Update local state to reflect the new like count immediately
  setLikes((prevLikes) => ({
    ...prevLikes,
    [postId]: newLikes,
  }));
};


  const handleComment = (postId) => {
    alert(`Comment on post ${postId}`);
  };

  const handleShare = (postId) => {
    const shareData = {
      title: 'Check out this post!',
      text: 'Have a look at this post on BlackApp.',
      url: `${window.location.origin}/post/${postId}`, // Customize the URL as needed
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareData.url)
        .then(() => alert('Post link copied to clipboard!'))
        .catch(console.error);
    }
  };

const handleBrandCreation = async () => {
  if (!brandData.businessName || !brandData.logo) {
    alert('Please enter a brand name and upload a logo.');
    return;
  }

  try {
    const user = auth.currentUser;
    if (user) {
      const brandId = push(ref(database, 'brands')).key;
      let logoUrl = '';

      if (brandData.logo) {
        const storage = getStorage();
        const logoRef = storageRef(storage, `brands/${brandId}/${brandData.logo.name}`);
        await uploadBytes(logoRef, brandData.logo);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Define tools structure with all tools as empty arrays or objects
      const toolsStructure = {
        shop: { products: [] },
        booking: { bookings: [] },
        blog: { posts: [] },
        courses: { courses: [] },
        services: { services: [] },
      };

      const brand = {
        id: brandId,
        userId: user.uid,
        businessName: brandData.businessName,
        description: brandData.description || '',
        logoUrl: logoUrl,
        status: 'pending', // For admin approval
        isPublished: false,
        tools: toolsStructure, // Store all tools within the tools array only
      };

      // Save brand data to Firebase
     await update(ref(database, `brands/${brandId}`), brand);
      await update(ref(database, `users/${user.uid}/brands/${brandId}`), { brandId, logoUrl });
      
      setBrandData({ businessName: '', description: '', logo: '' });
      alert('Brand created and pending admin approval.');
    }
  } catch (error) {
    console.error('Error creating brand:', error);
    alert('An error occurred while creating the brand. Please try again.');
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
    try {
      // Remove brand data from Firebase
      await remove(ref(database, `brands/${brandId}`));
      await remove(ref(database, `users/${auth.currentUser.uid}/brands/${brandId}`));

      // Update local brands state
      setBrands((prevBrands) => prevBrands.filter((brand) => brand.brandId !== brandId));

      alert('Brand deleted successfully.');
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('An error occurred while deleting the brand. Please try again.');
    }
  }
};

  const handleDashboardNavigation = () => {
    navigate('/agbank-dashboard');
  };

// Add this function above your `return` statement in the Profile component
const handleAddCircle = (newCircle) => {
  setCircles([...circles, { ...newCircle, members: [] }]);
  const circleName = prompt('Enter a name for your new circle:');
  const circleColor = prompt('Enter a color for your new circle (hex or name):');
  if (circleName && circleColor) {
    const newCircle = { name: circleName, color: circleColor };
    setCircles([...circles, newCircle]);
  }
};

const handleAddMember = async (circleName, userId) => {
  console.log(`Attempting to add user "${userId}" to circle "${circleName}".`);

  // Reference to the specific circle member in the database
  const userRef = ref(database, `circles/${circleName}/members/${userId}`);

  try {
    // Add member to the database
    await set(userRef, true);
    console.log(`User "${userId}" successfully added to the database for circle "${circleName}".`);

    // Update the local state with the added member
    const updatedCircles = circles.map((circle) =>
      circle.name === circleName
        ? { ...circle, members: [...(circle.members || []), userId] }
        : circle
    );

    console.log("Updated circle data after adding member:", updatedCircles);

    setCircles(updatedCircles);
    alert(`User added to the "${circleName}" circle.`);
  } catch (error) {
    console.error("Error adding member to circle:", error);
    alert("Failed to add member. Please try again.");
  }
};


const handleCircleSelection = async (circleName) => {
  const membersRef = ref(database, `circles/${circleName}/members`);
  try {
    const snapshot = await get(membersRef);
    if (snapshot.exists()) {
      const members = Object.keys(snapshot.val());
      const updatedCircles = circles.map((circle) =>
        circle.name === circleName ? { ...circle, members } : circle
      );
      setCircles(updatedCircles);
    } else {
      console.log("No members found for this circle.");
    }
  } catch (error) {
    console.error("Error fetching circle members:", error);
  }
};


const handleInviteMember = (method, circleName) => {
  const message = `Hi! I've added you to my "${circleName}" circle on BlackApp. Join us here: https://example.com`;

  switch (method) {
    case 'email':
      window.location.href = `mailto:?subject=Join My Circle on BlackApp&body=${encodeURIComponent(message)}`;
      break;
    case 'sms':
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;
      break;
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      break;
    default:
      alert('Invalid invitation method.');
  }
};

const sendEmailInvite = (email) => {
  console.log(`Sending email invite to: ${email}`);
  alert(`Email invite sent to ${email}`);
};

const sendSmsInvite = (phoneNumber) => {
  console.log(`Sending SMS invite to: ${phoneNumber}`);
  alert(`SMS invite sent to ${phoneNumber}`);
};

const sendWhatsAppInvite = (phoneNumber) => {
  const message = encodeURIComponent(
    "Hey! Join me on this amazing platform: [Insert your app link here]"
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
  window.open(whatsappUrl, "_blank");
  alert(`WhatsApp invite sent to ${phoneNumber}`);
};

const generateCircleInsights = (circleName) => {
  const circle = circles.find((circle) => circle.name === circleName);

  if (!circle || !circle.members.length) {
    alert(`No members in the "${circleName}" circle to generate insights.`);
    return;
  }

// const fetchAiInsights = async (circleName) => {
 // const database = getDatabase();
 // const insightsRef = ref(database, `analytics/${circleName}`);
 // const snapshot = await get(insightsRef);
 // if (snapshot.exists()) {
   // setAiInsights((prev) => ({
     // ...prev,
     // [circleName]: snapshot.val(),
   // }));
 // } else {
   // console.log("No insights available for this circle.");
 // }
// };

  setSelectedCircleInsights(insights);
  console.log('Insights:', insights);
};

const renderOrbContent = () => {
  if (viewMode === 'AI') {
    return (
      <div>
        <h3>AI Insights</h3>
        <p>Most Engaged: {selectedCircleInsights?.mostEngaged || 'N/A'}</p>
        <p>Recent Interactions: {selectedCircleInsights?.recentInteractions.join(', ') || 'None'}</p>
        <p>Activity Score: {selectedCircleInsights?.activityScore.toFixed(2)}</p>
      </div>
    );
  } else if (viewMode === 'AR') {
    return (
      <div>
        <h3>AR Visualization</h3>
        <p>Dynamic 3D Orb Representing: {selectedCircle || 'All Circles'}</p>
        {/* Add AR rendering logic here */}
      </div>
    );
  }
};



const handleInviteExternal = (method, contact) => {
  if (method === 'email') {
    sendEmailInvite(contact); // Implement sendEmailInvite logic
  } else if (method === 'sms') {
    sendSmsInvite(contact); // Implement sendSmsInvite logic
  } else if (method === 'whatsapp') {
    sendWhatsAppInvite(contact); // Implement sendWhatsAppInvite logic
  }
};


const handleDeleteCircle = (circleName) => {
  if (window.confirm(`Are you sure you want to delete the circle "${circleName}"?`)) {
    setCircles(circles.filter((circle) => circle.name !== circleName));
  }
};

// const handleToggleView = () => {
 // setViewMode(viewMode === 'AI' ? 'AR' : 'AI');
// };

const handleInvite = (method) => {
  const circleName = selectedCircle;
  const message = `Hi! I've added you to my "${circleName}" circle on BlackApp. Join us here: https://example.com`;

  switch (method) {
    case 'email':
      window.location.href = `mailto:?subject=Join My Circle on BlackApp&body=${encodeURIComponent(message)}`;
      break;
    case 'sms':
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;
      break;
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      break;
    default:
      alert('Invalid invitation method');
  }
};

const openAddMemberModal = (circleId, members) => {
  setSelectedCircleId(circleId);
  setSelectedCircleMembers(members || []);
  setShowAddMember(true);
};

const handleMemberAdded = (newMember) => {
  // Fetch updated members from the database
  const db = getDatabase();
  const membersRef = ref(db, `circles/${selectedCircle}/members`);

  onValue(membersRef, (snapshot) => {
    const membersData = snapshot.val();
    if (membersData) {
      const updatedMembers = Object.keys(membersData).map((uid) => ({
        uid,
        ...membersData[uid],
      }));
      setMembers(updatedMembers); // Update state for carousel
    }
  });
};

const fetchCircleMembers = async (circleName, setCircleMembers) => {
  console.log(`Fetching members for circle: "${circleName}"`);
  if (!circleName) {
    console.error('Circle name is required to fetch members.');
    return;
  }

  try {
    const membersRef = ref(database, `circles/${circleName}/members`);
    const snapshot = await get(membersRef);

    if (snapshot.exists()) {
      const members = snapshot.val();
      console.log('Members retrieved successfully:', members);

      const memberDetailsPromises = Object.keys(members).map(async (uid) => {
        const userRef = child(ref(database, 'users'), uid);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          return { uid, displayName: userData.displayName || 'Unknown User' };
        } else {
          console.warn(`User with UID "${uid}" not found.`);
          return { uid, displayName: 'Unknown User' };
        }
      });

      const memberDetails = await Promise.all(memberDetailsPromises);
      setCircleMembers(memberDetails);
    } else {
      console.log('No members found for the circle.');
      setCircleMembers([]);
    }
  } catch (error) {
    console.error('Error fetching circle members:', error);
  }
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
<div className={`circle-section ${showExpanded ? "expanded" : ""}`}>
  {/* My Circle Orb */}
  <div
    className={`my-circle-container ${
      showExpanded === "circle" ? "takeover" : ""
    }`}
  >
    <div
      className="my-circle-orb pulsating"
      onClick={() => setShowExpanded("circle")}
    >
      <span>My Circle</span>
    </div>
    {showExpanded === "circle" && (
      <div className="expanded-circle-section">
        <button
          className="back-button"
          onClick={() => setShowExpanded(null)}
        >
          Back
        </button>
        <h3>My Circles</h3>
        <div className="expanded-rings">
          {circles.map((circle) => (
            <div
              key={circle.name}
              className="circle-ring"
              style={{ borderColor: circle.color }}
              onClick={() => {
                setSelectedCircle(circle.name);
                fetchCircleMembers(circle.name, setSelectedCircleMembers);
              }}
            >
              <span>{circle.name}</span>
            </div>
          ))}
          <button
            className="manage-circles-button"
            onClick={() => setSelectedCircle("manage")}
          >
            Manage Circles
          </button>
        </div>
      </div>
    )}
  </div>

  {/* AR Orb */}
  <div
    className={`ar-orb-container ${
      showExpanded === "orb" ? "takeover" : ""
    }`}
  >
    <div
      className="ar-orb pulsating"
      onClick={() => setShowExpanded("orb")}
    >
      <span className="orb-text">AR Orb</span>
    </div>
    {showExpanded === "orb" && (
      <div className="expanded-orb-section">
        <button
          className="back-button"
          onClick={() => setShowExpanded(null)}
        >
          Back
        </button>
        <h3>Futuristic AR Features</h3>
        <AROrb />
      </div>
    )}
  </div>
</div>
   

  {/* Selected Circle Details */}
  {selectedCircle && selectedCircle !== "manage" && (
    <div className="selected-circle">
      <button className="back-button" onClick={() => setSelectedCircle(null)}>
        Back to My Circle
      </button>
      <h3>{selectedCircle} Details</h3>
      {/* Members List */}
      <div className="circle-members">
        <h4>Members</h4>
        {selectedCircleMembers.length > 0 ? (
          <div className="carousel">
            {selectedCircleMembers.map((member) => (
              <div key={member.uid} className="carousel-item">
                {member.displayName}
              </div>
            ))}
          </div>
        ) : (
          <p>No members in this circle</p>
        )}
      </div>
    </div>
  )}

  {/* Manage Circles View */}
  {selectedCircle === "manage" && (
    <CircleManager
      circles={circles}
      onClose={() => setSelectedCircle(null)}
      onAddCircle={handleAddCircle}
      onDeleteCircle={handleDeleteCircle}
      onAddMember={handleAddMember}
      onInviteExternal={handleInviteExternal}
      platformUsers={platformUsers}
    />
  )}
</div>

<div className="invite-buttons">
  <button onClick={() => handleInvite('email')}>Invite via Email</button>
  <button onClick={() => handleInvite('sms')}>Invite via SMS</button>
  <button onClick={() => handleInvite('whatsapp')}>Invite via WhatsApp</button>
</div>



  <div className="brands-section">
    <h3>Your Brands</h3>
    <div className="brand-cards-container">
      {brands.map((brand) => (
        <div key={brand.brandId} className="brand-card" onClick={() => navigate(`/brand-management/${brand.brandId}`)}>
          <img src={brand.logoUrl || 'default-logo.png'} alt={brand.businessName} className="brand-logo" />
          <p>{brand.businessName}</p>
        </div>
      ))}
    </div>
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
  <label htmlFor="brandLogo" className="brand-logo-upload-label">
    Upload Logo
  </label>
  <input
    type="file"
    id="brandLogo"
    onChange={(e) => setBrandData({ ...brandData, logo: e.target.files[0] })}
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
              <button
  className="like-button"
  onClick={() => {
    likes[post.id]?.users?.[auth.currentUser?.uid]
      ? handleUnlike(post.id)
      : handleLike(post.id);
  }}
>
  <FaHeart />
  ({likes[post.id]?.count || 0})
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
  
);
};

export default Profile;

