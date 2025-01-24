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

        const data = await response.text(); // Retrieve the RSS feed data as text
        res.set('Content-Type', 'application/xml'); // Ensure correct content type for RSS/Atom feeds
        return res.status(200).send(data);
    } catch (error) {
        console.error('Error in proxy:', error.message);
        return res.status(500).send('Error fetching the URL');
    }
});

/**
 * Example: Payment Processing Endpoint
 */
app.post('/process-payment', async (req, res) => {
    const { sourceId, amount } = req.body;

    if (!sourceId || !amount) {
        return res.status(400).send('sourceId or amount is missing');
    }

    const feeAmount = Math.floor(amount * 0.02); // 2% platform fee in cents

    try {
        // Simulate payment processing and record the transaction
        const transactionRef = admin.database().ref('transactions').push();
        await transactionRef.set({
            id: transactionRef.key,
            senderId: req.body.senderId,
            recipientId: req.body.recipientId,
            amount,
            status: 'pending', // Initial status is set to pending
            platformFee: feeAmount,
            timestamp: Date.now(),
        });

        return res.json({ success: true, message: 'Payment processed successfully.' });
    } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Export the Express app for Firebase Functions
exports.api = functions.https.onRequest(app);
