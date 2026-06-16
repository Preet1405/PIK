import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { ShieldCheck, Eye, LogOut, Cloud } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export default function Navbar({ currentView, onNavigate }) {
  const { settings, isAdminLoggedIn, logoutAdmin, isSyncing } = useContext(StoreContext);

  const handleLogout = () => {
    logoutAdmin();
    onNavigate('store');
  };

  const handleMenuClick = (e, sectionId) => {
    e.preventDefault();
    window.location.hash = sectionId;
    if (currentView !== 'store') {
      onNavigate('store');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={(e) => handleMenuClick(e, 'home')}>
        <img src={logoImg} alt="PIK Logo" className="brand-logo-img" />
      </div>

      <div className="navbar-menu">
        <a href="#home" className="navbar-link" onClick={(e) => handleMenuClick(e, 'home')}>Home</a>
        <a href="#products" className="navbar-link" onClick={(e) => handleMenuClick(e, 'products')}>Products</a>
        <a href="#contact" className="navbar-link" onClick={(e) => handleMenuClick(e, 'contact')}>Contact</a>
      </div>

      <div className="navbar-actions">
        {isSyncing && (
          <div className="sync-badge" title="Globally Synchronized Database active">
            <Cloud size={12} className="animate-pulse" style={{ color: 'var(--accent-coral)' }} />
            <span>Synced</span>
          </div>
        )}

        {currentView === 'store' ? (
          <button 
            className="btn btn-secondary" 
            onClick={() => onNavigate('admin')}
            title="Go to Admin Panel"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
          >
            <ShieldCheck size={14} />
            <span>Admin</span>
          </button>
        ) : (
          <>
            <button 
              className="btn btn-secondary" 
              onClick={() => onNavigate('store')}
              title="View Storefront"
              style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
            >
              <Eye size={14} />
              <span>View Shop</span>
            </button>
            {isAdminLoggedIn && (
              <button 
                className="btn btn-primary" 
                onClick={handleLogout}
                style={{ background: '#ef4444', color: '#fff', boxShadow: 'none', padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                title="Logout from Admin"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
