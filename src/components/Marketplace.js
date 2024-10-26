import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './Marketplace.css';

const Marketplace = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            const productsCollection = await getDocs(collection(db, 'products'));
            setProducts(productsCollection.docs.map(doc => doc.data()));
        };

        fetchProducts();
    }, []);

    return (
        <div className="marketplace-container">
            <h2>Marketplace</h2>
            <div className="products-list">
                {products.map((product, index) => (
                    <div key={index} className="product-item">
                        <img src={product.imageURL} alt={product.name} className="product-image" />
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <button className="buy-button">Buy for {product.price} Tokens</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Marketplace;
