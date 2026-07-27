import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { StoreContext } from '../context/StoreContext';
import { MessageSquare, ArrowLeft, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductModal({ product, onClose }) {
  const { settings, orderProductViaWhatsapp } = useContext(StoreContext);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLightboxZoomed, setIsLightboxZoomed] = useState(false);

  // Touch/swipe state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const thumbnailsRef = useRef(null);

  // Reset lightbox zoom when changing images
  useEffect(() => {
    setIsLightboxZoomed(false);
  }, [activeImgIndex, isLightboxOpen]);

  if (!product) return null;

  // Resolve multiple images with backward compatibility
  const images = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : (product.imageUrl ? [product.imageUrl] : []);

  const activeImage = images[activeImgIndex] || images[0] || '';

  // Navigate between images
  const goNext = useCallback(() => {
    setActiveImgIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setActiveImgIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (isLightboxOpen) {
        if (e.key === 'ArrowRight') goNext();
        if (e.key === 'ArrowLeft') goPrev();
        if (e.key === 'Escape') setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLightboxOpen, goNext, goPrev]);

  // Auto-scroll thumbnail strip to keep active thumb visible
  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeTh = thumbnailsRef.current.children[activeImgIndex];
      if (activeTh) {
        activeTh.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeImgIndex]);

  // Touch swipe handlers for image strip
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only treat as horizontal swipe if more horizontal than vertical
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Zoom on hover (desktop)
  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <>
      <div className="product-detail-container animate-fade">
        {/* Back to shop header link */}
        <button className="back-to-shop-btn" onClick={onClose} aria-label="Back to products list">
          <ArrowLeft size={16} />
          <span>Back to Products</span>
        </button>

        <div className="product-detail-grid">
          {/* ─── Image Column ─── */}
          <div className="product-detail-image-wrap">
            {/* Main Image with tap-to-zoom & swipe support */}
            <div
              className={`product-detail-main-img-container ${isZoomed ? 'zoomed' : ''}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setIsZoomed(false)}
              onClick={() => setIsLightboxOpen(true)}
              style={{
                cursor: 'zoom-in',
                ...(isZoomed ? {
                  backgroundImage: `url(${activeImage})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                } : {})
              }}
            >
              <img
                src={activeImage}
                alt={product.name}
                className={`product-detail-main-img ${isZoomed ? 'zoom-hidden' : ''}`}
              />

              {/* Prev/Next arrows (shown when multiple images) */}
              {images.length > 1 && (
                <>
                  <button
                    className="img-nav-btn img-nav-prev"
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    className="img-nav-btn img-nav-next"
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    aria-label="Next image"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              {/* Zoom / Expand button */}
              <button
                className="img-zoom-btn"
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                title="Zoom image"
                aria-label="Open full-screen image"
              >
                <ZoomIn size={18} />
              </button>

              {/* Dot indicators */}
              {images.length > 1 && (
                <div className="img-dot-indicators" onClick={(e) => e.stopPropagation()}>
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      className={`img-dot ${idx === activeImgIndex ? 'active' : ''}`}
                      onClick={() => setActiveImgIndex(idx)}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Tap to zoom hint */}
              <div
                className="img-zoom-hint"
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
              >
                🔍 Tap / Click to zoom
              </div>
            </div>

            {/* Thumbnail strip — scrollable */}
            {images.length > 1 && (
              <div className="product-detail-thumbnails" ref={thumbnailsRef}>
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

          {/* ─── Details Column ─── */}
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

      {/* ─── Fullscreen Lightbox / Zoom View ─── */}
      {isLightboxOpen && (
        <div
          className="lightbox-overlay"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            className="lightbox-close"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            <X size={26} />
          </button>

          <div
            className="lightbox-inner"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={activeImage}
              alt={product.name}
              className={`lightbox-img ${isLightboxZoomed ? 'lightbox-img-zoomed' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxZoomed(prev => !prev);
              }}
              style={{
                cursor: isLightboxZoomed ? 'zoom-out' : 'zoom-in',
                transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                transform: isLightboxZoomed ? 'scale(1.85)' : 'scale(1)'
              }}
            />

            {images.length > 1 && (
              <>
                <button
                  className="lightbox-nav lightbox-prev"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  className="lightbox-nav lightbox-next"
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  aria-label="Next image"
                >
                  <ChevronRight size={28} />
                </button>

                {/* Counter */}
                <div className="lightbox-counter">
                  {activeImgIndex + 1} / {images.length} • {isLightboxZoomed ? 'Tap to fit' : 'Tap to zoom'}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
