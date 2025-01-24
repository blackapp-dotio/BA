import React, { useState, useEffect } from 'react';
import { ref, push, update, remove, onValue } from 'firebase/database';
import { database } from '../firebaseconfig';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import './ToolStyles.css';

const ShopTool = ({ brandId }) => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ id: null, name: '', price: '', description: '', image: null });
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const productsRef = ref(database, `brands/${brandId}/tools/shop/products`);
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProducts(Object.values(data));
      } else {
        setProducts([]);
      }
    }, (error) => {
      console.error("Failed to retrieve products:", error);
      setErrorMessage("Failed to load products. Please try again.");
    });

    return () => unsubscribe();
  }, [brandId]);

  const handleImageUpload = async (file) => {
    const storage = getStorage();
    const imageRef = storageRef(storage, `brands/${brandId}/shop/images/${file.name}`);
    try {
      await uploadBytes(imageRef, file);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Image upload failed.");
    }
  };

  const saveProduct = async () => {
    setErrorMessage('');
    try {
      const productData = { ...newProduct };
      if (newProduct.image) {
        productData.imageUrl = await handleImageUpload(newProduct.image);
      }
      const productRef = ref(database, `brands/${brandId}/tools/shop/products/${newProduct.id || push(ref(database, `brands/${brandId}/tools/shop/products`)).key}`);
      await update(productRef, productData);
      resetForm();
    } catch (error) {
      setErrorMessage(error.message || "Failed to save product.");
    }
  };

  const editProduct = (product) => {
    setNewProduct(product);
    setIsEditing(true);
  };

  const deleteProduct = async (productId) => {
    try {
      await remove(ref(database, `brands/${brandId}/tools/shop/products/${productId}`));
    } catch (error) {
      setErrorMessage("Failed to delete product.");
    }
  };

  const resetForm = () => {
    setNewProduct({ id: null, name: '', price: '', description: '', image: null });
    setIsEditing(false);
  };

  return (
    <div className="tool-container">
      <h3>Shop Products</h3>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <input type="text" placeholder="Product Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
      <input type="number" placeholder="Product Price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
      <textarea placeholder="Product Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
      <input type="file" onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files[0] })} />
      <button onClick={saveProduct} className="tool-button">{isEditing ? 'Update Product' : 'Add Product'}</button>
      {isEditing && <button onClick={resetForm} className="tool-button">Cancel Edit</button>}

      <h4>Existing Products</h4>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <p>{product.name} - ${product.price}</p>
            <p>{product.description}</p>
            {product.imageUrl && <img src={product.imageUrl} alt={product.name} />}
            <button onClick={() => editProduct(product)}>Edit</button>
            <button onClick={() => deleteProduct(product.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ShopTool;
