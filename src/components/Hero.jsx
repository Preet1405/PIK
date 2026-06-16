import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { ArrowDown } from 'lucide-react';

export default function Hero() {
  const { settings } = useContext(StoreContext);

  const scrollToCatalog = () => {
    const section = document.getElementById('catalog');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero animate-fade">
      <span className="hero-subtitle">{settings.tagline || 'Exquisite Collection'}</span>
      <h1 className="hero-title">{settings.storeName || 'Aura Luxe Atelier'}</h1>
      <p className="hero-desc">
        {settings.description || 
          'Discover our handcrafted collection of bespoke creations designed for the modern connoisseur.'}
      </p>
      <button className="btn btn-primary" onClick={scrollToCatalog}>
        <span>Browse Catalog</span>
        <ArrowDown size={16} />
      </button>
    </section>
  );
}
