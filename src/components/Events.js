import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ref, push, onValue, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, auth } from '../firebase';
import { AuthContext } from '../contexts/AuthContext';
import { Modal, Button } from '@mui/material';
import jsPDF from "jspdf/dist/jspdf.umd.min";
import './Events.css';

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

    useEffect(() => {
        fetchRSSFeeds();
        fetchUserEvents();
        fetchWalletBalance();
    }, [user]);

    const fetchUserEvents = () => {
        const userEventsRef = ref(database, 'userEvents');
        onValue(userEventsRef, (snapshot) => {
            const userEventData = snapshot.val();
            const loadedUserEvents = userEventData ? Object.keys(userEventData).map(key => userEventData[key]) : [];
            setUserEvents(loadedUserEvents.reverse());
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
            'https://rss.app/feeds/uCjXryL38K1J4e29.xml',
            'https://rss.app/feeds/pv5YufdSsNN6ROH5.xml',
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

    const handleLocationFilterChange = (e) => {
        setLocationFilter(e.target.value);
    };

    const handleEventCreation = async (e) => {
        e.preventDefault();

        let mediaUrl = '';
        if (mediaFile) {
            const storage = getStorage();
            const mediaStorageRef = storageRef(storage, `events/${newEvent.name}/${mediaFile.name}`);
            await uploadBytes(mediaStorageRef, mediaFile);
            mediaUrl = await getDownloadURL(mediaStorageRef);
        }

        const eventData = {
            ...newEvent,
            mediaUrl,
            creatorId: user.uid,
            timestamp: new Date().getTime(),
        };

        const newEventRef = push(ref(database, 'userEvents'));
        await update(newEventRef, eventData);

        setUserEvents([eventData, ...userEvents]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent({ ...newEvent, [name]: value });
    };

    const handleMediaChange = (e) => {
        setMediaFile(e.target.files[0]);
    };

    const handleBuyTickets = (event) => {
        setSelectedEvent(event);
        setShowConfirmModal(true);
    };

    const confirmPurchase = async () => {
        const ticketPrice = parseFloat(selectedEvent.ticketPrice);
        if (walletBalance >= ticketPrice) {
            const newBalance = walletBalance - ticketPrice;
            const updates = {};
            updates[`users/${user.uid}/wallet/balance`] = newBalance;

            await update(ref(database), updates);

            const transaction = {
                senderId: user.uid,
                recipientId: selectedEvent.creatorId,
                amount: ticketPrice,
                timestamp: new Date().getTime(),
            };
            await push(ref(database, 'transactions'), transaction);

            await generateTicketPDF(selectedEvent);

            alert('Ticket purchased successfully!');
        } else {
            alert('Insufficient balance.');
        }

        setShowConfirmModal(false);
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

    // ... rest of your component (filteredRssEvents, renderTabContent, etc.)

    return (
        <div className="events-page">
            {/* Rendered components here */}
        </div>
    );
};

export default Events;
