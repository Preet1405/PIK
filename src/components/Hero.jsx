import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { ArrowRight } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export default function Hero() {
  const { settings } = useContext(StoreContext);

  const scrollToCatalog = () => {
    const section = document.getElementById('products');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero animate-fade">
      <img src={logoImg} alt={settings.storeName} className="hero-logo-large" />
      <p className="hero-desc">
        {settings.description || 
          'Browse our curated collection and order directly via WhatsApp for a personal shopping experience.'}
      </p>
      <button className="btn btn-primary" onClick={scrollToCatalog} style={{ borderRadius: 'var(--radius-full)', padding: '0.8rem 2rem' }}>
        <span>Browse All Products</span>
        <ArrowRight size={16} />
      </button>
    </section>
  );
}
