import React, { useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { ShieldCheck, Eye, LogOut } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export default function Navbar({ currentView, onNavigate }) {
  const { settings, isAdminLoggedIn, logoutAdmin } = useContext(StoreContext);

  const handleLogout = () => {
    logoutAdmin();
    onNavigate('store');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => onNavigate('store')}>
        <img src={logoImg} alt="PIK Logo" className="brand-logo-img" />
        <span className="brand-name">{settings.storeName || 'PIK Bags & Covers'}</span>
      </div>

      <div className="navbar-actions">
        {currentView === 'store' ? (
          <button 
            className="btn btn-secondary" 
            onClick={() => onNavigate('admin')}
            title="Go to Admin Panel"
          >
            <ShieldCheck size={16} />
            <span>Admin Portal</span>
          </button>
        ) : (
          <>
            <button 
              className="btn btn-secondary" 
              onClick={() => onNavigate('store')}
              title="View Storefront"
            >
              <Eye size={16} />
              <span>View Shop</span>
            </button>
            {isAdminLoggedIn && (
              <button 
                className="btn btn-primary" 
                onClick={handleLogout}
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: '#fff', boxShadow: 'none' }}
                title="Logout from Admin"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
