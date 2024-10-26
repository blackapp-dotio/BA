import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './RSSFeedEvents.css';

const rssFeeds = [
    'https://rss.app/feeds/4X0XHHFDMEYxib8s.xml',
    'https://rss.app/feeds/XqrrnyuiP2E5gvZY.xml',
    'https://rss.app/feeds/nsmT2WdQXSlshmcy.xml',
    'https://rss.app/feeds/KwsTlmbvwXiY4YX6.xml',
    'https://rss.app/feeds/dEBtpCpyYMckxd0P.xml',
    'https://rss.app/feeds/fQ6cY8V57Sk5ayox.xml',
    'https://rss.app/feeds/QaEL4lqIeejDcyUm.xml',
    'https://rss.app/feeds/keM7mXLp4OlutaGg.xml',
    'https://rss.app/feeds/20Gr9MAIps6Aw8vn.xml',
    'https://rss.app/feeds/uJKkABlgiyYwKnJl.xml'
];

// Function to extract image from multiple possible tags
const extractImageFromContent = (content) => {
    // Try different methods to extract an image URL
    let imgTagMatch = content.match(/<img.*?src=["'](.*?)["']/);
    if (imgTagMatch) return imgTagMatch[1];

    let mediaContentMatch = content.match(/<media:content.*?url=["'](.*?)["']/);
    if (mediaContentMatch) return mediaContentMatch[1];

    let enclosureMatch = content.match(/<enclosure.*?url=["'](.*?)["']/);
    if (enclosureMatch) return enclosureMatch[1];

    return null;  // No image found
};

// Function to clean up the description text
const cleanTextContent = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || '';  // Extract only the text
};

const RSSFeedEvents = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [locationFilter, setLocationFilter] = useState('');

    useEffect(() => {
        const fetchRSSFeeds = async () => {
            try {
                const allEvents = [];

                for (const feedUrl of rssFeeds) {
                    const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
                    const feedEvents = response.data.items;

                    const formattedEvents = feedEvents.map(event => {
                        // Try extracting image from various tags
                        const image = event.thumbnail || extractImageFromContent(event.description || '') || 'default-image.png';

                        // Clean the description to remove any HTML tags
                        const cleanDescription = cleanTextContent(event.description);

                        return {
                            title: event.title,
                            link: event.link,
                            date: new Date(event.pubDate).toLocaleDateString(),
                            description: cleanDescription,
                            location: event.author || 'Unknown location',
                            image
                        };
                    });

                    allEvents.push(...formattedEvents);
                }

                setEvents(allEvents);
                setFilteredEvents(allEvents);  // Display all events by default
            } catch (error) {
                console.error('Error fetching RSS feeds:', error);
            }
        };

        fetchRSSFeeds();
    }, []);

    const handleLocationFilterChange = (event) => {
        const location = event.target.value;
        setLocationFilter(location);

        if (location) {
            const filtered = events.filter(event => event.location.toLowerCase().includes(location.toLowerCase()));
            setFilteredEvents(filtered);
        } else {
            setFilteredEvents(events);  // Reset to all events if no location is selected
        }
    };

    return (
        <div className="rss-feed-events">
            <div className="filter-section">
                <label htmlFor="location-filter">Filter by location:</label>
                <input
                    type="text"
                    id="location-filter"
                    value={locationFilter}
                    onChange={handleLocationFilterChange}
                    placeholder="Enter location"
                />
            </div>

            {filteredEvents.length === 0 ? (
                <p>No events found.</p>
            ) : (
                filteredEvents.map((event, index) => (
                    <div key={index} className="event-card">
                        <h3>{event.title}</h3>
                        <p>{event.date}</p>
                        {event.image && (
                            <img src={event.image} alt={event.title} className="event-image" />
                        )}
                        <p>{event.description}</p>
                        {event.location && <p><strong>Location:</strong> {event.location}</p>}
                        <a href={event.link} target="_blank" rel="noopener noreferrer">
                            View Event
                        </a>
                    </div>
                ))
            )}
        </div>
    );
};

export default RSSFeedEvents;
