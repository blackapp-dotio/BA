import React, { useState, useEffect } from 'react';
import { ref, push, update, remove, onValue } from 'firebase/database';
import { database } from '../firebaseconfig';
import './ToolStyles.css';

const BlogTool = ({ brandId }) => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  useEffect(() => {
    const postsRef = ref(database, `brands/${brandId}/tools/blog/posts`);
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      setPosts(data ? Object.values(data) : []);
    });
  }, [brandId]);

  const addPost = async () => {
    const postId = push(ref(database, `brands/${brandId}/tools/blog/posts`)).key;
    await update(ref(database, `brands/${brandId}/tools/blog/posts/${postId}`), { ...newPost, id: postId });
    setNewPost({ title: '', content: '' });
  };

  const deletePost = async (postId) => {
    await remove(ref(database, `brands/${brandId}/tools/blog/posts/${postId}`));
  };

  return (
    <div className="tool-container">
      <h3>Blog Posts</h3>
      <input
        type="text"
        placeholder="Post Title"
        value={newPost.title}
        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
        className="tool-input"
      />
      <textarea
        placeholder="Post Content"
        value={newPost.content}
        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
        className="tool-textarea"
      />
      <button onClick={addPost} className="tool-button">Add Post</button>

      <h4>Existing Posts</h4>
      <ul className="tool-list">
        {posts.map((post) => (
          <li key={post.id} className="tool-list-item">
            <p>{post.title}</p>
            <p>{post.content}</p>
            <button onClick={() => deletePost(post.id)} className="tool-delete-button">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlogTool;
