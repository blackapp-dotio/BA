// Explore.js
import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseconfig'; // Ensure correct import path for firebaseconfig
import { useNavigate } from 'react-router-dom';
import './Explore.css';

function Explore() {
  const [brands, setBrands] = useState([]);
  const [publishedServices, setPublishedServices] = useState([]);
  const categories = [
    'Technology',
    'Fashion',
    'Food & Drink',
    'Music',
    'Health & Fitness',
    'Education',
    'Travel',
  ];

  useEffect(() => {
    // Fetch all approved and published brands
    const fetchBrands = () => {
      const brandsRef = ref(database, 'brands');
      onValue(brandsRef, (snapshot) => {
        if (snapshot.exists()) {
          const allBrands = Object.values(snapshot.val());
          const approvedAndPublishedBrands = allBrands.filter(
            (brand) => brand.status === 'approved' && brand.isPublished
          );
          setBrands(approvedAndPublishedBrands);
        }
      });
    };

    // Fetch all published services
    const fetchPublishedServices = () => {
      const servicesRef = ref(database, 'brands');
      onValue(servicesRef, (snapshot) => {
        if (snapshot.exists()) {
          const allBrands = snapshot.val();
          const allServices = [];

          // Iterate over all brands to get published services
          Object.keys(allBrands).forEach((brandId) => {
            const brand = allBrands[brandId];
            if (brand.services) {
              Object.values(brand.services).forEach((service) => {
                if (brand.isPublished && service) {
                  allServices.push({ ...service, brandName: brand.businessName });
                }
              });
            }
          });

          setPublishedServices(allServices);
        }
      });
    };

    fetchBrands();
    fetchPublishedServices();
  }, []);

  const navigate = useNavigate();

  const filteredBrands = (category) => {
    return brands.filter((brand) => brand.category === category);
  };

  return (
    <div className="explore-container">
      <h2>Explore Categories</h2>
      <div className="categories-list">
        {categories.map((category, index) => (
          <div key={index} className="category-item">
            <h3>{category}</h3>
            <div className="brands-list">
              {filteredBrands(category).map((brand) => (
                <div
                  key={brand.id}
                  className="brand-item"
                  onClick={() => navigate(`/brand/${brand.id}`)}
                >
                  <img src={brand.logoUrl} alt={brand.businessName} className="brand-logo" />
                  <p>{brand.businessName}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Display Published Services */}
      <div className="published-services-section">
        <h2>Published Services</h2>
        <div className="services-list">
          {publishedServices.length > 0 ? (
            publishedServices.map((service, index) => (
              <div key={index} className="service-item">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                {/* Safely check and convert service.price to number before displaying */}
                <p>
                  Price: $
                  {service.price && !isNaN(Number(service.price))
                    ? Number(service.price).toFixed(2)
                    : '0.00'}{' '}
                  AGMoney
                </p>
                <p>Brand: {service.brandName}</p>
              </div>
            ))
          ) : (
            <p>No services available at the moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Explore;
