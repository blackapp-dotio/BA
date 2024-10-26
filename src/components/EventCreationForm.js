import React, { useState, useEffect, useContext } from 'react';
import { ref, push, update, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, auth } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import './CreateEvent.css';

const CreateEvent = () => {
    const { user } = useContext(AuthContext);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (user) {
            const userEventsRef = ref(database, `events/${user.uid}`);
            onValue(userEventsRef, (snapshot) => {
                const eventData = snapshot.val();
                const userEvents = eventData ? Object.keys(eventData).map(key => ({ id: key, ...eventData[key] })) : [];
                setEvents(userEvents);
            });
        }
    }, [user]);

    const handleCreateEvent = async () => {
        if (!eventTitle || !eventDate || !eventLocation || !ticketPrice) {
            alert("Please fill out all required fields.");
            return;
        }

        const eventId = push(ref(database, 'events')).key;

        let mediaUrl = '';
        if (mediaFile) {
            const storage = getStorage();
            const mediaStorageRef = storageRef(storage, `events/${eventId}/${mediaFile.name}`);
            await uploadBytes(mediaStorageRef, mediaFile);
            mediaUrl = await getDownloadURL(mediaStorageRef);
        }

        const event = {
            id: eventId,
            userId: user.uid,
            title: eventTitle,
            description: eventDescription,
            date: eventDate,
            location: eventLocation,
            ticketPrice: parseFloat(ticketPrice),
            mediaUrl,
            canceled: false,  // New field to track event cancellation
            timestamp: new Date().getTime(),
        };

        const updates = {};
        updates[`/events/${user.uid}/${eventId}`] = event;
        updates[`/feed/${eventId}`] = event; // Add to the feed as well

        try {
            await update(ref(database), updates);
            alert("Event created successfully!");
            clearForm();
        } catch (error) {
            console.error("Error creating event:", error);
        }
    };

    const clearForm = () => {
        setEventTitle('');
        setEventDescription('');
        setEventDate('');
        setEventLocation('');
        setTicketPrice('');
        setMediaFile(null);
    };

    const handleCancelEvent = async (eventId) => {
        if (window.confirm("Are you sure you want to cancel this event? This action cannot be undone.")) {
            try {
                // Update the event's canceled status in Firebase
                const updates = {};
                updates[`/events/${user.uid}/${eventId}/canceled`] = true;
                updates[`/feed/${eventId}/canceled`] = true;

                await update(ref(database), updates);
                alert("Event canceled successfully.");
            } catch (error) {
                console.error("Error canceling event:", error);
            }
        }
    };

    return (
        <div className="create-event-container">
            <h2>Create a New Event</h2>
            <div className="create-event-form">
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
                    placeholder="Event Date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Event Location"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Ticket Price (in AGMoney)"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                />
                <input
                    type="file"
                    onChange={(e) => setMediaFile(e.target.files[0])}
                />
                <button onClick={handleCreateEvent}>Create Event</button>
            </div>

            <h3>Your Events</h3>
            <div className="events-list">
                {events.length === 0 ? (
                    <p>No events created yet.</p>
                ) : (
                    events.map(event => (
                        <div key={event.id} className={`event-item ${event.canceled ? 'canceled' : ''}`}>
                            <h4>{event.title}</h4>
                            <p>{event.date}</p>
                            <p>{event.location}</p>
                            <p>{event.canceled ? 'Canceled' : `Ticket Price: ${event.ticketPrice} AGMoney`}</p>
                            {!event.canceled && (
                                <button onClick={() => handleCancelEvent(event.id)}>Cancel Event</button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CreateEvent;
