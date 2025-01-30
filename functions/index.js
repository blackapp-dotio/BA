const functions = require('firebase-functions'); 
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Ensure you have this installed: npm install node-fetch@2

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Initialize Express App
const app = express();
app.use(cors({ origin: true }));
app.use(express.json()); // Parse incoming JSON requests

/**
 * Proxy endpoint to fetch external resources (e.g., RSS feeds)
 */
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('Missing URL parameter');
    }

    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            console.error(`Error fetching URL: ${targetUrl}, Status: ${response.status}`);
            return res.status(response.status).send(`Failed to fetch resource: ${response.statusText}`);
        }

        const data = await response.text();
        res.set('Content-Type', 'application/xml'); 
        return res.status(200).send(data);
    } catch (error) {
        console.error('Error in proxy:', error.message);
        return res.status(500).send('Error fetching the URL');
    }
});

/**
 * Payment Processing Endpoint
 */
app.post('/process-payment', async (req, res) => {
    const { sourceId, amount } = req.body;

    if (!sourceId || !amount) {
        return res.status(400).send('sourceId or amount is missing');
    }

    const feeAmount = Math.floor(amount * 0.02);

    try {
        const transactionRef = admin.database().ref('transactions').push();
        await transactionRef.set({
            id: transactionRef.key,
            senderId: req.body.senderId,
            recipientId: req.body.recipientId,
            amount,
            status: 'pending',
            platformFee: feeAmount,
            timestamp: Date.now(),
        });

        return res.json({ success: true, message: 'Payment processed successfully.' });
    } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Firebase Realtime Database Trigger - Notify on New Messages
 */
exports.sendNewMessageNotification = functions.database.ref('/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
        const message = snapshot.val();
        console.log('New message detected:', message);

        if (!message.recipientId) {
            console.error('Message recipient is missing');
            return null;
        }

        try {
            const recipientRef = admin.database().ref(`/users/${message.recipientId}`);
            const recipientSnapshot = await recipientRef.once('value');
            const recipientData = recipientSnapshot.val();

            if (!recipientData) {
                console.error('Recipient user data not found');
                return null;
            }

            // Store unread message count
            const unreadRef = admin.database().ref(`/unread_messages/${message.recipientId}`);
            const unreadSnapshot = await unreadRef.once('value');
            let unreadCount = unreadSnapshot.val() || 0;
            unreadCount += 1;
            await unreadRef.set(unreadCount);

            console.log(`New unread message count for ${message.recipientId}:`, unreadCount);
        } catch (error) {
            console.error('Error updating unread message count:', error);
        }
        return null;
    });

/**
 * Export the Express app as an HTTP function
 */
exports.api = functions.https.onRequest(app);
