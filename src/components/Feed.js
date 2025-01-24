import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { ref, onValue, update, remove, push, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { Card, CardMedia, CardContent, CardActions, Typography, IconButton, Button, Modal, Box, TextField } from '@mui/material';
import { ThumbUp, Comment, Share, ExpandMore, Delete } from '@mui/icons-material';
import { database } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './Feed.css';
import './Post.css';
import crypto from 'crypto';
import {
    Avatar,
} from '@mui/material';


const Feed = () => {
    const [feedContent, setFeedContent] = useState([]);
    const [likes, setLikes] = useState({});
    const [comments, setComments] = useState({});
    const [expanded, setExpanded] = useState({});
    const [commentingIndex, setCommentingIndex] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [posting, setPosting] = useState(false);
    const [newPost, setNewPost] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [expandedComments, setExpandedComments] = useState({});
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const auth = getAuth();

    const proxyUrl = 'https://us-central1-wakandan-app.cloudfunctions.net/api/proxy?url=';
    
    const getProxiedImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    return `${proxyUrl}${encodeURIComponent(imageUrl)}`;
};

    const [loadingMore, setLoadingMore] = useState(false);
    const [startIndex, setStartIndex] = useState(0);
    const itemsPerPage = 5;

    const RSS_FEED_URLS = [
        'https://rss.app/feeds/hXAXAKLk6J0sbRX0.xml',
        'https://rss.app/feeds/a0BC3EgcQ2gi6jt9.xml',
        'https://rss.app/feeds/MDlghVUX5yvecvRG.xml',
        'https://www.pulse.ng/entertainment/rss',
        'https://www.theafricanmirror.africa/arts-and-entertainment/feed/',
        'https://www.africanexponent.com/rss/entertainment',
        'https://www.okayafrica.com/music/rss/',
        'https://celebrity.nine.com.au/rss',
        'https://www.allabouttrh.com/feed/',
        'https://bckonline.com/feed/',
        'https://balleralert.com/feed/',
        'https://rss.app/feeds/nsmT2WdQXSlshmcy.xml',
        'https://rss.app/feeds/XqrrnyuiP2E5gvZY.xml',
        'https://rss.app/feeds/Vgjdsm6FBHT3mj4G.xml',
        'https://www.buzzfeed.com/celebrity.xml',
        'https://rss.app/feeds/3zTVOBAND5ezpD5g.xml',
        'https://sahiphopmag.co.za/feed/',
        'https://naijavibes.com/feed/',
        'https://tooxclusive.com/feed/',
        'https://theshaderoom.com/latest-tea/feed/',
        'https://www.ghanacelebrities.com/feed/',
        'https://theblackmedia.org/feed/',
        'https://afro.com/section/arts-entertainment/feed/',
        'https://globalgrind.com/category/entertainment/feed/',
        'https://www.thesouthafrican.com/culture/entertainment/',
        'https://rss.app/feeds/keM7mXLp4OlutaGg.xml',
        'https://rss.app/feeds/KwsTlmbvwXiY4YX6.xml',
        'https://rss.app/feeds/fQ6cY8V57Sk5ayox.xml',
    ];

    // Throttle scroll event handler
    function throttle(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = new Date().getTime();
            if (now - lastCall < delay) {
                return;
            }
            lastCall = now;
            return func(...args);
        };
    }

    // Generate a unique ID for each item
    const generateUniqueId = (item) => {
        const link = item.link || '';
        const title = item.title || '';
        const dataToHash = link + title;

        if (typeof dataToHash !== 'string' || dataToHash.trim() === '') {
            console.error("Invalid data for generating unique ID:", item);
            return '';
        }

        return crypto.createHash('md5').update(dataToHash).digest('hex');
    };

    // Handle scroll event for lazy loading
    const handleScroll = () => {
        if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 50) {
            loadMoreRSSFeeds();
        }
    };

    useEffect(() => {
        const handleScrollThrottled = throttle(handleScroll, 500);
        window.addEventListener('scroll', handleScrollThrottled);

        return () => {
            window.removeEventListener('scroll', handleScrollThrottled);
        };
    }, [startIndex]);

    const CACHE_EXPIRATION_TIME = 5 * 60 * 1000; // Reduced caching for fresher content

    const fetchRSSFeeds = useCallback(async () => {
        const cachedFeeds = JSON.parse(localStorage.getItem('cachedFeeds'));
        const cacheTimestamp = localStorage.getItem('cacheTimestamp');
        const now = new Date().getTime();
        let allRssItems = [];

        if (cachedFeeds && cacheTimestamp && (now - cacheTimestamp < CACHE_EXPIRATION_TIME)) {
            allRssItems = cachedFeeds;
        } else {
            for (const url of RSS_FEED_URLS) {
                try {
                    const response = await axios.get(`${proxyUrl}${encodeURIComponent(url)}`);
                    const rssItems = parseRSSFeed(response.data);
                    allRssItems.push(...rssItems.slice(0, 3));
                } catch (error) {
                    console.error(`Failed to fetch RSS feed from ${url}:`, error.message);
                }
            }
            localStorage.setItem('cachedFeeds', JSON.stringify(allRssItems));
            localStorage.setItem('cacheTimestamp', now);
        }

        return deduplicateFeeds(allRssItems).filter(item => item.image);
    }, []);

    const deduplicateFeeds = (items) => {
        const uniqueItemsMap = new Map();
        items.forEach(item => {
            const uniqueId = generateUniqueId(item);
            if (!uniqueItemsMap.has(uniqueId)) {
                uniqueItemsMap.set(uniqueId, item);
            }
        });
        return Array.from(uniqueItemsMap.values());
    };

    const loadMoreRSSFeeds = async () => {
        if (loadingMore) return;

        setLoadingMore(true);
        const rssContent = await fetchRSSFeeds();

        const newItems = rssContent.slice(startIndex, startIndex + itemsPerPage);
        setFeedContent((prevContent) => deduplicateFeeds([...prevContent, ...newItems]));
        setStartIndex(startIndex + itemsPerPage);
        setLoadingMore(false);
    };

    
    useEffect(() => {
        const fetchContent = async () => {
        
        const cachedFeed = JSON.parse(localStorage.getItem('feedContent'));
        if (cachedFeed) {
            setFeedContent(cachedFeed); // Show cached content immediately
        }
        
            try {
                const rssContent = await fetchRSSFeeds();
                const userPosts = await fetchUserPosts();
                const combinedContent = interweavePosts(userPosts, rssContent);
                setFeedContent(combinedContent);

                const likesRef = ref(database, 'likes');
                onValue(likesRef, (snapshot) => {
                    const likesData = snapshot.val();
                    if (likesData) {
                        setLikes(likesData);
                    }
                });

                const commentsRef = ref(database, 'comments');
                onValue(commentsRef, (snapshot) => {
                    const commentsData = snapshot.val();
                    setComments(commentsData);
                });
            } catch (error) {
                console.error('Error fetching feed content:', error);
            }
        };

        fetchContent();

        const interval = setInterval(fetchContent, 60000);
        return () => clearInterval(interval);
    }, [user, fetchRSSFeeds]);

    const parseRSSFeed = (rssData) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rssData, 'application/xml');
        const items = xmlDoc.getElementsByTagName('item');
        const rssItems = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const title = item.getElementsByTagName('title')[0].textContent;
            const link = item.getElementsByTagName('link')[0].textContent;
            const imageUrl = item.getElementsByTagName('media:content')[0]?.getAttribute('url') || '';

            rssItems.push({
                id: generateUniqueId({ link, title }),
                title,
                link,
                image: imageUrl,
                type: 'rss'
            });
        }

        return rssItems;
    };
    
    const updateCacheWithFreshData = async () => {
    try {
        const rssContent = await fetchRSSFeeds();
        const userPosts = await fetchUserPosts();
        const combinedContent = interweavePosts(userPosts, rssContent);

        setFeedContent(combinedContent);
        localStorage.setItem('feedContent', JSON.stringify(combinedContent));
    } catch (error) {
        console.error('Error updating cache with fresh data:', error);
    }
};


    const fetchUserPosts = () => {
        return new Promise((resolve) => {
            const userPostsRef = ref(database, 'feed');
            onValue(userPostsRef, async (snapshot) => {
                const userPosts = snapshot.val();
                if (userPosts) {
                    const postsWithUserInfo = await Promise.all(Object.values(userPosts).map(async post => {
                        const userRef = ref(database, `users/${post.userId}`);
                        const userSnapshot = await get(userRef);
                        const userData = userSnapshot.exists() ? userSnapshot.val() : { displayName: 'Unknown' };
                        return {
                            ...post,
                            displayName: userData.displayName,
                            type: 'user',
                        };
                    }));
                    resolve(postsWithUserInfo.reverse());
                } else {
                    resolve([]);
                }
            });
        });
    };

    const interweavePosts = (userPosts, rssContent) => {
        const combinedContent = [];
        let userIndex = 0;
        let rssIndex = 0;

        while (userIndex < userPosts.length || rssIndex < rssContent.length) {
            if (userIndex < userPosts.length) {
                combinedContent.push(userPosts[userIndex]);
                userIndex++;
            }
            if (rssIndex < rssContent.length) {
                combinedContent.push(rssContent[rssIndex]);
                rssIndex++;
            }
        }

        return combinedContent;
    };

 const handleLike = async (postId) => {
  if (user) {
    const postLikeRef = ref(database, `likes/${postId}`);
    const userLikeRef = ref(database, `likes/${postId}/users/${user.uid}`);
    
    // Check if user already liked the post
    const userSnapshot = await get(userLikeRef);
    if (userSnapshot.exists()) {
      alert("You've already liked this post!");
      return;
    }

    // Get current likes count
    const snapshot = await get(postLikeRef);
    const currentLikes = snapshot.exists() && typeof snapshot.val().count === 'number'
      ? snapshot.val().count
      : 0;

    const newLikes = currentLikes + 1;

    // Update the like count and add the user ID
    await update(postLikeRef, {
      count: newLikes,
      [`users/${user.uid}`]: true,
    });

    // Update local state
    setLikes((prevLikes) => ({
      ...prevLikes,
      [postId]: {
        ...prevLikes[postId],
        count: newLikes,
      },
    }));
  } else {
    navigate('/login');
  }
};

    const handleShare = (index) => {
        const shareData = {
            title: 'Check out this post!',
            text: 'Have a look at this post on BlackApp.',
            url: `${window.location.origin}/post/${index}`,
        };

        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareData.url).then(() => {
                alert('Post link copied to clipboard!');
            }).catch(console.error);
        }
    };

    const handleExpandClick = (id) => {
        setExpanded((prevExpanded) => ({
            ...prevExpanded,
            [id]: !prevExpanded[id],
        }));
    };

    const handleOpenCommentModal = (id) => {
        if (user) {
            setCommentingIndex(id);
            setExpanded((prevExpanded) => ({
                ...prevExpanded,
                [id]: true,
            }));
            setExpandedComments((prevExpandedComments) => ({
                ...prevExpandedComments,
                [id]: true,
            }));
        } else {
            navigate('/login');
        }
    };

    const handleCloseCommentModal = () => {
        setCommentingIndex(null);
        setNewComment('');
    };

    const handleAddComment = async (postId) => {
        if (newComment.trim() && user) {
            const userRef = ref(database, `users/${user.uid}`);
            const snapshot = await get(userRef);
            let displayName = 'Anonymous';

            if (snapshot.exists()) {
                const userData = snapshot.val();
                displayName = userData.displayName || 'Anonymous';
            }

            const commentData = {
                text: newComment.trim(),
                user: displayName,
                userId: user.uid,
                timestamp: new Date().getTime(),
            };

            const commentRef = ref(database, `comments/${postId}`);
            push(commentRef, commentData);

            handleCloseCommentModal();
        } else if (!user) {
            navigate('/login');
        }
    };

    const handleDeletePost = async (postId) => {
        if (user) {
            await remove(ref(database, `feed/${postId}`));
            setFeedContent((prevFeedContent) => prevFeedContent.filter(post => post.id !== postId));
        } else {
            navigate('/login');
        }
    };

const handleAddPost = async () => {
    if ((newPost.trim() || mediaFile) && user) {
        const postId = push(ref(database, 'feed')).key;

        let mediaUrl = '';
        if (mediaFile) {
            const storage = getStorage();
            const mediaStorageRef = storageRef(storage, `posts/${postId}/${mediaFile.name}`);
            await uploadBytes(mediaStorageRef, mediaFile);
            mediaUrl = await getDownloadURL(mediaStorageRef);
        }

        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);

        let displayName = 'Anonymous';
        let profilePicture = ''; // Default to an empty string if no picture is available

        if (snapshot.exists()) {
            const userData = snapshot.val();
            displayName = userData.displayName || 'Anonymous';
            profilePicture = userData.profilePicture || ''; // Fetch the profile picture URL
        }

        const post = {
            id: postId,
            userId: user.uid,
            displayName: displayName,
            profilePicture: profilePicture, // Include the profile picture in the post
            text: newPost,
            mediaUrl,
            timestamp: new Date().getTime(),
        };

        const updates = {};
        updates[`/feed/${postId}`] = post;

        await update(ref(database), updates);

        setNewPost('');
        setMediaFile(null);
        handleClosePostModal();
    } else {
        navigate('/login');
    }
};

    const handleClosePostModal = () => {
        setPosting(false);
        setNewPost('');
        setMediaFile(null);
    };

    const renderComments = (postId) => {
        const postComments = comments[postId] || [];
        return (
            <div className="comments-section">
                {Object.values(postComments).map((comment, i) => (
                    <div key={i} className="comment">
                        <Typography variant="body2" color="text.secondary">
                            <strong>{comment.user}:</strong> {comment.text}
                        </Typography>
                    </div>
                ))}
            </div>
        );
    };

const renderFeedItem = (item) => {
    const isBrandOrProduct = item.type === 'shop' || item.type === 'blog' || item.type === 'booking' || item.type === 'services';

    return (
        <Card key={item.id} className="feed-item" id={`content-${item.id}`}>
            {/* User/Brand Name or RSS Feed Title */}
            <Typography
                variant="h6"
                component="span"
                onClick={() => navigate(`/user/${item.userId}`)}
                className="profile-name"
            >
                {item.type === 'rss' ? item.title : item.displayName}
            </Typography>
            
            {/* Image handling for both RSS Feeds and Brands/Products */}
            {item.imageUrl ? (
                <a href={item.link || '#'} target="_blank" rel="noopener noreferrer">
                    <CardMedia
                        component="img"
                        alt={item.title || item.displayName}
                        image={getProxiedImageUrl(item.image || item.imageUrl)}
                        className="feed-item-image"
                    />
                </a>
            ) : (
                item.image && (
                    <CardMedia
                        component="img"
                        alt={item.title || item.displayName}
                        image={item.image}
                        className="feed-item-image"
                    />
                )
            )}

            {/* Description/Text Content */}
            <CardContent>
                {item.type !== 'rss' && (
                    <Typography variant="body2" color="text.secondary">
                        {item.text}
                    </Typography>
                )}
                {/* Add clickable link for RSS Feeds or brand links */}
                {item.link && (
                    <Typography variant="body2" color="primary">
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                            View more
                        </a>
                    </Typography>
                )}
            </CardContent>

            {/* Expandable Comments Section */}
            {expanded[item.id] && (
                <CardContent>
                    {expandedComments[item.id] && renderComments(item.id)}
                </CardContent>
            )}

            {/* Action Buttons */}
            <CardActions>
                <IconButton onClick={() => handleLike(item.id)} aria-label="Like">
                    <ThumbUp />
                    {likes[item.id]?.count || 0}
                </IconButton>
                <IconButton onClick={() => handleOpenCommentModal(item.id)} aria-label="comment">
                    <Comment /> {comments[item.id] ? Object.keys(comments[item.id]).length : 0}
                </IconButton>
                <IconButton onClick={() => handleShare(item.id)} aria-label="share">
                    <Share />
                </IconButton>
                {item.type === 'rss' && (
                    <IconButton onClick={() => handleExpandClick(item.id)} aria-label="expand">
                        <ExpandMore />
                    </IconButton>
                )}
                {item.userId === user?.uid && (
                    <IconButton onClick={() => handleDeletePost(item.id)} aria-label="delete">
                        <Delete />
                    </IconButton>
                )}
            </CardActions>
        </Card>
    );
};
    return (
        <div className="feed">
            {user && (
                <Card className="post-creation-card">
                    <CardContent>
                        <Typography variant="h6">Create a Post</Typography>
                        <div className="form-body">
                            <TextField
                                label="What's the gist?"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                            />
                            <input type="file" onChange={(e) => setMediaFile(e.target.files[0])} />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAddPost}
                                disabled={posting}
                            >
                                {posting ? 'Posting...' : 'Post'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
            
                <div className="feed">
        {feedContent.length > 0 ? (
            feedContent.map((item) => renderFeedItem(item))
        ) : (
            <Typography variant="h6">Loading feed...</Typography> // Placeholder for no cached content
        )}
        {loadingMore && <Typography variant="h6">Loading more content...</Typography>}
    </div>
            
            {feedContent.map((item) => renderFeedItem(item))}
            {loadingMore && <Typography variant="h6">Loading more content...</Typography>}
            <Modal
                open={commentingIndex !== null}
                onClose={handleCloseCommentModal}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
            >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
                    <Typography variant="h6" component="h2">
                        Add a Comment
                    </Typography>
                    <TextField
                        label="Comment"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button variant="contained" color="primary" onClick={() => handleAddComment(commentingIndex)}>
                        Add Comment
                    </Button>
                </Box>
            </Modal>
        </div>
      
    );
};

export default Feed;
