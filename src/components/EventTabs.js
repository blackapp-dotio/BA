import React from 'react';
import './EventTabs.css';

const EventTabs = ({ activeTab, onTabChange }) => {
    const tabs = ['Trending', 'RSS Feeds', 'User-Generated', 'Create Event', 'Submit Event'];

    return (
        <div className="tabs-container">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => onTabChange(tab)}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

export default EventTabs;
