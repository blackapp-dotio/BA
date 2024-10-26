import React from 'react';
import './Notifications.css';

const Notifications = ({ notifications }) => {
    return (
        <div className="notifications">
            {notifications.map((notification, index) => (
                <div key={index} className="notification">
                    <p>{notification.message}</p>
                </div>
            ))}
        </div>
    );
};

export default Notifications;
