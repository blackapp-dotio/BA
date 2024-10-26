// Blog.js
import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove, get } from 'firebase/database'; // Added `get` import
import { useParams } from 'react-router-dom';
import { database, auth } from '../firebaseconfig';
import './Blog.css';
import './styles/buttons.css'; // Import global button styles

const Blog = () => {
  const { brandId } = useParams();
  const [blogs, setBlogs] = useState([]);
  const [newBlog, setNewBlog] = useState({ title: '', content: '', imageUrl: '' });
  const [editingBlog, setEditingBlog] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Handle publishing/unpublishing the brand
  const handlePublish = async () => {
    const brandRef = ref(database, `brands/${brandId}`);
    const snapshot = await get(brandRef);

    if (snapshot.exists()) {
      const brandData = snapshot.val();
      const updatedStatus = !brandData.isPublished;

      // Update the brand's published status in Firebase
      await update(brandRef, { isPublished: updatedStatus });

      alert(`Brand has been ${updatedStatus ? 'published' : 'unpublished'} successfully!`);
      setIsPublished(updatedStatus); // Update local state to reflect the change
    } else {
      alert('Brand not found. Please try again.');
    }
  };

  // Check if the current user is the brand owner
  useEffect(() => {
    if (brandId) {
      const brandRef = ref(database, `brands/${brandId}`);
      onValue(brandRef, (snapshot) => {
        if (snapshot.exists()) {
          const brandData = snapshot.val();
          setIsOwner(brandData.userId === auth.currentUser?.uid);
          setIsPublished(brandData.isPublished || false); // Set initial publish status
        }
      });
    }
  }, [brandId]);

  // Fetch blogs for the brand
  useEffect(() => {
    if (brandId) {
      const blogsRef = ref(database, `brands/${brandId}/blogs`);
      onValue(blogsRef, (snapshot) => {
        if (snapshot.exists()) {
          setBlogs(Object.values(snapshot.val()));
        }
      });
    }
  }, [brandId]);

  // Handle adding a new blog post
  const handleAddBlog = async () => {
    if (!newBlog.title || !newBlog.content) {
      alert('Please fill in all required fields.');
      return;
    }

    const blogId = push(ref(database, `brands/${brandId}/blogs`)).key;
    const blog = { id: blogId, ...newBlog };

    await update(ref(database, `brands/${brandId}/blogs/${blogId}`), blog);
    setBlogs([...blogs, blog]);
    setNewBlog({ title: '', content: '', imageUrl: '' });
  };

  // Handle editing an existing blog post
  const handleEditBlog = (blog) => {
    setEditingBlog(blog);
    setNewBlog(blog);
  };

  // Handle updating a blog post
  const handleUpdateBlog = async () => {
    if (editingBlog) {
      await update(ref(database, `brands/${brandId}/blogs/${editingBlog.id}`), newBlog);
      setBlogs(blogs.map((b) => (b.id === editingBlog.id ? newBlog : b)));
      setNewBlog({ title: '', content: '', imageUrl: '' });
      setEditingBlog(null);
    }
  };

  // Handle deleting a blog post
  const handleDeleteBlog = async (blogId) => {
    await remove(ref(database, `brands/${brandId}/blogs/${blogId}`));
    setBlogs(blogs.filter((blog) => blog.id !== blogId));
  };

  return (
    <div className="blog-container">
      <h2>{isOwner ? 'Manage Your Blog' : 'Blog'}</h2>
      
      {/* Publish/Unpublish button */}
      {isOwner && (
        <button className="button" onClick={handlePublish}>
          {isPublished ? 'Unpublish' : 'Publish'} Blog
        </button>
      )}

      {isOwner && (
        <div className="blog-management-container">
          <h3>{editingBlog ? 'Edit Blog Post' : 'Add New Blog Post'}</h3>
          <input
            type="text"
            placeholder="Blog Title"
            value={newBlog.title}
            onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
          />
          <textarea
            placeholder="Blog Content"
            value={newBlog.content}
            onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
          />
          <input
            type="text"
            placeholder="Image URL (optional)"
            value={newBlog.imageUrl}
            onChange={(e) => setNewBlog({ ...newBlog, imageUrl: e.target.value })}
          />
          <button className="button" onClick={editingBlog ? handleUpdateBlog : handleAddBlog}>
            {editingBlog ? 'Update Blog' : 'Add Blog'}
          </button>
        </div>
      )}

      <div className="blogs-list">
        <h3>{blogs.length > 0 ? 'Available Blogs' : 'No blogs available'}</h3>
        <div className="blogs-grid">
          {blogs.map((blog) => (
            <div key={blog.id} className="blog-card">
              <img src={blog.imageUrl || 'https://via.placeholder.com/150'} alt={blog.title} />
              <h4>{blog.title}</h4>
              <p>{blog.content}</p>
              {isOwner && (
                <div className="blog-actions">
                  <button className="button" onClick={() => handleEditBlog(blog)}>
                    Edit
                  </button>
                  <button className="button" onClick={() => handleDeleteBlog(blog.id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
