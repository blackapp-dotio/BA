// momoTransfer.js (Frontend Implementation)
import React, { useState } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const MomoTransfer = () => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [recipientMsisdn, setRecipientMsisdn] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  // Function to get access token from MTN MoMo API
  const getAccessToken = async () => {
    try {
      const response = await axios.post('https://sandbox.momodeveloper.mtn.com/remittance/v1_0/token/', null, {
        headers: {
          Authorization: `Basic ${btoa(`${process.env.REACT_APP_MOMO_USER_ID}:${process.env.REACT_APP_MOMO_API_KEY}`)}`,
          'Ocp-Apim-Subscription-Key': process.env.REACT_APP_MOMO_SUBSCRIPTION_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error.response ? error.response.data : error.message);
      throw error;
    }
  };

  // Function to initiate a transfer (remittance) to a MoMo account
  const initiateTransfer = async () => {
    try {
      // Get access token
      const accessToken = await getAccessToken();
      const referenceId = uuidv4(); // Generate a unique transaction ID

      // Prepare the transfer request payload
      const transferPayload = {
        amount,
        currency,
        externalId: '123456789',
        payee: {
          partyIdType: 'MSISDN',
          partyId: recipientMsisdn,
        },
        payerMessage: 'Payment for services rendered',
        payeeNote: message,
      };

      // Make the transfer request
      const response = await axios.post('https://sandbox.momodeveloper.mtn.com/remittance/v1_0/transfer', transferPayload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId, // Unique identifier for this transfer
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': process.env.REACT_APP_MOMO_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json',
        },
      });

      console.log('Transfer initiated successfully:', response.data);
      setStatus(`Transfer successful. Reference ID: ${referenceId}`);
    } catch (error) {
      console.error('Error initiating transfer:', error.response ? error.response.data : error.message);
      setStatus('Transfer failed. See console for more details.');
    }
  };

  return (
    <div>
      <h2>MoMo Transfer</h2>
      <input
        type="text"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        type="text"
        placeholder="Recipient MSISDN"
        value={recipientMsisdn}
        onChange={(e) => setRecipientMsisdn(e.target.value)}
      />
      <input
        type="text"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={initiateTransfer}>Initiate Transfer</button>
      <p>Status: {status}</p>
    </div>
  );
};

export default MomoTransfer;
