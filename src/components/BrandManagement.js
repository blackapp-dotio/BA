import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { database, auth } from '../firebaseconfig';
import { useParams, useNavigate } from 'react-router-dom';
import './BrandManagement.css';

const BrandManagement = () => {
    const { brandId } = useParams(); // Capture brandId from URL
    const [brandData, setBrandData] = useState({});
    const [isOwner, setIsOwner] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch brand data and check if the current user is the owner
        const fetchBrandData = async () => {
            const brandRef = ref(database, `brands/${brandId}`);
            onValue(brandRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setBrandData(data);

                    // Check if the current user is the owner of the brand
                    if (auth.currentUser?.uid === data.userId) {
                        setIsOwner(true);
                    }
                }
            });
        };

        fetchBrandData();
    }, [brandId]);

    // Navigate to specific tool management pages based on selection
    const handleToolNavigation = (tool) => {
        navigate(`/brand-management/${brandId}/${tool}`);
    };

    if (!isOwner) {
        return <div>You do not have permission to manage this brand.</div>;
    }

    return (
        <div className="brand-management-container">
            <h2>Manage Brand: {brandData.businessName}</h2>
            <div className="tools-management">
                <h3>Tools</h3>
                <button onClick={() => handleToolNavigation('shop')}>Manage Shop</button>
                <button onClick={() => handleToolNavigation('Services')}>Manage Services</button>
                <button onClick={() => handleToolNavigation('Consult')}>Manage Consulting</button>
                <button onClick={() => handleToolNavigation('Blog')}>Manage Blog</button>
                <button onClick={() => handleToolNavigation('Courses')}>Manage Courses</button>          
                {/* Add other tools as needed */}
            </div>
        </div>
    );
};

export default BrandManagement;
