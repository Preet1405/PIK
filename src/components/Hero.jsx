import React, { useState, useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { ArrowRight, Download, Smartphone } from 'lucide-react';
import AppInstallModal from './AppInstallModal';

export default function Hero() {
  const { settings } = useContext(StoreContext);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const scrollToCatalog = () => {
    const section = document.getElementById('products');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAppClick = (e) => {
    e.preventDefault();
    if (settings?.apkUrl) {
      window.open(settings.apkUrl, '_blank');
    } else {
      setIsInstallModalOpen(true);
    }
  };

  return (
    <>
      <section id="home" className="hero animate-fade">
        <h1 className="hero-logo-text">{settings.storeName || 'PIK BAGS & COVERS'}</h1>
        <p className="hero-desc">
          {settings.description || 
            'Browse our curated collection and order directly via WhatsApp for a personal shopping experience.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.25rem' }}>
          <button className="btn btn-primary" onClick={scrollToCatalog} style={{ borderRadius: 'var(--radius-full)', padding: '0.8rem 2rem' }}>
            <span>Browse All Products</span>
            <ArrowRight size={16} />
          </button>
          <button
            onClick={handleAppClick}
            className="btn btn-secondary"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.8rem 1.75rem', gap: '0.5rem', display: 'inline-flex', alignItems: 'center' }}
          >
            <Smartphone size={16} />
            <span>Install / Download App</span>
          </button>
        </div>
      </section>

      <AppInstallModal 
        isOpen={isInstallModalOpen} 
        onClose={() => setIsInstallModalOpen(false)} 
        settings={settings} 
      />
    </>
  );
}

