import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import './UserGeneratedEvents.css';

const UserGeneratedEvents = ({ locationFilter }) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const eventsRef = ref(database, 'user_events');
        onValue(eventsRef, (snapshot) => {
            const data = snapshot.val();
            setEvents(data ? Object.values(data) : []);
        });
    }, []);

    const filteredEvents = events.filter((event) =>
        event.location?.toLowerCase().includes(locationFilter.toLowerCase())
    );

    return (
        <div className="user-generated-events">
            {filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                    <div key={index} className="event-card">
                        <h3>{event.title}</h3>
                        <p>{event.description}</p>
                        <p>{event.location}</p>
                        <p>{new Date(event.date).toLocaleString()}</p>
                        <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">Buy Tickets</a>
                    </div>
                ))
            ) : (
                <p>No events found for the selected location.</p>
            )}
        </div>
    );
};

export default UserGeneratedEvents;
