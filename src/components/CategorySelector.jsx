import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';

export default function CategorySelector({ selectedCategory, onSelectCategory }) {
  const { categories } = useContext(StoreContext);

  return (
    <div className="category-container animate-fade" style={{ animationDelay: '0.1s' }}>
      <button
        className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
        onClick={() => onSelectCategory('All')}
      >
        All Collections
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
