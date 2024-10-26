import React, { useEffect, useState } from 'react';
import './SocialMediaFeed.css';

const SocialMediaFeed = () => {
    const [socialMediaEvents, setSocialMediaEvents] = useState([]);

    useEffect(() => {
        // Example: Fetch data from social media using a predefined hashtag (e.g., #BlackEvents)
        const fetchSocialMediaEvents = async () => {
            try {
                // Replace with an actual API call to a social media platform
                const response = await fetch('https://api.example.com/events?hashtag=BlackEvents');
                const data = await response.json();
                setSocialMediaEvents(data.events);
            } catch (error) {
                console.error('Error fetching social media events:', error);
            }
        };

        fetchSocialMediaEvents();
    }, []);

    return (
        <div className="social-media-feed">
            {socialMediaEvents.length === 0 ? (
                <p>No social media events found.</p>
            ) : (
                socialMediaEvents.map((event) => (
                    <div key={event.id} className="event-card">
                        <h3>{event.title}</h3>
                        <p>{event.date}</p>
                        <p>{event.location}</p>
                    </div>
                ))
            )}
        </div>
    );
};

export default SocialMediaFeed;
