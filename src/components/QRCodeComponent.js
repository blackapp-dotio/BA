import React, { useState, useEffect } from 'react';
import { FaQrcode, FaCamera } from 'react-icons/fa';
import { QrReader } from 'react-qr-reader'; // Import QR code reader
import { useNavigate } from 'react-router-dom'; // Use useNavigate for navigation
import './QRCodeComponent.css'; // Import the custom styles

const QRCodeComponent = ({ user, handleScan }) => {
  const [scannerOpen, setScannerOpen] = useState(false); // Control scanner visibility
  const [qrCodeUrl, setQrCodeUrl] = useState(''); // Store the generated QR code URL
  const [scanResult, setScanResult] = useState(null); // Store scan result
  const [paymentStatus, setPaymentStatus] = useState(null); // Payment status message
  const navigate = useNavigate(); // useNavigate hook for navigation

  useEffect(() => {
    // Generate QR code when user is available
    if (user) {
      generateQRCode();
    }
  }, [user]);

  // Function to handle QR code scanning and routing
  const onScan = (data) => {
    if (data) {
      try {
        // Parse recipientId from the scanned URL
        const urlParams = new URLSearchParams(new URL(data).search);
        const recipientId = urlParams.get('recipientId');

        if (recipientId) {
          setScanResult({ recipientId, message: 'Scan successful! Redirecting...' });
          setPaymentStatus(`Scan successful! Redirecting to send money to ${recipientId}`);
          handleScan(recipientId); // Call parent function to handle scan result

          // Redirect to the wallet send money page with recipientId
          navigate(`/wallet/sendMoney/${recipientId}`, { state: { recipientId } });
        } else {
          setPaymentStatus('Invalid QR code. Recipient ID not found.');
        }
      } catch (error) {
        setPaymentStatus('Error decoding QR code.');
        console.error('QR Code Decoding Error:', error);
      }
      setScannerOpen(false); // Close scanner after scanning
    }
  };

  const onScanError = (error) => {
    console.error('QR Scan Error:', error);
    setScannerOpen(false);
  };

  // Function to generate a QR code URL based on user data
  const generateQRCode = () => {
    if (user) {
      const baseUrl = 'https://wakandan-app.web.app/wallet/sendMoney/${recipientId}';
      const qrCodeUrl = `${baseUrl}?action=sendMoney&recipientId=${user.uid}&username=${encodeURIComponent(user.displayName || 'Anonymous')}`;
      setQrCodeUrl(qrCodeUrl);
    }
  };

  return (
    <div className="qr-code-container">
      <h3 className="qr-code-title">Your Black Card <FaQrcode /></h3>
      {/* QR Code Image */}
      {qrCodeUrl && (
        <>
          <img className="qr-code-image" src={qrCodeUrl} alt="Coming Soon" />
          <p className="qr-code-description">Scan this QR code to send money directly to your wallet.</p>
        </>
      )}
      {/* QR Code Scanner Button */}
      <button className="scan-btn" onClick={() => setScannerOpen(true)}>
        <FaCamera /> Click to Scan QR Code
      </button>

      {/* QR Code Scanner Interface */}
      {scannerOpen && (
        <div className="scanner-container">
          <h4><FaQrcode /> Scan a QR Code</h4>
          <QrReader
            delay={300}
            onError={onScanError}
            onResult={onScan}
            style={{ width: '100%' }}
            constraints={{ facingMode: 'environment' }} // Use rear camera
          />
          <button className="close-scan-btn" onClick={() => setScannerOpen(false)}>Close Scanner</button>
        </div>
      )}

      {/* Display Scan Result */}
      {scanResult && (
        <div className="scan-result">
          <h4>Scan Result:</h4>
          <p>{JSON.stringify(scanResult)}</p>
        </div>
      )}

      {/* Payment Status Message */}
      {paymentStatus && (
        <div className="scan-result">
          <h4>Status:</h4>
          <p>{paymentStatus}</p>
        </div>
      )}
    </div>
  );
};

export default QRCodeComponent;
