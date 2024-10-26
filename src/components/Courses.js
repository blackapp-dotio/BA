// Courses.js
import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove, get } from 'firebase/database';
import { useParams } from 'react-router-dom';
import { database, auth } from '../firebaseconfig';
import './Courses.css';
import './styles/buttons.css'; // Import global button styles

const Courses = () => {
  const { brandId } = useParams();
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', price: '', imageUrl: '' });
  const [editingCourse, setEditingCourse] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Handle publishing or unpublishing the brand courses
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

  // Fetch brand and courses data and check ownership
  useEffect(() => {
    if (brandId) {
      const brandRef = ref(database, `brands/${brandId}`);
      onValue(brandRef, (snapshot) => {
        if (snapshot.exists()) {
          const brand = snapshot.val();
          setIsOwner(brand.userId === auth.currentUser?.uid);
          setIsPublished(brand.isPublished || false); // Set initial publish status
        }
      });

      const coursesRef = ref(database, `brands/${brandId}/courses`);
      onValue(coursesRef, (snapshot) => {
        if (snapshot.exists()) {
          setCourses(Object.values(snapshot.val()));
        } else {
          setCourses([]);
        }
      });
    }
  }, [brandId]);

  // Handle adding a new course
  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.price) {
      alert('Please fill in all required fields.');
      return;
    }

    const courseId = push(ref(database, `brands/${brandId}/courses`)).key;
    const course = { id: courseId, ...newCourse, price: parseFloat(newCourse.price) };

    await update(ref(database, `brands/${brandId}/courses/${courseId}`), course);
    setCourses([...courses, course]);
    setNewCourse({ title: '', description: '', price: '', imageUrl: '' });
  };

  // Handle editing a course
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setNewCourse(course);
  };

  // Handle updating a course
  const handleUpdateCourse = async () => {
    if (editingCourse) {
      await update(ref(database, `brands/${brandId}/courses/${editingCourse.id}`), newCourse);
      setCourses(courses.map((c) => (c.id === editingCourse.id ? newCourse : c)));
      setNewCourse({ title: '', description: '', price: '', imageUrl: '' });
      setEditingCourse(null);
    }
  };

  // Handle deleting a course
  const handleDeleteCourse = async (courseId) => {
    await remove(ref(database, `brands/${brandId}/courses/${courseId}`));
    setCourses(courses.filter((course) => course.id !== courseId));
  };

  return (
    <div className="courses-container">
      <h2>{isOwner ? 'Manage Your Courses' : 'Courses'}</h2>
      {isOwner && (
        <div className="course-management-container">
          <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
          <input
            type="text"
            placeholder="Course Title"
            value={newCourse.title}
            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
          />
          <textarea
            placeholder="Course Description"
            value={newCourse.description}
            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price in AGMoney"
            value={newCourse.price}
            onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
          />
          <input
            type="text"
            placeholder="Image URL (optional)"
            value={newCourse.imageUrl}
            onChange={(e) => setNewCourse({ ...newCourse, imageUrl: e.target.value })}
          />
          <button className="add-course-button" onClick={editingCourse ? handleUpdateCourse : handleAddCourse}>
            {editingCourse ? 'Update Course' : 'Add Course'}
          </button>
          <button className="publish-button" onClick={handlePublish}>
            {isPublished ? 'Unpublish Courses' : 'Publish Courses'}
          </button>
        </div>
      )}

      <div className="courses-list">
        <h3>{courses.length > 0 ? 'Available Courses' : 'No courses available'}</h3>
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <img src={course.imageUrl || 'https://via.placeholder.com/150'} alt={course.title} />
              <h4>{course.title}</h4>
              <p>{course.description}</p>
              <p>Price: ${course.price.toFixed(2)} AGMoney</p>
              {isOwner && (
                <div className="course-actions">
                  <button className="edit-button" onClick={() => handleEditCourse(course)}>
                    Edit
                  </button>
                  <button className="delete-button" onClick={() => handleDeleteCourse(course.id)}>
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

export default Courses;
