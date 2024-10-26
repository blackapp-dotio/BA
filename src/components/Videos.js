import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Videos.css';

const Videos = () => {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        axios.get('http://127.0.0.1:5000/api/youtube_videos')
            .then(response => setVideos(response.data))
            .catch(error => console.error('Error fetching videos:', error));
    }, []);

    return (
        <div className="videos">
            {videos.map((video, index) => (
                <div key={index} className="video-item">
                    <h3>{video.title}</h3>
                    <iframe src={`https://www.youtube.com/embed/${video.videoId}`} title={video.title}></iframe>
                    <p>{video.description}</p>
                </div>
            ))}
        </div>
    );
};

export default Videos;
