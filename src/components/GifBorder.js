import React from 'react';
import './GifBorder.css';

const GifBorder = ({ gifs }) => {
    return (
        <div className="gif-border-container">
            <div className="gif-border left">
                {gifs.map((gif, index) => (
                    <div key={index} className="gif-item" style={{ backgroundImage: `url(${gif})` }}></div>
                ))}
            </div>
            <div className="gif-border right">
                {gifs.map((gif, index) => (
                    <div key={index} className="gif-item" style={{ backgroundImage: `url(${gif})` }}></div>
                ))}
            </div>
        </div>
    );
};

export default GifBorder;
