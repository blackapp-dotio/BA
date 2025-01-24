import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseconfig';
import { useNavigate } from 'react-router-dom';
import './Explore.css';

const Explore = () => {
  const [brands, setBrands] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const brandsRef = ref(database, 'brands');
    onValue(brandsRef, (snapshot) => {
      const data = snapshot.val();
      const approvedBrands = Object.values(data || {}).filter(
        (brand) => brand.status === 'approved' && brand.isPublished
      );
      setBrands(approvedBrands);
    });
  }, []);

  return (
    <div className="explore-container">
      <h2>Explore Brands</h2>
      <div className="brands-grid">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="brand-card"
            onClick={() => navigate(`/brand/${brand.businessName}`)}
          >
            <img src={brand.logoUrl} alt={brand.businessName} className="brand-logo" />
            <h3>{brand.businessName}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;
