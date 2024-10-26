import React, { useState } from 'react';
import './SubmitEventForm.css';

const SubmitEventForm = () => {
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventLocation, setEventLocation] = useState('');

    const handleSubmitEvent = () => {
        // Submit the user-generated event to your backend or Firebase
        console.log('Submitting event:', { eventTitle, eventDescription, eventDate, eventLocation });
    };

    return (
        <div className="submit-event-form">
            <h2>Submit an Event</h2>
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
            <button onClick={handleSubmitEvent}>Submit Event</button>
        </div>
    );
};

export default SubmitEventForm;
