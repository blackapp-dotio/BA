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

const RSSFeedEvents = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchRSSFeeds = async () => {
            try {
                const allEvents = [];

                for (const feedUrl of rssFeeds) {
                    const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
                    const feedEvents = response.data.items;

                    // Format the events to include necessary details like title, link, and date
                    const formattedEvents = feedEvents.map(event => ({
                        title: event.title,
                        link: event.link,
                        date: new Date(event.pubDate).toLocaleDateString(),
                        description: event.description
                    }));

                    allEvents.push(...formattedEvents);
                }

                setEvents(allEvents);
            } catch (error) {
                console.error('Error fetching RSS feeds:', error);
            }
        };

        fetchRSSFeeds();
    }, []);

    return (
        <div className="rss-feed-events">
            {events.length === 0 ? (
                <p>Loading events...</p>
            ) : (
                events.map((event, index) => (
                    <div key={index} className="event-card">
                        <h3>{event.title}</h3>
                        <p>{event.date}</p>
                        <p>{event.description}</p>
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
