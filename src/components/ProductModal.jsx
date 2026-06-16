import React, { useContext, useState } from 'react';
import { StoreContext } from '../context/StoreContext';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export default function ProductModal({ product, onClose }) {
  const { settings, orderProductViaWhatsapp } = useContext(StoreContext);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  if (!product) return null;

  // Resolve multiple images with backward compatibility
  const images = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : [product.imageUrl || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800'];

  // Ensure index remains in bounds if images count changes
  const activeImage = images[activeImgIndex] || images[0] || '';

  return (
    <div className="product-detail-container animate-fade">
      {/* Back to shop header link */}
      <button className="back-to-shop-btn" onClick={onClose} aria-label="Back to products list">
        <ArrowLeft size={16} />
        <span>Back to Products</span>
      </button>

      <div className="product-detail-grid">
        <div className="product-detail-image-wrap">
          <div className="product-detail-main-img-container">
            <img
              src={activeImage}
              alt={product.name}
              className="product-detail-main-img"
            />
          </div>
          
          {/* Clickable thumbnails list */}
          {images.length > 1 && (
            <div className="product-detail-thumbnails">
              {images.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`${product.name} thumbnail ${idx + 1}`}
                  className={`product-detail-thumbnail-img ${idx === activeImgIndex ? 'active' : ''}`}
                  onClick={() => setActiveImgIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-details">
          <span className="product-detail-category">{product.category}</span>
          <h1 className="product-detail-title">{product.name}</h1>
          
          <div className="product-detail-price-wrap">
            <span className="product-detail-price-label">Price</span>
            <div className="product-detail-price">
              {settings.currency}{product.price.toLocaleString()}
            </div>
          </div>

          <p className="product-detail-desc">{product.description}</p>

          <div className="product-detail-action-wrap">
            <button
              onClick={() => orderProductViaWhatsapp(product)}
              className="btn btn-whatsapp"
              disabled={!product.inStock}
              style={{ width: '100%', display: 'flex', gap: '0.75rem', padding: '0.85rem 1.5rem', fontSize: '1rem', borderRadius: 'var(--radius-md)' }}
            >
              <MessageSquare size={20} />
              <span>Order this item on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
