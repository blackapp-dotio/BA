import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { database } from '../firebase';
import './BrandDetails.css';

const BrandDetails = () => {
    const { brandId } = useParams(); // Get brandId from the route
    const [brand, setBrand] = useState(null);

    useEffect(() => {
        const fetchBrandDetails = async () => {
            const brandRef = ref(database, `brands/${brandId}`);
            const snapshot = await get(brandRef);
            if (snapshot.exists()) {
                setBrand(snapshot.val());
            }
        };

        fetchBrandDetails();
    }, [brandId]);

    if (!brand) return <div>Loading...</div>;

    return (
        <div className="brand-details-container">
            <h1>{brand.businessName}</h1>
            <img src={brand.logoUrl} alt={brand.businessName} className="brand-logo-large" />
            <p>{brand.description}</p>
            <h3>Tools Available:</h3>
            <ul>
                {brand.tools.map((tool, index) => (
                    <li key={index}>
                        {tool}
                        {tool === 'Shop/Store' && <button>Visit Shop</button>}
                        {tool === 'Booking/Consult' && <button>Book an Appointment</button>}
                        {/* Add buttons for other tools */}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default BrandDetails;
