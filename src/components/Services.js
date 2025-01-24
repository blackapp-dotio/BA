// Services.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue, push, update, remove, get } from 'firebase/database';
import { database, auth } from '../firebaseconfig';
import './Services.css';
import './styles/buttons.css'; // Import global button styles 

const Services = () => {
  const { brandId } = useParams();
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', description: '', price: '' });
  const [editingService, setEditingService] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (brandId) {
      const brandRef = ref(database, `brands/${brandId}`);
      onValue(brandRef, (snapshot) => {
        if (snapshot.exists()) {
          const brandData = snapshot.val();
          setIsPublished(brandData.isPublished || false);
        }
      });
    }
  }, [brandId]);

  useEffect(() => {
    if (brandId) {
      const brandRef = ref(database, `brands/${brandId}`);
      onValue(brandRef, (snapshot) => {
        if (snapshot.exists()) {
          const brand = snapshot.val();
          setIsCreator(brand.userId === auth.currentUser?.uid);
        }
      });

      const servicesRef = ref(database, `brands/${brandId}/services`);
      onValue(servicesRef, (snapshot) => {
        if (snapshot.exists()) {
          setServices(Object.values(snapshot.val()));
        } else {
          setServices([]);
        }
      });
    }
  }, [brandId]);

  // Handle publishing the brand's services
  const handlePublish = async () => {
    const brandRef = ref(database, `brands/${brandId}`);
    const snapshot = await get(brandRef);

    if (snapshot.exists()) {
      const brandData = snapshot.val();
      const updatedStatus = !brandData.isPublished;

      // Update the brand's published status in Firebase
      await update(brandRef, { isPublished: updatedStatus });

      alert(`Brand has been ${updatedStatus ? 'published' : 'unpublished'} successfully!`);
      setIsPublished(updatedStatus); // Update local state to reflect the change
    } else {
      alert('Brand not found. Please try again.');
    }
  };

  // Handle adding a new service
const handleAddService = async () => {
  if (!newService.name || !newService.price) {
    alert('Please fill in all required fields.');
    return;
  }

  const serviceId = push(ref(database, `brands/${brandId}/tools/Services/services`)).key;
  const service = {
    id: serviceId,
    ...newService,
    price: parseFloat(newService.price),
  };

  await update(ref(database, `brands/${brandId}/tools/Services/services/${serviceId}`), service);
  setServices([...services, service]);
  setNewService({ name: '', description: '', price: '' });
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
      setNewService({ name: '', description: '', price: '' });
      setEditingService(null);
    }
  };

  // Handle deleting a service
  const handleDeleteService = async (serviceId) => {
    await remove(ref(database, `brands/${brandId}/services/${serviceId}`));
    setServices(services.filter((service) => service.id !== serviceId));
  };

  return (
    <div className="services-management-container">
      <h2>{isCreator ? 'Manage Your Services' : 'Services'}</h2>

      {isCreator && (
        <div className="add-service-form">
          <h3>{editingService ? 'Edit Service' : 'Add New Service'}</h3>
          <input
            type="text"
            placeholder="Service Name"
            value={newService.name}
            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
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
          <button className="add-service-button" onClick={editingService ? handleUpdateService : handleAddService}>
            {editingService ? 'Update Service' : 'Add Service'}
          </button>
          <button className="publish-button" onClick={handlePublish}>
            {isPublished ? 'Unpublish Services' : 'Publish Services'}
          </button>
        </div>
      )}

      <div className="services-list">
        {services.length > 0 ? (
          services.map((service) => (
            <div key={service.id} className="service-card">
              <h4>{service.name}</h4>
              <p>{service.description}</p>
              <p>Price: ${!isNaN(service.price) ? parseFloat(service.price).toFixed(2) : '0.00'} AGMoney</p>
              {isCreator && (
                <div className="service-actions">
                  <button className="edit-button" onClick={() => handleEditService(service)}>
                    Edit
                  </button>
                  <button className="delete-button" onClick={() => handleDeleteService(service.id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No services available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default Services;
