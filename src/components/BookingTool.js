import React, { useState, useEffect } from 'react';
import { ref, push, update, remove, onValue } from 'firebase/database';
import { database } from '../firebaseconfig';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ToolStyles.css';

const BookingTool = ({ brandId }) => {
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({ id: null, name: '', price: '', description: '', image: null });
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const bookingsRef = ref(database, `brands/${brandId}/tools/booking/bookings`);
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      setBookings(data ? Object.values(data) : []);
    }, (error) => {
      console.error("Failed to retrieve bookings:", error);
      setErrorMessage("Failed to load bookings.");
    });

    return () => unsubscribe();
  }, [brandId]);

  const handleMediaUpload = async (file) => {
    const storage = getStorage();
    const mediaRef = storageRef(storage, `brands/${brandId}/booking/images/${file.name}`);
    try {
      await uploadBytes(mediaRef, file);
      return await getDownloadURL(mediaRef);
    } catch (error) {
      console.error("Error uploading media:", error);
      throw new Error("Media upload failed.");
    }
  };

  const saveBooking = async () => {
    try {
      const bookingData = { ...newBooking };
      if (newBooking.image) {
        bookingData.imageUrl = await handleMediaUpload(newBooking.image);
      }
      const bookingRef = ref(database, `brands/${brandId}/tools/booking/bookings/${newBooking.id || push(ref(database, `brands/${brandId}/tools/booking/bookings`)).key}`);
      await update(bookingRef, bookingData);
      resetForm();
    } catch (error) {
      console.error("Error saving booking:", error);
      setErrorMessage("Failed to save booking.");
    }
  };

  const editBooking = (booking) => {
    setNewBooking(booking);
    setIsEditing(true);
  };

  const deleteBooking = async (bookingId) => {
    try {
      await remove(ref(database, `brands/${brandId}/tools/booking/bookings/${bookingId}`));
    } catch (error) {
      console.error("Error deleting booking:", error);
      setErrorMessage("Failed to delete booking.");
    }
  };

  const resetForm = () => {
    setNewBooking({ id: null, name: '', price: '', description: '', image: null });
    setIsEditing(false);
  };

  return (
    <div className="tool-container">
      <h3>Booking Options</h3>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <input type="text" placeholder="Booking Name" value={newBooking.name} onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })} />
      <input type="number" placeholder="Booking Price" value={newBooking.price} onChange={(e) => setNewBooking({ ...newBooking, price: e.target.value })} />
      <textarea placeholder="Booking Description" value={newBooking.description} onChange={(e) => setNewBooking({ ...newBooking, description: e.target.value })} />
      <input type="file" onChange={(e) => setNewBooking({ ...newBooking, image: e.target.files[0] })} />
      <button onClick={saveBooking} className="tool-button">{isEditing ? 'Update Booking' : 'Add Booking'}</button>
      {isEditing && <button onClick={resetForm} className="tool-button">Cancel Edit</button>}

      <h4>Existing Bookings</h4>
      <ul>
        {bookings.map((booking) => (
          <li key={booking.id}>
            <p>{booking.name} - ${booking.price}</p>
            <p>{booking.description}</p>
            {booking.imageUrl && <img src={booking.imageUrl} alt={booking.name} />}
            <button onClick={() => editBooking(booking)}>Edit</button>
            <button onClick={() => deleteBooking(booking.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookingTool;
