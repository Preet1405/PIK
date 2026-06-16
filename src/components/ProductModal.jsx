import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { MessageSquare, X } from 'lucide-react';

export default function ProductModal({ product, onClose }) {
  const { settings, orderProductViaWhatsapp } = useContext(StoreContext);

  if (!product) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content animate-scale">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="product-modal-grid">
          <div className="product-modal-image-wrap">
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800'}
              alt={product.name}
              className="product-modal-img"
            />
          </div>

          <div className="product-modal-details">
            <span className="product-modal-category">{product.category}</span>
            <h2 className="product-modal-title">{product.name}</h2>
            <p className="product-modal-desc">{product.description}</p>

            <div className="product-modal-footer">
              <span className="product-modal-price-label">Price</span>
              <div className="product-modal-price">
                {settings.currency}{product.price.toLocaleString()}
              </div>

              <button
                onClick={() => orderProductViaWhatsapp(product)}
                className="btn btn-whatsapp"
                disabled={!product.inStock}
              >
                <MessageSquare size={18} />
                <span>Order this item on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
