import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { ArrowRight, Download } from 'lucide-react';

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
      <h1 className="hero-logo-text">SACHIN NOVELTY</h1>
      <p className="hero-desc">
        {settings.description || 
          'Browse our curated collection and order directly via WhatsApp for a personal shopping experience.'}
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.25rem' }}>
        <button className="btn btn-primary" onClick={scrollToCatalog} style={{ borderRadius: 'var(--radius-full)', padding: '0.8rem 2rem' }}>
          <span>Browse All Products</span>
          <ArrowRight size={16} />
        </button>
        <a
          href="/pik-bags-and-covers.apk"
          download="PIK_BAGS_AND_COVERS.apk"
          className="btn btn-secondary"
          style={{ borderRadius: 'var(--radius-full)', padding: '0.8rem 1.75rem', gap: '0.5rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          <Download size={16} />
          <span>Download Android App (.apk)</span>
        </a>
      </div>
    </section>
  );
}
