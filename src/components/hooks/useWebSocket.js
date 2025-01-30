import { useEffect, useState } from 'react';

const useWebSocket = (userId) => {
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // For connection status

    useEffect(() => {
        if (!userId) return;

        // Initialize WebSocket connection
        const socket = new WebSocket('wss://your-firebase-function-endpoint/api');

        // Handle WebSocket events
        socket.onopen = () => {
            console.log('WebSocket connected');
            setConnectionStatus('connected');
            socket.send(JSON.stringify({ type: 'connect', userId }));
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('WebSocket message:', message);

            if (message.type === 'newMessage') {
                setMessages((prev) => [...prev, message]);
                setNotifications((prev) => [...prev, message]); // Store notifications for UI updates
            }
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
            setConnectionStatus('disconnected');
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setConnectionStatus('error');
        };

        return () => {
            socket.close(); // Clean up WebSocket connection on component unmount
        };
    }, [userId]);

    return { messages, notifications, connectionStatus };
};

export default useWebSocket;
