// src/components/BadgeDisplay.js
import React from 'react';
import './BadgeDisplay.css';

const BadgeDisplay = ({ badges }) => {
    return (
        <div className="badge-display">
            <h3>Badges</h3>
            <div className="badges">
                {badges.map((badge, index) => (
                    <div key={index} className="badge">
                        <img src={badge.image} alt={badge.name} />
                        <p>{badge.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BadgeDisplay;
