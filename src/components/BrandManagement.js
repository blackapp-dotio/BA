import React, { useState, useEffect } from 'react';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, auth } from '../firebaseconfig';
import { useParams } from 'react-router-dom';
import './BrandManagement.css';

const BrandManagement = () => {
    const { brandId } = useParams();
    const [brandData, setBrandData] = useState({});
    const [isOwner, setIsOwner] = useState(false);
    const [selectedTool, setSelectedTool] = useState('');
    const [toolData, setToolData] = useState([]);
    const [newEntry, setNewEntry] = useState({});
    const [isConfigured, setIsConfigured] = useState(false);
    const [publishStatus, setPublishStatus] = useState('');
    const [copyStatus, setCopyStatus] = useState('');

    useEffect(() => {
        const fetchBrandData = async () => {
            const brandRef = ref(database, `brands/${brandId}`);
            onValue(brandRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setBrandData(data);
                    if (auth.currentUser?.uid === data.userId) {
                        setIsOwner(true);
                    }
                }
            });
        };

        fetchBrandData();
    }, [brandId]);

    const handleToolSelection = (tool) => {
        setSelectedTool(tool);
        fetchToolData(tool);
    };

    const fetchToolData = (tool) => {
        const toolRef = ref(database, `brands/${brandId}/tools/${tool}`);
        onValue(toolRef, (snapshot) => {
            if (snapshot.exists()) {
                setToolData(Object.values(snapshot.val()));
                setIsConfigured(true);
            } else {
                setToolData([]);
                setIsConfigured(false);
            }
        });
    };

  const handleCopyLink = () => {
    const brandUrl = `${window.location.origin}/brand/${brandId}`;
    navigator.clipboard.writeText(brandUrl)
      .then(() => {
        setCopyStatus('Link copied to clipboard!');
        setTimeout(() => setCopyStatus(''), 2000); // Clear status after 2 seconds
      })
      .catch(() => {
        setCopyStatus('Failed to copy link.');
      });
  };


    const handleImageUpload = async (file) => {
        const storage = getStorage();
        const imageRef = storageRef(storage, `brands/${brandId}/${selectedTool}/${file.name}`);
        await uploadBytes(imageRef, file);
        return await getDownloadURL(imageRef);
    };

    const handleAddEntry = async () => {
        let imageUrl = '';
        if (newEntry.image) {
            imageUrl = await handleImageUpload(newEntry.image);
        }

        const entryId = push(ref(database, `brands/${brandId}/tools/${selectedTool}`)).key;
        const entryData = {
            id: entryId,
            ...newEntry,
            imageUrl: imageUrl,
        };

        await update(ref(database, `brands/${brandId}/tools/${selectedTool}/${entryId}`), entryData);
        setToolData([...toolData, { ...entryData, id: entryId }]);
        setNewEntry({});
        alert(`${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} entry added successfully.`);
    };

    const handleDeleteEntry = async (entryId) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            await remove(ref(database, `brands/${brandId}/tools/${selectedTool}/${entryId}`));
            setToolData(toolData.filter((item) => item.id !== entryId));
            alert('Entry deleted successfully.');
        }
    };

    const handlePublishToggle = async () => {
        if (!isOwner || !brandData) return;

        try {
            const newStatus = !brandData.isPublished;
            await update(ref(database, `brands/${brandId}`), { isPublished: newStatus });
            setBrandData((prevData) => ({ ...prevData, isPublished: newStatus }));
            setPublishStatus(newStatus ? 'Brand published successfully!' : 'Brand unpublished.');
            setTimeout(() => setPublishStatus(''), 2000);
        } catch (error) {
            console.error("Error updating publish status:", error);
            setPublishStatus('Failed to update publish status.');
        }
    };

const handleUpdateEntry = async () => {
  let imageUrl = newEntry.imageUrl; // Retain existing image URL if not updated
  if (newEntry.image && typeof newEntry.image === 'object') {
    imageUrl = await handleImageUpload(newEntry.image);
  }

  const entryRef = ref(database, `brands/${brandId}/tools/${selectedTool}/${newEntry.id}`);
  const updatedEntry = { ...newEntry, imageUrl };

  await update(entryRef, updatedEntry); // Update in Firebase
  setToolData(toolData.map((item) => (item.id === newEntry.id ? updatedEntry : item))); // Update state
  setNewEntry({}); // Reset the form
  alert(`${selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)} updated successfully.`);
};


const handleShareEntry = async (entry) => {
  const shareMessage = `Check out this ${selectedTool}: ${entry.name || entry.title}! ${entry.description}`;
  const brandOrProductLink = `${window.location.origin}/brand/${brandId}`;
  const shareUrl = entry.imageUrl || ''; // Include product image link if available

  if (navigator.share) {
    navigator.share({
      title: entry.name || entry.title,
      text: shareMessage,
      url: brandOrProductLink,
    }).catch((error) => console.error('Error sharing:', error));
  } else {
    navigator.clipboard
      .writeText(`${shareMessage}\nView more: ${brandOrProductLink}`)
      .then(() => alert('Link copied to clipboard. Share it anywhere!'))
      .catch((error) => console.error('Error copying link:', error));
  }

  try {
    const postId = push(ref(database, 'feed')).key;

    const post = {
      id: postId,
      userId: auth.currentUser?.uid,
      displayName: auth.currentUser?.displayName || 'Anonymous',
      type: selectedTool,
      text: shareMessage,
      link: brandOrProductLink,
      imageUrl: shareUrl,
      timestamp: Date.now(),
    };

    await update(ref(database, `feed/${postId}`), post);
    alert(`${selectedTool} shared to feed successfully.`);
  } catch (error) {
    console.error('Error sharing to feed:', error);
    alert('Failed to share entry to feed.');
  }
};



const handleEditEntry = (entry) => {
  setNewEntry(entry); // Populate the form with the selected entry's data
};

const saveBusinessNameMapping = async (brandId, businessName) => {
    const sanitizedBusinessName = businessName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    await update(ref(database, `businessNames/${sanitizedBusinessName}`), { brandId });
};



const renderToolForm = () => {
  switch (selectedTool) {
    case 'shop':
      return (
        <>
          <input
            type="text"
            placeholder="Product Name"
            value={newEntry.name || ''}
            onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
            className="entry-input"
          />
          <textarea
            placeholder="Description"
            value={newEntry.description || ''}
            onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
            className="entry-textarea"
          ></textarea>
          <input
            type="number"
            placeholder="Price"
            value={newEntry.price || ''}
            onChange={(e) => setNewEntry({ ...newEntry, price: e.target.value })}
            className="entry-input"
          />
          <input
            type="file"
            onChange={(e) => setNewEntry({ ...newEntry, image: e.target.files[0] })}
            className="entry-input"
          />
          <button onClick={newEntry.id ? handleUpdateEntry : handleAddEntry} className="entry-button">
            {newEntry.id ? 'Update Product' : 'Add Product'}
          </button>
        </>
      );
 
            case 'blog':
                return (
                    <>
                        <input
                            type="text"
                            placeholder="Title"
                            value={newEntry.title || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                            className="entry-input"
                        />
                        <textarea
                            placeholder="Content"
                            value={newEntry.content || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                            className="entry-textarea"
                        ></textarea>
                        <input
                            type="number"
                            placeholder="Price"
                            value={newEntry.price || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, price: e.target.value })}
                            className="entry-input"
                        />
                        <input
                            type="file"
                            onChange={(e) => setNewEntry({ ...newEntry, image: e.target.files[0] })}
                            className="entry-input"
                        />
                        <button onClick={handleAddEntry} className="entry-button">Add Blog Post</button>
                    </>
                );
            case 'booking':
                return (
                    <>
                        <input
                            type="text"
                            placeholder="Reservation Name"
                            value={newEntry.name || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                            className="entry-input"
                        />
                        <input
                            type="number"
                            placeholder="Price"
                            value={newEntry.price || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, price: e.target.value })}
                            className="entry-input"
                        />
                        <input
                            type="file"
                            onChange={(e) => setNewEntry({ ...newEntry, image: e.target.files[0] })}
                            className="entry-input"
                        />
                        <button onClick={handleAddEntry} className="entry-button">Add Reservation</button>
                    </>
                );
            case 'services':
                return (
                    <>
                        <input
                            type="text"
                            placeholder="Service Name"
                            value={newEntry.name || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                            className="entry-input"
                        />
                        <textarea
                            placeholder="Description"
                            value={newEntry.description || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                            className="entry-textarea"
                        ></textarea>
                        <input
                            type="number"
                            placeholder="Price"
                            value={newEntry.price || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, price: e.target.value })}
                            className="entry-input"
                        />
                        <input
                            type="file"
                            onChange={(e) => setNewEntry({ ...newEntry, image: e.target.files[0] })}
                            className="entry-input"
                        />
                        <button onClick={handleAddEntry} className="entry-button">Add Service</button>
                    </>
                );
            default:
                return null;
        }
    };

    if (!isOwner) {
        return <div>You do not have permission to manage this brand.</div>;
    }

    return (
        <div className="brand-management-container">
            <h2>Manage {brandData.businessName}</h2>

            {/* Publish/Unpublish Button */}
            <button onClick={handlePublishToggle} className="publish-button">
                {brandData.isPublished ? 'Unpublish Brand' : 'Publish Brand'}
            </button>
            {publishStatus && <p className="publish-status">{publishStatus}</p>}
            
       

            {/* Tool Selector */}
            <div className="tool-selection">
                <label>Select Tool to Configure: </label>
                <select value={selectedTool} onChange={(e) => handleToolSelection(e.target.value)}>
                    <option value="">--Select Tool--</option>
                    <option value="shop">Shop</option>
                    <option value="blog">Blog</option>
                    <option value="booking">Booking</option>
                    <option value="services">Services</option>
                </select>
            </div>
            
    <div className="brand-management-container">
      <h2>Manage {brandData.businessName}</h2>

      {/* Copy Link Section */}
      <div className="share-section">
        <button className="copy-link-button" onClick={handleCopyLink}>
          Copy Sharable Link
        </button>
        {copyStatus && <p className="copy-status">{copyStatus}</p>}
      </div>

            {selectedTool && (
                <div className="tool-management">
                    <h3>{selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}</h3>
                    {renderToolForm()}
<div className="tool-entries">
  <h4>Existing Entries</h4>
  {toolData.map((entry) => (
    <div key={entry.id} className="entry">
      <h5>{entry.name || entry.title}</h5>
      <p>{entry.description || entry.content}</p>
      <p>Price: ${entry.price || ''}</p>
      {entry.imageUrl && <img src={entry.imageUrl} alt={entry.name || entry.title} />}
      <button onClick={() => handleEditEntry(entry)} className="edit-button">Edit</button>
      <button onClick={() => handleDeleteEntry(entry.id)} className="delete-button">Delete</button>
      <button onClick={() => handleShareEntry(entry)} className="share-button">Share</button>
    </div>
  ))}
</div>
                </div>
            )}
        </div>
      </div> 	 
    );
};

export default BrandManagement;
