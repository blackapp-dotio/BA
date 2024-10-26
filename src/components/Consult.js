// Consult.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, push, update, remove, get } from 'firebase/database';
import { database, auth } from '../firebaseconfig';
import './Consult.css';
import './styles/buttons.css'; // Import global button styles

const Consult = () => {
  const { brandId } = useParams(); // Capture brandId from URL
  const navigate = useNavigate();
  const [services, setServices] = useState([]); // List of consultation services
  const [newService, setNewService] = useState({ title: '', description: '', price: '', duration: '' });
  const [editingService, setEditingService] = useState(null); // Track the service being edited
  const [walletBalance, setWalletBalance] = useState(0); // Track user's wallet balance
  const [bookingStatus, setBookingStatus] = useState(null); // Track status of a booking
  const [servicesPublished, setServicesPublished] = useState(false); // Track service publish status
  const [isCreator, setIsCreator] = useState(false); // Check if the current user is the brand owner
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (brandId) {
      // Check if the current user is the brand owner
      const brandRef = ref(database, `brands/${brandId}`);
      onValue(brandRef, (snapshot) => {
        if (snapshot.exists()) {
          const brand = snapshot.val();
          setIsCreator(brand.userId === auth.currentUser?.uid);
          setIsPublished(brand.isPublished || false);
          setServicesPublished(brand.isServicesPublished || false); // Set initial publish status for services
        }
      });

      // Fetch services associated with the brand
      const servicesRef = ref(database, `brands/${brandId}/services`);
      onValue(servicesRef, (snapshot) => {
        if (snapshot.exists()) {
          setServices(Object.values(snapshot.val()));
        } else {
          setServices([]);
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

  // Handle publishing or unpublishing the brand services
  const handlePublishServices = async () => {
    if (brandId) {
      const brandRef = ref(database, `brands/${brandId}`);
      const snapshot = await get(brandRef);
      if (snapshot.exists()) {
        const brandData = snapshot.val();
        const updatedStatus = !brandData.isServicesPublished;
        await update(brandRef, { isServicesPublished: updatedStatus });
        setServicesPublished(updatedStatus);
        alert(`Services have been ${updatedStatus ? 'published' : 'unpublished'} successfully!`);
      }
    }
  };

  // Handle adding a new service by the brand owner
  const handleAddService = async () => {
    if (!newService.title || !newService.price || !newService.duration) {
      alert('Please fill in all required fields.');
      return;
    }

    const serviceId = push(ref(database, `brands/${brandId}/services`)).key;
    const service = {
      id: serviceId,
      ...newService,
      price: parseFloat(newService.price),
    };

    await update(ref(database, `brands/${brandId}/services/${serviceId}`), service);
    setServices([...services, service]);
    setNewService({ title: '', description: '', price: '', duration: '' });
  };

  // Handle editing a service
  const handleEditService = (service) => {
    setEditingService(service);
    setNewService(service);
  };

  // Handle updating an existing service
  const handleUpdateService = async () => {
    if (editingService) {
      await update(ref(database, `brands/${brandId}/services/${editingService.id}`), newService);
      setServices(services.map((s) => (s.id === editingService.id ? newService : s)));
      setNewService({ title: '', description: '', price: '', duration: '' });
      setEditingService(null);
    }
  };

  // Handle deleting a service
  const handleDeleteService = async (serviceId) => {
    await remove(ref(database, `brands/${brandId}/services/${serviceId}`));
    setServices(services.filter((service) => service.id !== serviceId));
  };

  // Handle booking a service using the user's wallet balance
  const handleBookService = async (service) => {
    if (!auth.currentUser) {
      alert('Please log in to book a service.');
      return;
    }

    if (walletBalance < service.price) {
      alert('Insufficient balance. Please deposit more funds.');
      return;
    }

    const newBalance = walletBalance - service.price;
    const userId = auth.currentUser.uid;
    const platformFee = service.price * 0.02; // Calculate 2% platform fee
    const providerAmount = service.price - platformFee;

    // Deduct the amount from user's wallet balance and hold it in transition
    await update(ref(database, `users/${userId}/wallet/balance`), newBalance);
    setWalletBalance(newBalance);

    // Create a new booking in Firebase with transition state
    const bookingId = push(ref(database, 'bookings')).key;
    const booking = {
      bookingId,
      serviceId: service.id,
      serviceName: service.title,
      buyerId: userId,
      providerId: brandId,
      price: service.price,
      platformFee,
      providerAmount,
      status: 'pending', // Booking is in transition state until confirmed by provider
      timestamp: Date.now(),
    };
    await update(ref(database, `bookings/${bookingId}`), booking);

    setBookingStatus(`Booking successful! You booked ${service.title} for $${service.price.toFixed(2)} AGMoney. Please confirm receipt once the consultation is completed.`);
  };

  return (
    <div className="consult-container">
      <h2>{isCreator ? 'Manage Your Services' : 'Consultations'}</h2>
      {isCreator && (
        <div className="service-management-container">
          <h3>{editingService ? 'Edit Service' : 'Add New Service'}</h3>
          <input
            type="text"
            placeholder="Service Title"
            value={newService.title}
            onChange={(e) => setNewService({ ...newService, title: e.target.value })}
          />
          <textarea
            placeholder="Service Description"
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price in AGMoney"
            value={newService.price}
            onChange={(e) => setNewService({ ...newService, price: e.target.value })}
          />
          <input
            type="text"
            placeholder="Duration (e.g., 1 hour)"
            value={newService.duration}
            onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
          />
          <button className="add-service-button" onClick={editingService ? handleUpdateService : handleAddService}>
            {editingService ? 'Update Service' : 'Add Service'}
          </button>
          <button className="publish-service-button" onClick={handlePublishServices}>
            {servicesPublished ? 'Unpublish Services' : 'Publish Services'}
          </button>
        </div>
      )}

      <div className="services-list">
        <h3>{services.length > 0 ? 'Available Services' : 'No services available'}</h3>
        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className="service-card">
              <h4>{service.title}</h4>
              <p>{service.description}</p>
              <p>Price: ${service.price.toFixed(2)} AGMoney</p>
              <p>Duration: {service.duration}</p>
              <div className="service-actions">
                {isCreator ? (
                  <>
                    <button className="edit-button" onClick={() => handleEditService(service)}>
                      Edit
                    </button>
                    <button className="delete-button" onClick={() => handleDeleteService(service.id)}>
                      Delete
                    </button>
                  </>
                ) : (
                  <button className="book-button" onClick={() => handleBookService(service)}>
                    Book Now
                  </button>
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

export default Consult;
