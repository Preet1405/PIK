import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, ExternalLink, CheckCircle, Share2, PlusSquare } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function AppInstallModal({ isOpen, onClose, settings }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (settings?.apkUrl) {
      window.open(settings.apkUrl, '_blank');
    }
  };

  return (
    <div className="modal-backdrop animate-fade" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content animate-scale" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '500px', width: '90%', padding: '1.75rem', borderRadius: '1.25rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={logoImg} 
              alt="PIK Logo" 
              style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'contain', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }} 
            />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>Install PIK App</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Instant access on Android & iOS</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)' }}
          >
            <X size={18} />
          </button>
        </div>

        {isInstalled ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: '0.75rem' }} />
            <h4>PIK App Installed!</h4>
            <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>You can now access PIK Bags & Covers directly from your phone home screen.</p>
          </div>
        ) : (
          <div>
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick} 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.85rem', marginBottom: '1.25rem', justifyContent: 'center', fontSize: '0.95rem', fontWeight: '600' }}
              >
                <Download size={18} />
                <span>1-Tap Install App to Home Screen</span>
              </button>
            )}

            {settings?.apkUrl && (
              <a
                href={settings.apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.85rem', marginBottom: '1.25rem', justifyContent: 'center', fontSize: '0.95rem', fontWeight: '600', textDecoration: 'none', display: 'flex', gap: '0.5rem' }}
              >
                <Download size={18} />
                <span>Download Direct APK File</span>
                <ExternalLink size={14} />
              </a>
            )}

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Smartphone size={16} />
                <span>Android Installation</span>
              </h4>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.825rem', opacity: 0.85, lineHeight: 1.6 }}>
                <li>Open this site in <strong>Google Chrome</strong> on Android.</li>
                <li>Tap the <strong>three dots (⋮)</strong> menu in top right corner.</li>
                <li>Tap <strong>"Add to Home Screen"</strong> or <strong>"Install app"</strong>.</li>
              </ol>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Share2 size={16} />
                <span>iPhone / iOS Installation</span>
              </h4>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.825rem', opacity: 0.85, lineHeight: 1.6 }}>
                <li>Open this site in <strong>Safari</strong> on iPhone.</li>
                <li>Tap the <strong>Share</strong> button <Share2 size={12} style={{ display: 'inline' }} /> at bottom of screen.</li>
                <li>Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare size={12} style={{ display: 'inline' }} />.</li>
              </ol>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={onClose} style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.5rem', fontSize: '0.825rem' }}>
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
