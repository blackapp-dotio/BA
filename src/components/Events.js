import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import { Modal, Button, Typography, Card, CardContent, CardMedia, Box } from '@mui/material';
import jsPDF from "jspdf/dist/jspdf.umd.min";
import './Events.css';
import CreateEventForm from './CreateEventForm';
import { calculatePlatformFee } from '../utils/feeUtils'; // Import fee utility

const Events = () => {
    const [rssEvents, setRssEvents] = useState([]);
    const [userEvents, setUserEvents] = useState([]);
    const [locationFilter, setLocationFilter] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        date: '',
        location: '',
        ticketPrice: '',
        ticketsAvailable: '',
        mediaUrl: ''
    });
    const { user } = useContext(AuthContext);
    const [walletBalance, setWalletBalance] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [activeTab, setActiveTab] = useState('eventsFeed');
    const [expandedEvent, setExpandedEvent, ] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState(null);
    const [editingEventId, setEditingEventId] = useState(null);
   


    useEffect(() => {
        fetchRSSFeeds();
        fetchUserEvents();
        fetchWalletBalance();
    }, [user]);

const fetchUserEvents = () => {
    const userEventsRef = ref(database, 'userEvents');
    onValue(userEventsRef, (snapshot) => {
        if (snapshot.exists()) {
            const loadedUserEvents = Object.entries(snapshot.val()).map(([key, value]) => ({
                id: key,
                ...value,
            }));
            setUserEvents(loadedUserEvents.reverse());
            console.log("User events fetched:", loadedUserEvents);
        } else {
            setUserEvents([]);
            console.log("No user events found.");
        }
    });
};

    const fetchWalletBalance = () => {
        if (user) {
            const walletRef = ref(database, `users/${user.uid}/wallet/balance`);
            onValue(walletRef, (snapshot) => {
                const balance = snapshot.val() || 0;
                setWalletBalance(balance);
            });
        }
    };

    const fetchRSSFeeds = async () => {
        const rssUrls = [
            'https://rss.app/feeds/nsmT2WdQXSlshmcy.xml',
            'https://rss.app/feeds/XqrrnyuiP2E5gvZY.xml',
            'https://rss.app/feeds/uCjXryL38K1J4e29.xml',
            'https://rss.app/feeds/pv5YufdSsNN6ROH5.xml',
            'https://rss.app/feeds/keM7mXLp4OlutaGg.xml',
            'https://rss.app/feeds/KwsTlmbvwXiY4YX6.xml',
            'https://rss.app/feeds/fQ6cY8V57Sk5ayox.xml',
        ];

        const allEvents = [];

        for (const url of rssUrls) {
            try {
                const response = await axios.get(url);
                const parsedEvents = parseRSSFeed(response.data);
                allEvents.push(...parsedEvents);
            } catch (error) {
                console.error(`Failed to fetch RSS feed from ${url}:`, error);
            }
        }

        setRssEvents(allEvents);
    };

    const parseRSSFeed = (rssData) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rssData, 'application/xml');
        const items = xmlDoc.getElementsByTagName('item');
        const events = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const title = item.getElementsByTagName('title')[0].textContent;
            const link = item.getElementsByTagName('link')[0].textContent;
            const description = item.getElementsByTagName('description')[0].textContent;
            const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent;
            const imageUrl = item.getElementsByTagName('media:content')[0]?.getAttribute('url') || '';
            const event = {
                title,
                link,
                description: parseDescription(description),
                pubDate,
                imageUrl
            };
            events.push(event);
        }
        return events;
    };

    const parseDescription = (description) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(description, 'text/html');
        return doc.body.textContent || '';
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleShowMoreToggle = (index) => {
        setExpandedEvent((prev) => (prev === index ? null : index));
    };

const handleEditButtonClick = (event) => {
    setEventToEdit(event);
    setIsEditModalOpen(true);
    console.log("Editing Event:", event); // Debugging log
};

const handleDeleteEvent = async (event) => {
    if (!event.id) {
        console.error("Event ID is undefined. Cannot proceed with deletion.");
        return;
    }

    console.log("Attempting to delete event:", event);

    try {
        // Delete from database
        await remove(ref(database, `userEvents/${event.id}`));

        // Update local state
        setUserEvents((prevEvents) => prevEvents.filter((e) => e.id !== event.id));

        console.log("Event successfully deleted from database:", event.id);
        alert("Event deleted successfully.");
    } catch (error) {
        console.error("Error deleting event:", error);
        alert("An error occurred while deleting the event.");
    }
};


    const handleCreateEvent = async (eventData) => {
        const eventRef = push(ref(database, 'userEvents'));
        await update(eventRef, {
            ...eventData,
            creatorId: user.uid,
            timestamp: new Date().getTime(),
        });
        setUserEvents((prevEvents) => [eventData, ...prevEvents]);
    };

    const handleBuyTickets = (event) => {
        setSelectedEvent(event);
        setShowConfirmModal(true);
    };

const confirmPurchase = async () => {
    if (!selectedEvent) {
        alert('No event selected for purchase.');
        return;
    }

    const ticketPrice = parseFloat(selectedEvent.ticketPrice);
    if (isNaN(ticketPrice)) {
        console.error('Invalid ticket price:', selectedEvent.ticketPrice);
        alert('Invalid ticket price.');
        return;
    }
    
    const handleShowMoreToggle = (index) => {
    setExpandedEvent((prev) => (prev === index ? null : index));
    console.log(`Toggled expanded event at index: ${index}`);
};

const handleEditButtonClick = (event) => {
    setEditingEventId(event.id);
    setNewEvent({
        name: event.name || '',
        description: event.description || '',
        date: event.date || '',
        location: event.location || '',
        ticketPrice: event.ticketPrice || '',
        mediaFile: null, // Reset media file input
    });
    console.log('Edit button clicked for event:', event);
};

const handleTabChange = (tab) => {
    setActiveTab(tab);
    console.log(`Tab changed to: ${tab}`);
};


    // Calculate platform fee and total amount
    const { platformFee, totalAmount } = calculatePlatformFee(ticketPrice, 'purchase');

    console.log('Ticket Price:', ticketPrice);
    console.log('Platform Fee:', platformFee);
    console.log('Total Amount:', totalAmount);

    // Check if the user has enough balance
    if (isNaN(walletBalance) || walletBalance < totalAmount) {
        console.error('Insufficient or invalid wallet balance:', walletBalance);
        alert('Insufficient balance to cover the ticket price and platform fee.');
        return;
    }

    // Prepare updates for Firebase
    const newBalance = walletBalance - totalAmount;

    if (isNaN(newBalance)) {
        console.error('Invalid new balance calculation:', newBalance);
        alert('Error calculating new balance.');
        return;
    }

    const updates = {};
    updates[`users/${user.uid}/wallet/balance`] = newBalance;

    try {
        // Fetch and update the organizer's balance
        const organizerBalanceRef = ref(database, `users/${selectedEvent.creatorId}/wallet/balance`);
        const organizerSnapshot = await new Promise((resolve, reject) => {
            onValue(
                organizerBalanceRef,
                (snapshot) => resolve(snapshot),
                { onlyOnce: true }
            );
        });

        const organizerBalance = parseFloat(organizerSnapshot.val()) || 0;
        if (isNaN(organizerBalance)) {
            console.error('Invalid organizer balance:', organizerSnapshot.val());
            alert('Error fetching organizer balance.');
            return;
        }

        updates[`users/${selectedEvent.creatorId}/wallet/balance`] = organizerBalance + ticketPrice;

        // Fetch and accumulate the platform fee
        const agbankRef = ref(database, 'agbank/platformFees');
        const agbankSnapshot = await new Promise((resolve, reject) => {
            onValue(
                agbankRef,
                (snapshot) => resolve(snapshot),
                { onlyOnce: true }
            );
        });

        const currentPlatformFees = parseFloat(agbankSnapshot.val()) || 0;
        if (isNaN(currentPlatformFees)) {
            console.error('Invalid platform fees:', agbankSnapshot.val());
            alert('Error fetching platform fees.');
            return;
        }

        updates['agbank/platformFees'] = currentPlatformFees + platformFee;

        // Update Firebase
        await update(ref(database), updates);

        // Generate Ticket PDF
        await generateTicketPDF(selectedEvent);

        // Success Message
        alert('Ticket purchased successfully!');
    } catch (error) {
        console.error('Error processing ticket purchase:', error);
        alert('An error occurred while processing your ticket purchase. Please try again.');
    }

    setShowConfirmModal(false);
};
    
const handleUpdateEvent = async () => {
    if (!eventToEdit) return;

    try {
        const updates = { ...eventToEdit };
        if (eventToEdit.media && typeof eventToEdit.media !== "string") {
            const storage = getStorage();
            const mediaStorageRef = storageRef(
                storage,
                `events/${eventToEdit.id}/${eventToEdit.media.name}`
            );
            await uploadBytes(mediaStorageRef, eventToEdit.media);
            updates.mediaUrl = await getDownloadURL(mediaStorageRef);
        }

        await update(ref(database, `userEvents/${eventToEdit.id}`), updates);

        // Update the UI
        setUserEvents((prevEvents) =>
            prevEvents.map((event) =>
                event.id === eventToEdit.id ? { ...event, ...updates } : event
            )
        );

        alert("Event updated successfully!");
        setIsEditModalOpen(false);
        setEventToEdit(null);
    } catch (error) {
        console.error("Error updating event:", error);
        alert("Failed to update the event. Please try again.");
    }
};    

    const generateTicketPDF = (event) => {
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text(event.name, 20, 30);

        doc.setFontSize(16);
        doc.text(`Date: ${event.date}`, 20, 50);
        doc.text(`Location: ${event.location}`, 20, 60);
        doc.text(`Ticket Holder: ${user.displayName || 'Anonymous'}`, 20, 70);
        doc.text(`Ticket Price: ${event.ticketPrice} AGMoney`, 20, 80);

        doc.setFontSize(12);
        doc.text('Thank you for your purchase!', 20, 100);

        doc.save(`${event.name}_ticket.pdf`);
    };
    const renderTabContent = () => {
        if (activeTab === 'eventsFeed') {
            const combinedEvents = [...userEvents, ...rssEvents]; 

            return (
                <div className="tab-content">
                    {combinedEvents.map((event, index) => (
                        <Card key={index} className="event-card" elevation={3}>
                            <CardMedia
                                className="event-card-image"
                                image={event.mediaUrl || event.imageUrl || 'https://via.placeholder.com/150'}
                                title={event.name || event.title}
                                style={{ height: 200 }}
                            />
                            <CardContent>
                                <Typography variant="h6" className="event-title">
                                    {event.name || event.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {event.date || event.pubDate}
                                </Typography>

                                <Typography variant="body2" className="event-description">
                                    {expandedEvent === index
                                        ? event.description
                                        : event.description.slice(0, 100) + '...'}
                                </Typography>

                                {!event.creatorId && (
                                    <Button size="small" color="primary" onClick={() => handleShowMoreToggle(index)}>
                                        {expandedEvent === index ? 'Show Less' : 'Show More'}
                                    </Button>
                                )}

                                {expandedEvent === index && !event.creatorId && event.link && (
                                    <Button size="small" color="secondary" href={event.link} target="_blank" style={{ marginTop: '10px' }}>
                                        Buy from Vendor
                                    </Button>
                                )}

                                {event.creatorId && (
                                    <div style={{ marginTop: '10px' }}>
                                        <Button variant="contained" color="primary" onClick={() => handleBuyTickets(event)}>
                                            Buy Ticket
                                        </Button>
                                        {event.creatorId === user?.uid && (
                                            <>
                                                <Button variant="outlined" color="secondary" onClick={() => handleEditButtonClick(event)} style={{ marginLeft: '10px' }}>
                                                    Edit
                                                </Button>
                                                <Button variant="outlined" color="error" onClick={() => handleDeleteEvent(event)} style={{ marginLeft: '10px' }}>
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            );
        } else if (activeTab === 'userEvents') {
            return (
                <div className="tab-content">
                    {userEvents.map((event, index) => (
                        <Card key={index} className="event-card" elevation={3}>
                            <CardMedia
                                className="event-card-image"
                                image={event.mediaUrl || 'https://via.placeholder.com/150'}
                                title={event.name}
                                style={{ height: 200 }}
                            />
                            <CardContent>
                                <Typography variant="h6" className="event-title">{event.name}</Typography>
                                <Typography variant="body2" color="textSecondary">{event.date}</Typography>
                                <Typography variant="body2" className="event-description">{event.description}</Typography>
                                <Button variant="contained" color="primary" onClick={() => handleBuyTickets(event)}>
                                    Buy Ticket
                                </Button>
                                {event.creatorId === user?.uid && (
                                    <>
                                        <Button variant="outlined" color="secondary" onClick={() => handleEditButtonClick(event)} style={{ marginLeft: '10px' }}>
                                            
                                            
                                        </Button>
                                        <Button variant="outlined" color="error" onClick={() => handleDeleteEvent(event)} style={{ marginLeft: '10px' }}>
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            );
        } else if (activeTab === 'createEvent') {
            return (
                <CreateEventForm onCreateEvent={handleCreateEvent} />
            );
        }
    };

    return (
        <div className="events-page">
            <div className="tabs">
                <button className={activeTab === 'eventsFeed' ? 'active' : ''} onClick={() => handleTabChange('eventsFeed')}>
                    Events Feed
                </button>
                <button className={activeTab === 'userEvents' ? 'active' : ''} onClick={() => handleTabChange('userEvents')}>
                    My Events
                </button>
                <button className={activeTab === 'createEvent' ? 'active' : ''} onClick={() => handleTabChange('createEvent')}>
                    Create Event
                </button>
            </div>

            {renderTabContent()}

            <Modal open={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
                <Box className="modal-content">
                    <Typography variant="h6">Confirm Purchase</Typography>
                    <Typography variant="body2">Ticket Price: {selectedEvent?.ticketPrice} AGMoney</Typography>
                    <div className="modal-actions">
                        <Button variant="contained" color="primary" onClick={confirmPurchase}>
                            Confirm
                        </Button>
                        <Button variant="contained" onClick={() => setShowConfirmModal(false)}>
                            Cancel
                        </Button>
                    </div>
                </Box>
            </Modal>
<Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
    <Box className="modal-content">
        <Typography variant="h6">Edit Event</Typography>
        {eventToEdit && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateEvent();
                }}
            >
                <input
                    type="text"
                    value={eventToEdit.name}
                    onChange={(e) =>
                        setEventToEdit({ ...eventToEdit, name: e.target.value })
                    }
                    placeholder="Event Name"
                    className="form-input"
                />
                <textarea
                    value={eventToEdit.description}
                    onChange={(e) =>
                        setEventToEdit({ ...eventToEdit, description: e.target.value })
                    }
                    placeholder="Event Description"
                    className="form-textarea"
                ></textarea>
                <input
                    type="date"
                    value={eventToEdit.date}
                    onChange={(e) =>
                        setEventToEdit({ ...eventToEdit, date: e.target.value })
                    }
                    className="form-input"
                />
                <input
                    type="text"
                    value={eventToEdit.location}
                    onChange={(e) =>
                        setEventToEdit({ ...eventToEdit, location: e.target.value })
                    }
                    placeholder="Event Location"
                    className="form-input"
                />
                <input
                    type="number"
                    value={eventToEdit.ticketPrice}
                    onChange={(e) =>
                        setEventToEdit({
                            ...eventToEdit,
                            ticketPrice: parseFloat(e.target.value),
                        })
                    }
                    placeholder="Ticket Price"
                    className="form-input"
                />
                <button type="submit" className="submit-button">
                    Save Changes
                </button>
                <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="cancel-button"
                >
                    Cancel
                </button>
            </form>
        )}
    </Box>
</Modal>            
        </div>
    );
};

export default Events;
