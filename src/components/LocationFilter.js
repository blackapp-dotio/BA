import React, { useState } from 'react';
import './LocationFilter.css';

const LocationFilter = ({ setLocationFilter }) => {
    const [location, setLocation] = useState('');

    const handleLocationChange = (e) => {
        setLocation(e.target.value);
        setLocationFilter(e.target.value);
    };

    return (
        <div className="location-filter">
            <input
                type="text"
                placeholder="Filter by location (e.g., city, country)"
                value={location}
                onChange={handleLocationChange}
                className="location-input"
            />
        </div>
    );
};

export default LocationFilter;
