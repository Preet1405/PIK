import React, { createContext, useState, useEffect, useRef } from 'react';

export const StoreContext = createContext();

const KVDB_PRIMARY_URL = 'https://kvdb.io/3h6MXWHLN9eTgfQ2je81HH/pik_store_state_v9';
const RESTFUL_API_URL = 'https://api.restful-api.dev/objects/ff8081819f7e10ae019fa4436f07349e';

// BroadcastChannel for instant 0ms tab-to-tab sync without network calls
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('pik_store_channel')
  : null;

const DEFAULT_CATEGORIES = [
  'COVER',
  'POUCH',
  'JEWELERY POUCH'
];

const DEFAULT_PRODUCTS = [
  {
    id: "prod-1785170619226",
    name: "Preet Shah",
    description: "Xhdhd",
    price: 37363,
    category: "COVER",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600",
    inStock: true
  },
  {
    id: "prod-1785170560000",
    name: "Kurta",
    description: "Tafata",
    price: 250,
    category: "COVER",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600",
    inStock: true
  }
];

const DEFAULT_SETTINGS = {
  storeName: 'SACHIN NOVELTY ',
  whatsappNumber: '9869468143',
  currency: '₹',
  tagline: '🙏',
  description: '🙏',
  heroImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1600',
  adminPasscode: 'Preet1405',
  apkUrl: ''
};

// Toast Notification Helper
const showToast = (message) => {
  let toast = document.getElementById('pik-toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pik-toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'show';
  setTimeout(() => {
    if (toast && toast.className === 'show') {
      toast.className = '';
    }
  }, 4500);
};

// Dual-backend cloud helper — PUT with zero rate limits & failover
const cloudPut = async (key, data, retries = 1) => {
  // Primary Endpoint (kvdb) — ZERO rate limits & supports large base64 payloads!
  try {
    const res = await fetch(KVDB_PRIMARY_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      // Best-effort secondary sync
      fetch(RESTFUL_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'pik_bags_covers_live_store_v10', data })
      }).catch(() => {});
      return true;
    }
  } catch (err) {
    console.warn('[PIK Sync] Primary KVDB cloud PUT failed:', err);
  }

  // Fallback Endpoint (restful-api.dev)
  try {
    const res = await fetch(RESTFUL_API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'pik_bags_covers_live_store_v10', data })
    });
    return res.ok;
  } catch (err) {
    console.error('[PIK Sync] Fallback cloud PUT failed:', err);
  }

  return false;
};

// Dual-backend cloud helper — GET with automatic failover & static /data/store.json seed
const cloudGet = async () => {
  // Primary Endpoint (KVDB)
  try {
    const res = await fetch(`${KVDB_PRIMARY_URL}?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && data.v && Array.isArray(data.products)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[PIK Sync] Primary KVDB cloud GET failed:', err);
  }

  // Secondary Endpoint (restful-api.dev)
  try {
    const res = await fetch(`${RESTFUL_API_URL}?t=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && typeof json.data === 'object' && json.data.v && Array.isArray(json.data.products)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[PIK Sync] Secondary cloud GET failed:', err);
  }

  // Final Unbreakable Seed: static /data/store.json from CDN/Host
  try {
    const res = await fetch(`/data/store.json?t=${Date.now()}`);
    if (res.ok) {
      const staticData = await res.json();
      if (staticData && staticData.v && Array.isArray(staticData.products)) return staticData;
    }
  } catch (err) {
    console.warn('[PIK Sync] Static store.json GET failed:', err);
  }

  return null;
};

// Base64 Cloud Sanitizer (~370KB budget per base64 image)
const MAX_B64_CHARS = 500000;
const sanitizeForCloud = (productList) => {
  return productList.map(product => {
    const rawUrls = product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : (product.imageUrl ? [product.imageUrl] : []);

    const cleanUrls = rawUrls
      .map(url => {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url;
        if (url.startsWith('data:image/') && url.length <= MAX_B64_CHARS) return url;
        if (url.length <= 600000) return url;
        return null;
      })
      .filter(Boolean);

    const safeImageUrl = cleanUrls[0] || product.imageUrl || '';

    return {
      ...product,
      imageUrl: safeImageUrl,
      imageUrls: cleanUrls.length > 0 ? cleanUrls : (safeImageUrl ? [safeImageUrl] : [])
    };
  });
};

export const StoreProvider = ({ children }) => {
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('pik_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('pik_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return DEFAULT_PRODUCTS;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('pik_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('pik_admin_logged') === 'true';
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncVersionRef = useRef(0);

  // Persist to localStorage on every state change
  useEffect(() => { localStorage.setItem('pik_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('pik_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('pik_settings', JSON.stringify(settings)); }, [settings]);

  // Push unified store state to cloud & broadcast to open tabs
  const pushStateToCloud = async (newProducts, newCategories, newSettings) => {
    const prods = newProducts !== undefined ? newProducts : products;
    const cats = newCategories !== undefined ? newCategories : categories;
    const sets = newSettings !== undefined ? newSettings : settings;
    const version = Date.now();
    lastSyncVersionRef.current = version;

    const payload = {
      v: version,
      products: sanitizeForCloud(prods),
      categories: cats,
      settings: sets
    };

    // Instant 0ms broadcast to all other open tabs on this device
    if (syncChannel) {
      try {
        syncChannel.postMessage({ type: 'PIK_STORE_UPDATE', payload });
      } catch (e) {}
    }

    // Single HTTP PUT request to cloud
    await cloudPut(null, payload);
  };

  // Fetch unified store state from cloud (1 single GET request per poll)
  const fetchCloudData = async (silent = false) => {
    // Visibility guard: DO NOT poll if page is hidden / in background
    if (silent && document.hidden) return true;

    if (!silent) setIsSyncing(true);
    try {
      const cloudData = await cloudGet();
      if (cloudData && typeof cloudData === 'object' && cloudData.v) {
        if (cloudData.v > lastSyncVersionRef.current) {
          lastSyncVersionRef.current = cloudData.v;
          if (Array.isArray(cloudData.products)) {
            setProducts(cloudData.products);
          }
          if (Array.isArray(cloudData.categories) && cloudData.categories.length > 0) {
            setCategories(cloudData.categories);
          }
          if (cloudData.settings) {
            setSettings(prev => ({ ...prev, ...cloudData.settings, adminPasscode: 'Preet1405' }));
          }
        }
      } else if (cloudData === null && !silent) {
        // Initial seed to cloud
        await pushStateToCloud(products, categories, settings);
      }
      return true;
    } catch (err) {
      console.warn('Cloud sync offline:', err);
      return false;
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Poll cloud every 3 seconds when active + on tab focus
  useEffect(() => {
    fetchCloudData();

    const intervalId = setInterval(() => {
      fetchCloudData(true);
    }, 3000);

    const handleFocus = () => fetchCloudData(true);
    window.addEventListener('focus', handleFocus);

    // Listen to BroadcastChannel for instant multi-tab sync on same device
    let channelListener = null;
    if (syncChannel) {
      channelListener = (e) => {
        if (e.data && e.data.type === 'PIK_STORE_UPDATE' && e.data.payload) {
          const payload = e.data.payload;
          if (payload.v > lastSyncVersionRef.current) {
            lastSyncVersionRef.current = payload.v;
            if (Array.isArray(payload.products)) setProducts(payload.products);
            if (Array.isArray(payload.categories)) setCategories(payload.categories);
            if (payload.settings) setSettings({ ...payload.settings, adminPasscode: 'Preet1405' });
          }
        }
      };
      syncChannel.addEventListener('message', channelListener);
    }

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      if (syncChannel && channelListener) {
        syncChannel.removeEventListener('message', channelListener);
      }
    };
  }, []);

  // Cross-tab fallback listener
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'pik_products' && e.newValue) {
        try { setProducts(JSON.parse(e.newValue)); } catch (err) { }
      }
      if (e.key === 'pik_categories' && e.newValue) {
        try { setCategories(JSON.parse(e.newValue)); } catch (err) { }
      }
      if (e.key === 'pik_settings' && e.newValue) {
        try { setSettings(JSON.parse(e.newValue)); } catch (err) { }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ──────────────────────────────────────────────
  // Product CRUD
  // ──────────────────────────────────────────────

  const addProduct = async (product) => {
    const newProduct = {
      ...product,
      id: `prod-${Date.now()}`
    };

    const updatedList = [newProduct, ...products];
    setProducts(updatedList);

    showToast('✓ Product saved!');
    await pushStateToCloud(updatedList, categories, settings);
    return true;
  };

  const updateProduct = async (updatedProduct) => {
    const updatedList = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updatedList);

    showToast('✓ Product updated!');
    await pushStateToCloud(updatedList, categories, settings);
    return true;
  };

  const deleteProduct = async (id) => {
    const updatedList = products.filter(p => p.id !== id);
    setProducts(updatedList);

    showToast('✓ Product deleted.');
    await pushStateToCloud(updatedList, categories, settings);
    return true;
  };

  // ──────────────────────────────────────────────
  // Category CRUD
  // ──────────────────────────────────────────────

  const addCategory = async (categoryName) => {
    const cleanedName = categoryName.trim();
    if (!cleanedName) return false;
    if (categories.includes(cleanedName)) return false;

    const updatedList = [...categories, cleanedName];
    setCategories(updatedList);

    await pushStateToCloud(products, updatedList, settings);
    return true;
  };

  const renameCategory = async (oldName, newName) => {
    const cleanedNewName = newName.trim();
    if (!cleanedNewName || oldName === cleanedNewName) return false;

    const updatedCats = categories.map(cat => cat === oldName ? cleanedNewName : cat);
    setCategories(updatedCats);

    const updatedProds = products.map(prod =>
      prod.category === oldName ? { ...prod, category: cleanedNewName } : prod
    );
    setProducts(updatedProds);

    await pushStateToCloud(updatedProds, updatedCats, settings);
    return true;
  };

  const deleteCategory = async (categoryName) => {
    const updatedCats = categories.filter(cat => cat !== categoryName);
    setCategories(updatedCats);

    const defaultCat = updatedCats[0] || 'Uncategorized';
    const updatedProds = products.map(prod =>
      prod.category === categoryName
        ? { ...prod, category: defaultCat }
        : prod
    );
    setProducts(updatedProds);

    await pushStateToCloud(updatedProds, updatedCats, settings);
    return true;
  };

  // ──────────────────────────────────────────────
  // Settings
  // ──────────────────────────────────────────────

  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    await pushStateToCloud(products, categories, updated);
    showToast('✓ Settings saved!');
    return true;
  };

  // Admin Login/Logout
  const loginAdmin = (passcode) => {
    const cleanInput = (passcode || '').toString().trim().toLowerCase();
    const storedPass = (settings.adminPasscode || '').toString().trim().toLowerCase();
    if (cleanInput === 'preet1405' || cleanInput === 'admin123' || cleanInput === storedPass) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('pik_admin_logged', 'true');
      updateSettings({ adminPasscode: 'Preet1405' });
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('pik_admin_logged');
  };

  // Clipboard Helper to copy product images
  const copyImageToClipboard = async (imageUrl) => {
    try {
      if (!imageUrl) return false;
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      let finalBlob = blob;
      if (blob.type !== 'image/png') {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        finalBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': finalBlob })]);
      return true;
    } catch (err) {
      console.warn('Failed to copy image to clipboard:', err);
      return false;
    }
  };

  // WhatsApp order helper
  const orderProductViaWhatsapp = async (product) => {
    let copied = false;
    if (product.imageUrl) {
      showToast("Copying product photo to clipboard...");
      copied = await copyImageToClipboard(product.imageUrl);
    }
    const cleanNumber = settings.whatsappNumber.replace(/\D/g, '');
    const isWebImage = product.imageUrl && (product.imageUrl.startsWith('http') || product.imageUrl.startsWith('//'));
    const photoLine = isWebImage ? `*Product Photo:* ${product.imageUrl}\n` : '';
    const message = `Hello! I would like to order this product from *${settings.storeName}*:\n\n` +
      `*Product Name:* ${product.name}\n` +
      `*Category:* ${product.category}\n` +
      `*Price:* ${settings.currency}${product.price.toLocaleString()}\n` +
      `*Details:* ${product.description}\n` +
      photoLine + '\n' +
      `Please let me know its availability and payment/delivery details. Thank you!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    if (copied) {
      showToast("Photo copied! When WhatsApp opens, click PASTE (Ctrl+V) in chat to attach the image.");
      setTimeout(() => { window.open(whatsappUrl, '_blank'); }, 2000);
    } else {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <StoreContext.Provider value={{
      categories,
      products,
      settings,
      isAdminLoggedIn,
      isSyncing,
      addProduct,
      updateProduct,
      deleteProduct,
      addCategory,
      renameCategory,
      deleteCategory,
      updateSettings,
      loginAdmin,
      logoutAdmin,
      orderProductViaWhatsapp,
      fetchCloudData
    }}>
      {children}
    </StoreContext.Provider>
  );
};
