import React from 'react';
import Wallet from './Wallet';
import './MyStuff.css';

const MyStuff = () => {
    return (
        <div className="my-stuff-container">
            <h2>My Stuff</h2>
            <div className="my-stuff-content">
                {/* Other content */}
                <Wallet />
                {/* Other components like items user owns, subscriptions, etc. */}
            </div>
        </div>
    );
};

export default MyStuff;