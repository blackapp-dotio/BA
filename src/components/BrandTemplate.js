// BrandTemplate.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseconfig';
import './BrandTemplate.css'; // Ensure your styling file is correctly imported

const BrandTemplate = () => {
  const { brandId } = useParams(); // Capture brandId from URL
  const [brandData, setBrandData] = useState({});
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    if (brandId) {
      // Fetch brand data
      const brandRef = ref(database, `brands/${brandId}`);
      onValue(brandRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setBrandData(data);

          // Fetch and set content based on activated tools
          if (data.tools?.includes('Services')) {
            fetchServices(brandId);
          }
          if (data.tools?.includes('Shop/Store')) {
            fetchProducts(brandId);
          }
          if (data.tools?.includes('Blog')) {
            fetchBlogs(brandId);
          }
          if (data.tools?.includes('Courses')) {
            fetchCourses(brandId);
          }
          if (data.tools?.includes('Booking/Consult')) {
            fetchConsultations(brandId);
          }
        }
      });
    }
  }, [brandId]);

  // Fetch brand services
  const fetchServices = (brandId) => {
    const servicesRef = ref(database, `brands/${brandId}/services`);
    onValue(servicesRef, (snapshot) => {
      if (snapshot.exists()) {
        setServices(Object.values(snapshot.val()));
      }
    });
  };

  // Fetch brand products
  const fetchProducts = (brandId) => {
    const productsRef = ref(database, `brands/${brandId}/products`);
    onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        setProducts(Object.values(snapshot.val()));
      }
    });
  };

  // Fetch brand courses
  const fetchCourses = (brandId) => {
    const coursesRef = ref(database, `brands/${brandId}/courses`);
    onValue(coursesRef, (snapshot) => {
      if (snapshot.exists()) {
        setCourses(Object.values(snapshot.val()));
      }
    });
  };

  // Fetch brand blogs
  const fetchBlogs = (brandId) => {
    const blogsRef = ref(database, `brands/${brandId}/blogs`);
    onValue(blogsRef, (snapshot) => {
      if (snapshot.exists()) {
        setBlogs(Object.values(snapshot.val()));
      }
    });
  };

  // Fetch brand consultations
  const fetchConsultations = (brandId) => {
    const consultationsRef = ref(database, `brands/${brandId}/consultations`);
    onValue(consultationsRef, (snapshot) => {
      if (snapshot.exists()) {
        setConsultations(Object.values(snapshot.val()));
      }
    });
  };

  return (
    <div className="brand-template-container">
      <h1>{brandData.businessName}</h1>
      <p>{brandData.description}</p>

      {/* Display Brand Services */}
      {services.length > 0 && (
        <div className="brand-services">
          <h2>Services</h2>
          {services.map((service) => (
            <div key={service.id} className="service-card">
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <p>Price: ${parseFloat(service.price).toFixed(2)} AGMoney</p>
            </div>
          ))}
        </div>
      )}

      {/* Display Brand Products */}
      {products.length > 0 && (
        <div className="brand-products">
          <h2>Products</h2>
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p>Price: ${parseFloat(product.price).toFixed(2)} AGMoney</p>
            </div>
          ))}
        </div>
      )}

      {/* Display Brand Courses */}
      {courses.length > 0 && (
        <div className="brand-courses">
          <h2>Courses</h2>
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <p>Price: ${parseFloat(course.price).toFixed(2)} AGMoney</p>
            </div>
          ))}
        </div>
      )}

      {/* Display Brand Blogs */}
      {blogs.length > 0 && (
        <div className="brand-blogs">
          <h2>Blogs</h2>
          {blogs.map((blog) => (
            <div key={blog.id} className="blog-card">
              <h3>{blog.title}</h3>
              <p>{blog.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Display Brand Consultations */}
      {consultations.length > 0 && (
        <div className="brand-consultations">
          <h2>Consultations</h2>
          {consultations.map((consultation) => (
            <div key={consultation.id} className="consultation-card">
              <h3>{consultation.title}</h3>
              <p>{consultation.description}</p>
              <p>Duration: {consultation.duration}</p>
              <p>Price: ${parseFloat(consultation.price).toFixed(2)} AGMoney</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandTemplate;
