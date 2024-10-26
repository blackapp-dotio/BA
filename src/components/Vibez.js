import React, { useState, useEffect } from 'react';
import { ref, push, onValue, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, auth } from '../firebase';
import { Camera } from 'react-camera-pro';
import './Vibez.css';

const Vibez = () => {
    const [vibez, setVibez] = useState([]);
    const [videoFile, setVideoFile] = useState(null);
    const [useCamera, setUseCamera] = useState(false);
    const [capturedVideo, setCapturedVideo] = useState(null);
    const [newVibe, setNewVibe] = useState({
        title: '',
        description: '',
    });
    const [activeTab, setActiveTab] = useState('feed');

    useEffect(() => {
        fetchVibezFeed();
    }, []);

    const fetchVibezFeed = () => {
        const vibezRef = ref(database, 'vibez');
        onValue(vibezRef, (snapshot) => {
            const vibezData = snapshot.val();
            const loadedVibez = vibezData ? Object.keys(vibezData).map(key => vibezData[key]) : [];
            setVibez(loadedVibez);
        });
    };

    const handleVibeCreation = async (e) => {
        e.preventDefault();

        let videoUrl = '';
        if (videoFile) {
            const storage = getStorage();
            const videoStorageRef = storageRef(storage, `vibez/${auth.currentUser.uid}/${videoFile.name}`);
            await uploadBytes(videoStorageRef, videoFile);
            videoUrl = await getDownloadURL(videoStorageRef);
        } else if (capturedVideo) {
            videoUrl = capturedVideo;
        }

        const vibeData = {
            ...newVibe,
            videoUrl,
            creatorId: auth.currentUser.uid,
            timestamp: new Date().getTime(),
        };

        const newVibeRef = push(ref(database, 'vibez'));
        await update(newVibeRef, vibeData);

        setVibez([...vibez, vibeData]);
        setNewVibe({ title: '', description: '' });
        setVideoFile(null);
        setCapturedVideo(null);
        setUseCamera(false);
    };

    const handleVideoChange = (e) => {
        setVideoFile(e.target.files[0]);
    };

    const handleCaptureVideo = (videoBlob) => {
        setCapturedVideo(URL.createObjectURL(videoBlob));
        setUseCamera(false);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'feed':
                return (
                    <div className="vibez-feed">
                        <h2 className="section-title">Vibez Feed</h2>
                        <div className="rss-vibez-section">
                            <iframe
                                width="900"
                                height="1600"
                                src="https://rss.app/embed/v1/wall/8AmhIEioy0LVLjcI"
                                title="Vibez RSS Feed"
                            ></iframe>
                        </div>
                        <div className="vibez-list">
                            {vibez.map((vibe, index) => (
                                <div key={index} className="vibe-item">
                                    <h3>{vibe.title}</h3>
                                    <video controls>
                                        <source src={vibe.videoUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                    <p>{vibe.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'create':
                return (
                    <div className="create-vibe-form-container">
                        <h2 className="section-title">Create Your Vibe</h2>
                        <form onSubmit={handleVibeCreation} className="create-vibe-form">
                            <input
                                type="text"
                                name="title"
                                placeholder="Vibe Title"
                                value={newVibe.title}
                                onChange={(e) => setNewVibe({ ...newVibe, title: e.target.value })}
                                className="input-field"
                                required
                            />
                            <textarea
                                name="description"
                                placeholder="Vibe Description"
                                value={newVibe.description}
                                onChange={(e) => setNewVibe({ ...newVibe, description: e.target.value })}
                                className="input-field"
                            />
                            {useCamera ? (
                                <div className="camera-container">
                                    <Camera onCapture={handleCaptureVideo} />
                                </div>
                            ) : (
                                <div className="video-upload-options">
                                    <label htmlFor="video-upload" className="video-upload-label">
                                        Upload Video
                                    </label>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoChange}
                                        className="input-field video-input"
                                        id="video-upload"
                                    />
                                    <button
                                        type="button"
                                        className="camera-button"
                                        onClick={() => setUseCamera(true)}
                                    >
                                        Use Camera
                                    </button>
                                </div>
                            )}
                            <button type="submit" className="submit-button">
                                Post Vibe
                            </button>
                        </form>
                    </div>
                );
            case 'myVibez':
                return (
                    <div className="vibez-list">
                        <h2 className="section-title">My Vibez</h2>
                        {vibez
                            .filter((vibe) => vibe.creatorId === auth.currentUser.uid)
                            .map((vibe, index) => (
                                <div key={index} className="vibe-item">
                                    <h3>{vibe.title}</h3>
                                    <video controls>
                                        <source src={vibe.videoUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                    <p>{vibe.description}</p>
                                </div>
                            ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="vibez-page">
            <div className="tabs">
                <button
                    className={`tab-button ${activeTab === 'feed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feed')}
                >
                    Vibez Feed
                </button>
                <button
                    className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                >
                    Create Vibez
                </button>
                <button
                    className={`tab-button ${activeTab === 'myVibez' ? 'active' : ''}`}
                    onClick={() => setActiveTab('myVibez')}
                >
                    My Vibez
                </button>
            </div>
            <div className="tab-content">{renderTabContent()}</div>
        </div>
    );
};

export default Vibez;
