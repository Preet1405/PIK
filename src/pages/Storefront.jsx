import React, { useState, useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import Hero from '../components/Hero';
import CategorySelector from '../components/CategorySelector';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { 
  Search, 
  ArrowUpDown, 
  Sparkles, 
  Mail, 
  PhoneCall, 
  MessageSquare, 
  MapPin, 
  ExternalLink 
} from 'lucide-react';

export default function Storefront() {
  const { products, settings } = useContext(StoreContext);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [priceSort, setPriceSort] = useState('default');

  // Filter products
  const filteredProducts = products
    .filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (priceSort === 'low-to-high') return a.price - b.price;
      if (priceSort === 'high-to-low') return b.price - a.price;
      return 0; // default order
    });

  const handleContactAction = (type) => {
    if (type === 'email') {
      window.open('mailto:bagscovers1978@gmail.com', '_blank');
    } else if (type === 'call') {
      window.open('tel:9869468143', '_blank');
    } else if (type === 'whatsapp') {
      window.open('https://wa.me/919869468143?text=Hello%20PIK%20Bags%20%26%20Covers!', '_blank');
    } else if (type === 'map') {
      window.open('https://maps.app.goo.gl/5MZBfiAMHytTAoQM8?g_st=ic', '_blank');
    }
  };

  return (
    <div className="storefront-page animate-fade">
      {/* Home / Hero Section */}
      <Hero />

      {/* Products Catalog Section */}
      <section id="products" className="section-container">


        <div className="catalog-header animate-scale">
          <div className="search-container">
            <div className="search-input-wrap">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search bags, sleeves, custom covers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            {searchQuery && (
              <button 
                className="btn btn-secondary" 
                onClick={() => setSearchQuery('')}
                style={{ padding: '0.5rem 1rem' }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ArrowUpDown size={16} style={{ color: 'var(--text-secondary)' }} />
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '0.5rem 2.5rem 0.5rem 1rem', borderRadius: 'var(--radius-md)', backgroundPosition: 'right 0.75rem center' }}
            >
              <option value="default">Default Sort</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
            </select>
          </div>
        </div>

        <CategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {filteredProducts.length === 0 ? (
          <div className="empty-state animate-scale">
            <Sparkles className="empty-state-icon text-muted" size={48} style={{ margin: '0 auto 1.25rem auto' }} />
            <p className="empty-state-text">No items match your selection.</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
                setPriceSort('default');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-container" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="section-title-wrap">
          <h2 className="section-title">Get In Touch</h2>
        </div>

        <div className="contact-grid">
          {/* Contact Cards */}
          <div className="contact-cards-container">
            <div className="contact-card" onClick={() => handleContactAction('whatsapp')}>
              <div className="contact-card-icon-wrap" style={{ background: 'rgba(37, 211, 102, 0.1)', color: 'var(--accent-whatsapp)' }}>
                <MessageSquare size={24} />
              </div>
              <span className="contact-card-title">WhatsApp Support</span>
              <span className="contact-card-value">9869468143</span>
            </div>

            <div className="contact-card" onClick={() => handleContactAction('call')}>
              <div className="contact-card-icon-wrap" style={{ background: 'rgba(231, 111, 81, 0.1)', color: 'var(--accent-coral)' }}>
                <PhoneCall size={24} />
              </div>
              <span className="contact-card-title">Call Us Direct</span>
              <span className="contact-card-value">9869468143</span>
            </div>

            <div className="contact-card" onClick={() => handleContactAction('email')}>
              <div className="contact-card-icon-wrap" style={{ background: 'rgba(128, 44, 92, 0.1)', color: 'var(--accent-gold)' }}>
                <Mail size={24} />
              </div>
              <span className="contact-card-title">Email Inquiry</span>
              <span className="contact-card-value" style={{ fontSize: '0.85rem' }}>bagscovers1978@gmail.com</span>
            </div>

            <div className="contact-card" onClick={() => handleContactAction('map')}>
              <div className="contact-card-icon-wrap" style={{ background: 'rgba(128, 44, 92, 0.1)', color: 'var(--accent-gold)' }}>
                <MapPin size={24} />
              </div>
              <span className="contact-card-title">Our Location</span>
              <span className="contact-card-value" style={{ fontSize: '0.8rem', textAlign: 'center' }}>Avishkar Towers, Borivali West, Mumbai</span>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div className="contact-map-card">
            <iframe 
              src="https://maps.google.com/maps?q=Sachin+Novelty+Avishkar+Towers+Borivali+West+Mumbai&t=&z=16&ie=UTF8&iwloc=&output=embed"
              className="contact-map-iframe"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="PIK Location Map"
            />
            <button 
              className="btn btn-secondary" 
              onClick={() => handleContactAction('map')}
              style={{ width: '100%' }}
            >
              <ExternalLink size={16} />
              <span>Open in Google Maps</span>
            </button>
          </div>
        </div>
      </section>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">
          &copy; {new Date().getFullYear()} <strong>{settings.storeName}</strong>. All rights reserved.
          <br />
          Powered by <span style={{ fontWeight: '600' }}>VOLITECH</span>.
        </p>
      </footer>
    </div>
  );
}
