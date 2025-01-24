import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ref, push, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database } from '../firebase'; // Update path as per your file structure
import './CreateEventForm.css';
import { auth } from '../firebaseconfig';

console.log("Auth currentUser:", auth.currentUser);


const CreateEventForm = () => {
    const { user } = useContext(AuthContext); // Ensure user context is accessed here
    const [newEvent, setNewEvent, setUserEvents] = useState({
        name: '',
        description: '',
        date: '',
        location: '',
        ticketPrice: '',
        media: null,
    });
    
            
    const [mediaFile, setMediaFile] = useState(null);

const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.date || !newEvent.ticketPrice) {
        alert('Please fill out all required fields (name, date, ticket price).');
        return;
    }

    try {
        const eventRef = push(ref(database, 'userEvents')); // Create a new event key in Firebase
        let mediaUrl = '';

        if (newEvent.mediaFile) {
            const storage = getStorage();
            const mediaStorageRef = storageRef(storage, `events/${eventRef.key}/${newEvent.mediaFile.name}`);
            await uploadBytes(mediaStorageRef, newEvent.mediaFile);
            mediaUrl = await getDownloadURL(mediaStorageRef);
        }

        const eventData = {
            ...newEvent,
            id: eventRef.key, // Save the generated Firebase key as the event ID
            mediaUrl,
            creatorId: user.uid,
            timestamp: Date.now(),
        };

        await update(eventRef, eventData);

        console.log('Event successfully created:', eventData);
        alert('Event created successfully.');

        // Update the parent component's events list
        if (setUserEvents) {
            setUserEvents((prevEvents) => [eventData, ...prevEvents]);
        }

        // Reset the form
        setNewEvent({
            name: '',
            description: '',
            date: '',
            location: '',
            ticketPrice: '',
            mediaFile: null,
        });
    } catch (error) {
        console.error('Error creating event:', error);
        alert('An error occurred while creating the event. Please try again.');
    }
};

    return (
        <div className="create-event-form">
            <h3>Create a New Event</h3>
            <input
                type="text"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                placeholder="Event Name"
                required
            />
            <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event Description"
                required
            ></textarea>
            <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                required
            />
            <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Event Location"
                required
            />
            <input
                type="number"
                value={newEvent.ticketPrice}
                onChange={(e) => setNewEvent({ ...newEvent, ticketPrice: e.target.value })}
                placeholder="Ticket Price"
                required
            />
            <input
                type="number"
                value={newEvent.ticketsAvailable}
                onChange={(e) => setNewEvent({ ...newEvent, ticketsAvailable: e.target.value })}
                placeholder="Tickets Available"
            />
            <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setMediaFile(e.target.files[0])}
            />
            <button onClick={handleCreateEvent}>Create Event</button>
        </div>
    );
};

// This export must be outside of any JSX or function block
export default CreateEventForm;