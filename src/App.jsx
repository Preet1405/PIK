import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import Navbar from './components/Navbar';
import Storefront from './pages/Storefront';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  // Simple router state: 'store' | 'admin'
  const [currentView, setCurrentView] = useState('store');

  return (
    <div className="app-container">
      <Navbar currentView={currentView} onNavigate={setCurrentView} />
      <main>
        {currentView === 'store' ? (
          <Storefront />
        ) : (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
