import React, { useState } from 'react';
import './CreateEventForm.css';

const CreateEventForm = () => {
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventLocation, setEventLocation] = useState('');

    const handleCreateEvent = () => {
        // Submit event data to your backend or Firebase
        console.log('Creating event:', { eventTitle, eventDescription, eventDate, eventLocation });
    };

    return (
        <div className="create-event-form">
            <h2>Create Event</h2>
            <input
                type="text"
                placeholder="Event Title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
            />
            <textarea
                placeholder="Event Description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
            />
            <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
            />
            <input
                type="text"
                placeholder="Event Location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
            />
            <button onClick={handleCreateEvent}>Create Event</button>
        </div>
    );
};

export default CreateEventForm;
