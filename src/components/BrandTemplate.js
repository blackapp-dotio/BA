import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { query, orderByChild, equalTo } from 'firebase/database';
import { ref, onValue, update, push } from 'firebase/database';
import { database, auth } from '../firebaseconfig';
import { calculatePlatformFee } from '../utils/feeUtils';
import './BrandTemplate.css';

const BrandTemplate = () => {
  const { brandId } = useParams();
  const [brandData, setBrandData] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactionSummary, setTransactionSummary] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [shareStatus, setShareStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // Default payment method
  const { businessName } = useParams();
   console.log("URL Params:", useParams());


useEffect(() => {
    console.log("Business Name from URL Params:", businessName);
    
        if (!businessName) {
        setErrorMessage("Business name is missing. Cannot load brand data.");
        setLoading(false);
        return;
    }

    // Query by businessName
    const brandsRef = ref(database, 'brands');
    const queryRef = query(brandsRef, orderByChild('businessName'), equalTo(businessName));

    onValue(queryRef, (snapshot) => {
        if (snapshot.exists()) {
            // Since businessName is unique, take the first matching brand
            const data = Object.values(snapshot.val())[0];

            if (data.isPublished) {
                const shopItems = data.tools?.shop
                    ? Object.entries(data.tools.shop).map(([key, value]) => ({ id: key, ...value }))
                    : [];
                const bookings = data.tools?.booking
                    ? Object.entries(data.tools.booking).map(([key, value]) => ({ id: key, ...value }))
                    : [];
                const services = data.tools?.services
                    ? Object.entries(data.tools.services).map(([key, value]) => ({ id: key, ...value }))
                    : [];
                const blogPosts = data.tools?.blog
                    ? Object.entries(data.tools.blog).map(([key, value]) => ({ id: key, ...value }))
                    : [];

                setBrandData({
                    ...data,
                    shopItems,
                    bookings,
                    services,
                    blogPosts,
                });
            } else {
                setErrorMessage("This brand is not currently published.");
            }
        } else {
            setErrorMessage(`Brand with the name ${businessName} not found.`);
        }
        setLoading(false);
    });

    // Wallet balance logic remains unchanged
    if (auth.currentUser) {
        const balanceRef = ref(database, `users/${auth.currentUser.uid}/wallet/balance`);
        onValue(balanceRef, (snapshot) => {
            const balance = parseFloat(snapshot.val()) || 0;
            setWalletBalance(balance);
        });
    }
}, [businessName]);

  const openTransactionSummary = (item) => {
    const price = parseFloat(item.price);
    if (isNaN(price)) {
      setErrorMessage("Invalid item price.");
      return;
    }

    const { platformFee, totalAmount } = calculatePlatformFee(price, 'purchase');

    setTransactionSummary({
      itemName: item.name || item.title,
      itemPrice: price,
      platformFee,
      totalAmount,
    });
    setSelectedItem(item);
  };

  const confirmPurchase = async () => {
    if (!transactionSummary || !selectedItem) {
      setPurchaseStatus("Transaction data is missing.");
      return;
    }

    const { totalAmount, platformFee, itemPrice } = transactionSummary;

    const buyerId = auth.currentUser?.uid;
    const sellerId = brandData.userId;

    try {
      if (paymentMethod === 'wallet') {
        if (!buyerId) {
          setPurchaseStatus("You must be logged in to use your wallet.");
          return;
        }

        if (walletBalance < totalAmount) {
          setPurchaseStatus("Insufficient balance in wallet.");
          return;
        }

        const newBalance = walletBalance - totalAmount;

        // Update buyer's wallet balance
        await update(ref(database, `users/${buyerId}/wallet`), { balance: newBalance });

        // Record the transaction
        const transactionId = push(ref(database, 'transactions')).key;
        const transaction = {
          transactionId,
          buyerId,
          sellerId,
          itemId: selectedItem.id,
          itemName: selectedItem.name || selectedItem.title,
          price: itemPrice,
          platformFee,
          totalAmount,
          timestamp: Date.now(),
          paymentMethod: 'wallet',
          status: 'pending',
        };

        await update(ref(database, `transactions/${transactionId}`), transaction);
        setPurchaseStatus("Payment successful! Awaiting confirmation.");
      } else if (paymentMethod === 'paypal') {
        const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${sellerId}&item_name=${selectedItem.name}&amount=${totalAmount}&currency_code=USD`;
        window.open(paypalUrl, '_blank');
        setPurchaseStatus("Redirected to PayPal for payment.");
      } else if (paymentMethod === 'cashapp') {
        const cashAppUrl = `https://cash.app/$${sellerId}/${totalAmount}`;
        window.open(cashAppUrl, '_blank');
        setPurchaseStatus("Redirected to CashApp for payment.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPurchaseStatus("Transaction failed. Please try again.");
    } finally {
      setTimeout(() => {
        closeTransactionSummary();
        setPurchaseStatus('');
      }, 3000);
    }
  };

  const closeTransactionSummary = () => {
    setTransactionSummary(null);
    setSelectedItem(null);
    setPurchaseStatus('');
  };

const copyBrandLink = () => {
    if (!brandData || !brandData.businessName) {
        setShareStatus("Brand name is not available.");
        return;
    }

    const brandLink = `${window.location.origin}/brand/${brandData.businessName}`;
    navigator.clipboard.writeText(brandLink).then(() => {
        setShareStatus("Link copied to clipboard!");
        setTimeout(() => setShareStatus(''), 2000);
    });
};

  if (!brandData) return <p>{errorMessage || "Loading brand data..."}</p>;

const renderToolItems = (items, toolName) => (
  items.map((item) => (
    <div key={item.id} className="item-card">
      {item.imageUrl && (
        <a href={item.imageUrl} target="_blank" rel="noopener noreferrer">
          <img src={item.imageUrl} alt={item.name || item.title} className="item-image" />
        </a>
      )}
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <p>Price: ${parseFloat(item.price).toFixed(2)}</p>
      <button onClick={() => openTransactionSummary(item)}>Purchase {toolName}</button>
      <button onClick={() => handleShareToFeed(item, toolName)}>Share to Feed</button>
    </div>
  ))
);

const handleShareToFeed = async (item, toolName) => {
  const shareMessage = `Check out this ${toolName}: ${item.name}! ${item.description}`;
  const imageUrl = item.imageUrl || '';
  const brandOrProductLink = `${window.location.origin}/brand/${brandData.businessName}/product/${item.id}`;

  try {
    const postId = push(ref(database, 'feed')).key;

    const post = {
      id: postId,
      userId: auth.currentUser?.uid,
      displayName: auth.currentUser?.displayName || 'Anonymous',
      type: toolName,
      text: `${shareMessage}\nView more: ${brandOrProductLink}`,
      link: brandOrProductLink,
      imageUrl,
      timestamp: Date.now(),
    };

    await update(ref(database, `feed/${postId}`), post);
    alert(`${toolName} shared to feed successfully.`);
  } catch (error) {
    console.error('Error sharing to feed:', error);
    alert('Failed to share to feed.');
  }
};


  return (
    <div className="brand-header">
    {brandData.logoUrl && (
        <img 
            src={brandData.logoUrl} 
            alt={brandData.businessName} 
            className="brand-logo" 
        />
    )}
    <h1 className="brand-name">{brandData.businessName}</h1>
    {brandData.description && <p className="brand-description">{brandData.description}</p>}
      <button onClick={copyBrandLink} className="copy-link-button">Copy Brand Link</button>
      {shareStatus && <p className="share-status">{shareStatus}</p>}

      {brandData.shopItems.length > 0 && (
        <div className="brand-products">
          <h2>Products</h2>
          {renderToolItems(brandData.shopItems, 'Product')}
        </div>
      )}

      {brandData.bookings.length > 0 && (
        <div className="brand-bookings">
          <h2>Bookings</h2>
          {renderToolItems(brandData.bookings, 'Booking')}
        </div>
      )}

      {brandData.services.length > 0 && (
        <div className="brand-services">
          <h2>Services</h2>
          {renderToolItems(brandData.services, 'Service')}
        </div>
      )}

      {transactionSummary && (
        <div className="transaction-summary-modal">
          <div className="transaction-summary-content">
            <h3>Transaction Summary</h3>
            <p><strong>Item:</strong> {transactionSummary.itemName}</p>
            <p><strong>Item Price:</strong> ${transactionSummary.itemPrice.toFixed(2)}</p>
            <p><strong>Platform Fee (2%):</strong> ${transactionSummary.platformFee.toFixed(2)}</p>
            <p><strong>Total Amount:</strong> ${transactionSummary.totalAmount.toFixed(2)}</p>
            <div className="payment-methods">
              <label>
                <input
                  type="radio"
                  name="payment-method"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Platform Wallet
              </label>
              <label>
                <input
                  type="radio"
                  name="payment-method"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                PayPal
              </label>
              <label>
                <input
                  type="radio"
                  name="payment-method"
                  value="cashapp"
                  checked={paymentMethod === 'cashapp'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                CashApp
              </label>
            </div>
            <div className="transaction-summary-actions">
              <button onClick={confirmPurchase}>Confirm Purchase</button>
              <button onClick={closeTransactionSummary}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {purchaseStatus && (
        <p className="purchase-status">{purchaseStatus}</p>
      )}
    </div>
     
   )
};

export default BrandTemplate;