const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { Client, Environment, ApiError } = require('square');

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const database = admin.database(); // Access to the Realtime Database

// Initialize Square client (Sandbox or Production depending on environment)
const squareClient = new Client({
    environment: Environment.Sandbox, // Use Environment.Production for live
    accessToken: functions.config().square.access_token, // Securely store access token in Firebase config
});

const app = express();

// Allow CORS for specific origins, including your production URL
const allowedOrigins = ['http://localhost:3000', 'https://wakandan-app.web.app'];

app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json()); // Ensure JSON parsing for requests

// Payment processing with Square and 2% platform fee deduction
app.post('/api/process-payment', async (req, res) => {
    const { sourceId, amount } = req.body;

    if (!sourceId || !amount) {
        return res.status(400).send('sourceId or amount is missing');
    }

    const feeAmount = Math.floor(amount * 0.02); // 2% platform fee in cents
    const totalAmount = amount + feeAmount; // Total amount to charge

    try {
        const { result } = await squareClient.paymentsApi.createPayment({
            sourceId,
            idempotencyKey: `${Date.now()}`,
            amountMoney: {
                amount: totalAmount, // Amount in cents
                currency: 'USD',
            },
            appFeeMoney: {
                amount: feeAmount, // The 2% platform fee to be deducted
            },
        });

        // Log the transaction in Firebase
        const transactionRef = database.ref('transactions').push();
        await transactionRef.set({
            id: transactionRef.key,
            senderId: req.body.senderId,
            recipientId: req.body.recipientId,
            amount,
            status: 'pending', // Initial status is set to pending
            platformFee: feeAmount,
            timestamp: Date.now(),
        });

        // Trigger a notification to the admin for new transactions
        const notificationRef = database.ref('notifications').push();
        await notificationRef.set({
            id: notificationRef.key,
            message: `New transaction of $${amount / 100} initiated.`,
            read: false,
            timestamp: Date.now(),
        });

        res.json({ success: true, payment: result });
    } catch (error) {
        if (error instanceof ApiError) {
            res.status(400).json({ success: false, error: error.errors[0].detail });
        } else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// Export the Express app for Firebase Functions
exports.processPayment = functions.https.onRequest(app);

// Admin role management function
exports.setAdminRole = functions.https.onCall(async (data, context) => {
    const { uid, action } = data;
    if (!context.auth || !context.auth.token.admin) {
        return { message: 'Request not authorized. User must be an admin.' };
    }

    try {
        if (action === 'grant') {
            await admin.auth().setCustomUserClaims(uid, { admin: true });
        } else if (action === 'revoke') {
            await admin.auth().setCustomUserClaims(uid, { admin: false });
        }
        return { message: `Admin role ${action === 'grant' ? 'granted' : 'revoked'} successfully.` };
    } catch (error) {
        return { message: `Error updating admin role: ${error.message}` };
    }
});

// Notifications management function
exports.createNotification = functions.database.ref('/transactions/{transactionId}/status')
    .onUpdate(async (change, context) => {
        const status = change.after.val();
        const transactionId = context.params.transactionId;

        if (status === 'disputed' || status === 'refunded' || status === 'released') {
            const notificationRef = database.ref('notifications').push();
            const message = `Transaction ${transactionId} status updated to ${status}.`;

            await notificationRef.set({
                id: notificationRef.key,
                message,
                read: false,
                timestamp: Date.now(),
            });
        }
    });
