import { useState, useEffect } from 'react';

const useWebSocket = () => {
    const [ws, setWs] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const wsUrl = 'wss://us-central1-wakandan-app.cloudfunctions.net/api'; // Replace with your actual WebSocket URL

        // Establish WebSocket connection
        const socket = new WebSocket(wsUrl);
        console.log('Attempting to connect to WebSocket:', wsUrl);

        socket.onopen = () => {
            console.log('WebSocket connection established on client');
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('New WebSocket message received:', message);

                // Update messages state
                setMessages((prevMessages) => [...prevMessages, message]);

                // Optionally display a browser notification
                if (Notification.permission === 'granted') {
                    new Notification(`New message from ${message.senderName}`, {
                        body: message.text,
                        icon: '/path-to-notification-icon.png',
                    });
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error.message);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error occurred:', error);
        };

        socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event.reason);
        };

        setWs(socket);

        // Cleanup on component unmount
        return () => {
            console.log('Cleaning up WebSocket connection');
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, []);

    const sendMessage = (message) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('Sending message via WebSocket:', message);
            ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not open. Cannot send message.');
        }
    };

    return {
        sendMessage,
        messages,
    };
};

export default useWebSocket;
