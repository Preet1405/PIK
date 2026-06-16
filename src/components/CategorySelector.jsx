import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function CategorySelector({ selectedCategory, onSelectCategory }) {
  const { categories, products } = useContext(StoreContext);

  const getProductCount = (category) => {
    if (category === 'All') return products.length;
    return products.filter((p) => p.category === category).length;
  };

  return (
    <div className="category-container animate-fade" style={{ animationDelay: '0.1s' }}>
      <button
        className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
        onClick={() => onSelectCategory('All')}
      >
        <span>All</span>
        <span className="category-pill-count">({getProductCount('All')})</span>
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
          onClick={() => onSelectCategory(category)}
        >
          <span>{category}</span>
          <span className="category-pill-count">({getProductCount(category)})</span>
        </button>
      ))}
    </div>
  );
}
