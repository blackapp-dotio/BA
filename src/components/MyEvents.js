import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database, auth } from '../firebase';
import './MyEvents.css';

const MyEvents = () => {
    const [myEvents, setMyEvents] = useState([]);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            const userEventsRef = ref(database, `user_events/${user.uid}`);
            onValue(userEventsRef, (snapshot) => {
                const data = snapshot.val();
                setMyEvents(data ? Object.values(data) : []);
            });
        }
    }, []);

    return (
        <div className="my-events">
            {myEvents.length > 0 ? (
                myEvents.map((event, index) => (
                    <div key={index} className="event-card">
                        <h3>{event.title}</h3>
                        <p>{event.description}</p>
                        <p>{new Date(event.date).toLocaleString()}</p>
                        <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">Manage Event</a>
                    </div>
                ))
            ) : (
                <p>You have not created any events yet.</p>
            )}
        </div>
    );
};

export default MyEvents;
