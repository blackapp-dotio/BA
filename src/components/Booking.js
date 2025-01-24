// Booking.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue, push, update, remove, get } from 'firebase/database';
import { database, auth } from '../firebaseconfig';
import './Booking.css';
import './styles/buttons.css'; // Import global button styles

const Booking = () => {
  const { brandId } = useParams(); // Capture brandId from URL
  const [bookings, setBookings] = useState([]); // List of bookings
  const [newBooking, setNewBooking] = useState({ name: '', date: '', time: '', details: '' });
  const [editingBooking, setEditingBooking] = useState(null); // Track the booking being edited
  const [walletBalance, setWalletBalance] = useState(0); // Track user's wallet balance
  const [bookingStatus, setBookingStatus] = useState(null); // Track status of a booking
  const [bookingsPublished, setBookingsPublished] = useState(false); // Track booking publish status
  const [isCreator, setIsCreator] = useState(false); // Check if the current user is the brand owner

  useEffect(() => {
    if (brandId) {
      // Check if the current user is the brand owner
      const brandRef = ref(database, `brands/${brandId}`);
      onValue(brandRef, (snapshot) => {
        if (snapshot.exists()) {
          const brand = snapshot.val();
          setIsCreator(brand.userId === auth.currentUser?.uid);
          setBookingsPublished(brand.isBookingsPublished || false); // Set initial publish status for bookings
        }
      });

      // Fetch bookings associated with the brand
      const bookingsRef = ref(database, `brands/${brandId}/tools/Bookings/bookings`);
      onValue(bookingsRef, (snapshot) => {
        if (snapshot.exists()) {
          setBookings(Object.values(snapshot.val()));
        } else {
          setBookings([]);
        }
      });

      // Fetch user's wallet balance for booking services
      if (auth.currentUser) {
        const balanceRef = ref(database, `users/${auth.currentUser.uid}/wallet/balance`);
        onValue(balanceRef, (snapshot) => {
          setWalletBalance(snapshot.val() || 0);
        });
      }
    }
  }, [brandId]);

  // Handle publishing or unpublishing the brand bookings
  const handlePublishBookings = async () => {
    if (brandId) {
      const brandRef = ref(database, `brands/${brandId}`);
      const snapshot = await get(brandRef);
      if (snapshot.exists()) {
        const brandData = snapshot.val();
        const updatedStatus = !brandData.isBookingsPublished;
        await update(brandRef, { isBookingsPublished: updatedStatus });
        setBookingsPublished(updatedStatus);
        alert(`Bookings have been ${updatedStatus ? 'published' : 'unpublished'} successfully!`);
      }
    }
  };

  // Handle adding a new booking
  const handleAddBooking = async () => {
    if (!newBooking.name || !newBooking.date || !newBooking.time) {
      alert('Please fill in all required fields.');
      return;
    }

    const bookingId = push(ref(database, `brands/${brandId}/tools/Bookings/bookings`)).key;
    const booking = {
      id: bookingId,
      ...newBooking,
    };

    await update(ref(database, `brands/${brandId}/tools/Bookings/bookings/${bookingId}`), booking);
    setBookings([...bookings, booking]);
    setNewBooking({ name: '', date: '', time: '', details: '' });
  };

  // Handle editing a booking
  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setNewBooking(booking);
  };

  // Handle updating an existing booking
  const handleUpdateBooking = async () => {
    if (editingBooking) {
      await update(ref(database, `brands/${brandId}/tools/Bookings/bookings/${editingBooking.id}`), newBooking);
      setBookings(bookings.map((b) => (b.id === editingBooking.id ? newBooking : b)));
      setNewBooking({ name: '', date: '', time: '', details: '' });
      setEditingBooking(null);
    }
  };

  // Handle deleting a booking
  const handleDeleteBooking = async (bookingId) => {
    await remove(ref(database, `brands/${brandId}/tools/Bookings/bookings/${bookingId}`));
    setBookings(bookings.filter((booking) => booking.id !== bookingId));
  };

  // Handle booking a service using the user's wallet balance
  const handleBookService = async (booking) => {
    if (!auth.currentUser) {
      alert('Please log in to book a service.');
      return;
    }

    if (walletBalance < booking.price) {
      alert('Insufficient balance. Please deposit more funds.');
      return;
    }

    const newBalance = walletBalance - booking.price;
    const userId = auth.currentUser.uid;
    const platformFee = booking.price * 0.02; // Calculate 2% platform fee
    const providerAmount = booking.price - platformFee;

    // Deduct the amount from user's wallet balance and hold it in transition
    await update(ref(database, `users/${userId}/wallet/balance`), newBalance);
    setWalletBalance(newBalance);

    // Create a new booking in Firebase with transition state
    const bookingId = push(ref(database, 'bookings')).key;
    const newBookingData = {
      bookingId,
      bookingIdOriginal: booking.id,
      bookingName: booking.name,
      buyerId: userId,
      providerId: brandId,
      price: booking.price,
      platformFee,
      providerAmount,
      status: 'pending', // Booking is in transition state until confirmed by provider
      timestamp: Date.now(),
    };
    await update(ref(database, `bookings/${bookingId}`), newBookingData);

    setBookingStatus(`Booking successful! You booked ${booking.name} for $${booking.price.toFixed(2)} AGMoney.`);
  };

  return (
    <div className="booking-container">
      <h2>{isCreator ? 'Manage Your Bookings' : 'Available Bookings'}</h2>
      {isCreator && (
        <div className="booking-management-container">
          <h3>{editingBooking ? 'Edit Booking' : 'Add New Booking'}</h3>
          <input
            type="text"
            placeholder="Booking Name"
            value={newBooking.name}
            onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })}
          />
          <input
            type="date"
            placeholder="Date"
            value={newBooking.date}
            onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
          />
          <input
            type="time"
            placeholder="Time"
            value={newBooking.time}
            onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
          />
          <textarea
            placeholder="Details"
            value={newBooking.details}
            onChange={(e) => setNewBooking({ ...newBooking, details: e.target.value })}
          />
          <button onClick={editingBooking ? handleUpdateBooking : handleAddBooking}>
            {editingBooking ? 'Update Booking' : 'Add Booking'}
          </button>
          <button onClick={handlePublishBookings}>
            {bookingsPublished ? 'Unpublish Bookings' : 'Publish Bookings'}
          </button>
        </div>
      )}

      <div className="bookings-list">
        <h3>{bookings.length > 0 ? 'Available Bookings' : 'No bookings available'}</h3>
        <div className="bookings-grid">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <h4>{booking.name}</h4>
              <p>Date: {booking.date}</p>
              <p>Time: {booking.time}</p>
              <p>{booking.details}</p>
              <div className="booking-actions">
                {isCreator ? (
                  <>
                    <button onClick={() => handleEditBooking(booking)}>Edit</button>
                    <button onClick={() => handleDeleteBooking(booking.id)}>Delete</button>
                  </>
                ) : (
                  <button onClick={() => handleBookService(booking)}>Book Now</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {bookingStatus && <p className="booking-status">{bookingStatus}</p>}
    </div>
  );
};

export default Booking;
