import React, { useState, useEffect } from 'react';
import { ref, push, update, remove, onValue } from 'firebase/database';
import { database } from '../firebaseconfig';
import { calculatePlatformFee } from '../utils/feeUtils';
import './ToolStyles.css';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Helper function to handle media uploads
const handleMediaUpload = async (file, path) => {
  const storage = getStorage();
  const mediaRef = storageRef(storage, path);
  await uploadBytes(mediaRef, file);
  return await getDownloadURL(mediaRef);
};

const CoursesTool = ({ brandId }) => {
  const [Courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ name: '', price: '', description: '', image: null });

  useEffect(() => {
    const CoursesRef = ref(database, `brands/${brandId}/tools/Course/Courses`);
    onValue(CoursesRef, (snapshot) => {
      const data = snapshot.val();
      setCourses(data ? Object.values(data) : []);
    });
  }, [brandId]);

  const addOrUpdateCourse = async (CourseId = null) => {
    const CourseData = { ...newCourse };

    if (newCourse.image) {
      CourseData.imageUrl = await (newCourse.image, `brands/${brandId}/Course/images/${newCourse.image.name}`);
    }

    const CourseRef = ref(database, `brands/${brandId}/tools/Course/Courses/${CourseId || push(ref(database, `brands/${brandId}/tools/Course/Courses`)).key}`);
    await update(CourseRef, CourseData);
    setNewCourse({ name: '', price: '', description: '', image: null });
  };

  const handlePurchase = (price) => {
    const { platformFee, totalAmount } = calculatePlatformFee(price, 'purchase');
    alert(`Total Amount: $${totalAmount} (includes platform fee of $${platformFee})`);
  };

  return (
    <div className="tool-container">
      <h3>Courses</h3>
      <input type="text" placeholder="Course Name" value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} />
      <input type="number" placeholder="Course Price" value={newCourse.price} onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })} />
      <textarea placeholder="Course Description" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
      <input type="file" onChange={(e) => setCourses({ ...newCourse, image: e.target.files[0] })} />
      <button onClick={() => addOrUpdateCourse()} className="tool-button">Save Course</button>

      <h4>Existing Courses</h4>
      <ul>
        {Courses.map((Course) => (
          <li key={Course.id}>
            <p>{Course.name} - ${Course.price}</p>
            <p>{Course.description}</p>
            {Course.imageUrl && <img src={Course.imageUrl} alt={Course.name} />}
            <button onClick={() => setNewCourse(Course)}>Edit</button>
            <button onClick={() => handlePurchase(Course.price)}>Purchase</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CoursesTool;
