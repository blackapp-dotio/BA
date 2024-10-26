// Shop.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, push, update, remove, get } from 'firebase/database';
import { database, auth } from '../firebaseconfig';
import './Shop.css';
import './styles/buttons.css'; // Import global button styles

const Shop = () => {
  const { brandId } = useParams(); // Capture brandId from URL
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', imageUrl: '' });
  const [editingProduct, setEditingProduct] = useState(null); // Track the product being edited
  const [walletBalance, setWalletBalance] = useState(0);
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [shopPublished, setShopPublished] = useState(false); // Track shop publish status
  const [isCreator, setIsCreator] = useState(false); // Check if the current user is the brand owner

  useEffect(() => {
    if (brandId) {
      // Check if the current user is the brand owner
      const brandRef = ref(database, `brands/${brandId}`);
      onValue(brandRef, (snapshot) => {
        if (snapshot.exists()) {
          const brand = snapshot.val();
          setIsCreator(brand.userId === auth.currentUser?.uid);
          setShopPublished(brand.isPublished || false);
        }
      });

      // Fetch products associated with the brand
      const productsRef = ref(database, `brands/${brandId}/products`);
      onValue(productsRef, (snapshot) => {
        if (snapshot.exists()) {
          setProducts(Object.values(snapshot.val()));
        }
      });

      // Fetch user's wallet balance for purchasing
      const fetchUserBalance = () => {
        if (auth.currentUser) {
          const balanceRef = ref(database, `users/${auth.currentUser.uid}/wallet/balance`);
          onValue(balanceRef, (snapshot) => {
            setWalletBalance(snapshot.val() || 0);
          });
        }
      };
      fetchUserBalance();
    }
  }, [brandId]);

  // Handle adding a new product by the brand owner
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Please fill in all required fields.');
      return;
    }

    const productId = push(ref(database, `brands/${brandId}/products`)).key;
    const product = {
      id: productId,
      ...newProduct,
      price: parseFloat(newProduct.price),
    };

    await update(ref(database, `brands/${brandId}/products/${productId}`), product);
    setProducts([...products, product]);
    setNewProduct({ name: '', description: '', price: '', imageUrl: '' });
  };

  // Handle editing a product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct(product);
  };

  // Handle updating an existing product
  const handleUpdateProduct = async () => {
    if (editingProduct) {
      await update(ref(database, `brands/${brandId}/products/${editingProduct.id}`), newProduct);
      setProducts(products.map((p) => (p.id === editingProduct.id ? newProduct : p)));
      setNewProduct({ name: '', description: '', price: '', imageUrl: '' });
      setEditingProduct(null);
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId) => {
    await remove(ref(database, `brands/${brandId}/products/${productId}`));
    setProducts(products.filter((product) => product.id !== productId));
  };

  // Handle purchasing a product using the user's wallet balance
  const handlePurchase = async (product) => {
    if (!auth.currentUser) {
      alert('Please log in to make a purchase.');
      return;
    }

    if (walletBalance < product.price) {
      alert('Insufficient balance. Please deposit more funds.');
      return;
    }

    const newBalance = walletBalance - product.price;
    const userId = auth.currentUser.uid;
    const platformFee = product.price * 0.02; // Calculate 2% platform fee
    const sellerAmount = product.price - platformFee;

    // Deduct the amount from user's wallet balance and hold it in transition
    await update(ref(database, `users/${userId}/wallet/balance`), newBalance);
    setWalletBalance(newBalance);

    // Create a new order in Firebase with transition state
    const orderId = push(ref(database, 'orders')).key;
    const order = {
      orderId,
      productId: product.id,
      productName: product.name,
      buyerId: userId,
      sellerId: brandId,
      price: product.price,
      platformFee,
      sellerAmount,
      status: 'pending', // Order is in transition state until confirmed by buyer
      timestamp: Date.now(),
    };
    await update(ref(database, `orders/${orderId}`), order);

    setPurchaseStatus(`Purchase successful! You bought ${product.name} for $${product.price.toFixed(2)} AGMoney. Please confirm receipt once the product is delivered.`);
  };

  // Handle publishing or unpublishing the shop
  const handlePublishShop = async () => {
    await update(ref(database, `brands/${brandId}`), { isPublished: !shopPublished });
    setShopPublished(!shopPublished);
    alert(shopPublished ? 'Shop unpublished successfully.' : 'Shop published successfully.');
  };

  return (
    <div className="shop-container">
      <h2>{isCreator ? 'Manage Your Shop' : 'Shop'}</h2>
      {isCreator && (
        <div className="shop-management-container">
          <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <input
            type="text"
            placeholder="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <textarea
            placeholder="Product Description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price in AGMoney"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          />
          <input
            type="text"
            placeholder="Image URL (optional)"
            value={newProduct.imageUrl}
            onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
          />
          <button className="add-product-button" onClick={editingProduct ? handleUpdateProduct : handleAddProduct}>
            {editingProduct ? 'Update Product' : 'Add Product'}
          </button>
          <button className="publish-shop-button" onClick={handlePublishShop}>
            {shopPublished ? 'Unpublish Shop' : 'Publish Shop'}
          </button>
        </div>
      )}

      <div className="products-list">
        <h3>{products.length > 0 ? 'Available Products' : 'No products available'}</h3>
        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.imageUrl || 'https://via.placeholder.com/150'} alt={product.name} />
              <h4>{product.name}</h4>
              <p>{product.description}</p>
              <p>Price: ${product.price.toFixed(2)} AGMoney</p>
              <div className="product-actions">
                {isCreator ? (
                  <>
                    <button className="edit-button" onClick={() => handleEditProduct(product)}>
                      Edit
                    </button>
                    <button className="delete-button" onClick={() => handleDeleteProduct(product.id)}>
                      Delete
                    </button>
                  </>
                ) : (
                  <button className="purchase-button" onClick={() => handlePurchase(product)}>
                    Buy Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {purchaseStatus && <p className="purchase-status">{purchaseStatus}</p>}
    </div>
  );
};

export default Shop;