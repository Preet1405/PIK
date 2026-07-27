import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { MessageSquare, ArrowUpRight } from 'lucide-react';

export default function ProductCard({ product, onViewDetails }) {
  const { settings, orderProductViaWhatsapp } = useContext(StoreContext);

  const handleOrder = (e) => {
    e.stopPropagation(); // Avoid triggering open detail modal
    orderProductViaWhatsapp(product);
  };

  const displayImage = product.imageUrl || (product.imageUrls && product.imageUrls[0]) || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600';

  return (
    <div className="product-card animate-fade" onClick={() => onViewDetails(product)}>
      <div className="product-card-image-wrap">
        <img
          src={displayImage}
          alt={product.name}
          className="product-card-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600';
          }}
        />
        <span className={`product-card-badge ${!product.inStock ? 'out-of-stock' : ''}`}>
          {product.inStock ? product.category : 'Out of Stock'}
        </span>
      </div>

      <div className="product-card-info">
        <span className="product-card-category">{product.category}</span>
        <h3 className="product-card-title">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>

        <div className="product-card-footer">
          <span className="product-card-price">
            {settings.currency}{product.price.toLocaleString()}
          </span>
          <button
            onClick={handleOrder}
            className="btn btn-whatsapp"
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
            disabled={!product.inStock}
          >
            <MessageSquare size={16} />
            <span className="product-card-btn-text">Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
