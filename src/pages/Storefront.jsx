import React, { useState, useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import Hero from '../components/Hero';
import CategorySelector from '../components/CategorySelector';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { Search, ArrowUpDown, Sparkles } from 'lucide-react';

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

  return (
    <div className="storefront-page">
      <Hero />

      <section id="catalog" className="catalog-section">
        <div className="catalog-header animate-fade" style={{ animationDelay: '0.15s' }}>
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search elegance, rings, necklaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ArrowUpDown size={16} className="text-secondary" />
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '0.5rem 2.5rem 0.5rem 1rem', backgroundPosition: 'right 0.75rem center' }}
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
            <Sparkles className="empty-state-icon text-muted" size={48} style={{ margin: '0 auto 1.5rem auto' }} />
            <p className="empty-state-text">No items match your selection.</p>
            <button
              className="btn btn-secondary"
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

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <footer className="footer">
        <p className="footer-text">
          &copy; {new Date().getFullYear()} <strong>{settings.storeName}</strong>. All rights reserved.
          <br />
          Powered by VOLITECH.
        </p>
      </footer>
    </div>
  );
}
