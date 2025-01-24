import React, { useState, useEffect } from 'react';
import { ref, push, update, remove, onValue } from 'firebase/database';
import { database } from '../firebaseconfig';
import { calculatePlatformFee } from '../utils/feeUtils';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ToolStyles.css';

// Helper function for media uploads
const handleMediaUpload = async (file, path) => {
  const storage = getStorage();
  const mediaRef = storageRef(storage, path);
  try {
    await uploadBytes(mediaRef, file);
    return await getDownloadURL(mediaRef);
  } catch (error) {
    console.error("Error uploading media:", error);
    throw new Error("Media upload failed. Please try again.");
  }
};

const ServicesTool = ({ brandId }) => {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ id: null, name: '', price: '', description: '', image: null });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const servicesRef = ref(database, `brands/${brandId}/tools/services/services`);
    onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      setServices(data ? Object.values(data) : []);
    });
  }, [brandId]);

  const saveService = async () => {
    try {
      const serviceData = { ...newService };
      if (newService.image) {
        serviceData.imageUrl = await handleMediaUpload(newService.image, `brands/${brandId}/services/images/${newService.image.name}`);
      }

      const serviceRef = ref(database, `brands/${brandId}/tools/services/services/${newService.id || push(ref(database, `brands/${brandId}/tools/services/services`)).key}`);
      await update(serviceRef, serviceData);
      resetForm();
    } catch (error) {
      alert(error.message);
    }
  };

  const editService = (service) => {
    setNewService(service);
    setIsEditing(true);
  };

  const deleteService = async (serviceId) => {
    try {
      await remove(ref(database, `brands/${brandId}/tools/services/services/${serviceId}`));
    } catch (error) {
      alert("Failed to delete service. Please try again.");
      console.error("Error deleting service:", error);
    }
  };

  const resetForm = () => {
    setNewService({ id: null, name: '', price: '', description: '', image: null });
    setIsEditing(false);
  };

  const handlePurchase = (price) => {
    const { platformFee, totalAmount } = calculatePlatformFee(price, 'purchase');
    alert(`Total Amount: $${totalAmount} (includes platform fee of $${platformFee})`);
  };

  return (
    <div className="tool-container">
      <h3>Services</h3>
      <input type="text" placeholder="Service Name" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
      <input type="number" placeholder="Service Price" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
      <textarea placeholder="Service Description" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
      <input type="file" onChange={(e) => setNewService({ ...newService, image: e.target.files[0] })} />
      <button onClick={saveService} className="tool-button">{isEditing ? 'Update Service' : 'Add Service'}</button>
      {isEditing && <button onClick={resetForm} className="tool-button">Cancel Edit</button>}

      <h4>Existing Services</h4>
      <ul>
        {services.map((service) => (
          <li key={service.id}>
            <p>{service.name} - ${service.price}</p>
            <p>{service.description}</p>
            {service.imageUrl && <img src={service.imageUrl} alt={service.name} />}
            <button onClick={() => editService(service)}>Edit</button>
            <button onClick={() => deleteService(service.id)}>Delete</button>
            <button onClick={() => handlePurchase(service.price)}>Purchase</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServicesTool;
