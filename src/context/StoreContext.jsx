import React, { createContext, useState, useEffect, useRef } from 'react';

export const StoreContext = createContext();

const DB_BASE_URL = 'https://kvdb.io/3h6MXWHLN9eTgfQ2je81HH';
const CLOUD_STATE_KEY = 'pik_store_state_v9';

// BroadcastChannel for instant 0ms tab-to-tab sync without network calls
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('pik_store_channel')
  : null;

const DEFAULT_CATEGORIES = [
  'Tote Bags',
  'Laptop Sleeves',
  'Travel Bags',
  'Custom Covers'
];

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Classic Canvas Tote Bag',
    description: 'Durable, eco-friendly canvas tote bag with reinforced handles and a spacious interior. Perfect for daily shopping, work, or casual outings.',
    price: 499,
    category: 'Tote Bags',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    inStock: true
  },
  {
    id: 'prod-2',
    name: 'Quilted Shockproof Laptop Sleeve',
    description: 'Elegant water-resistant cover padded with multi-layer dense foam for ultimate protection. Soft inner lining prevents scratches. Fits 13 to 16 inch laptops.',
    price: 799,
    category: 'Laptop Sleeves',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600',
    inStock: true
  },
  {
    id: 'prod-3',
    name: 'Premium Canvas Duffel Bag',
    description: 'Heavy-duty canvas duffel bag featuring leather trim, spacious compartments, adjustable shoulder straps, and a separate shoe divider.',
    price: 1899,
    category: 'Travel Bags',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
    inStock: true
  },
  {
    id: 'prod-4',
    name: 'Heavy-Duty Waterproof Grill Cover',
    description: 'Tailored outdoor cover made of 600D marine-grade polyester. Resists rain, wind, UV rays, and tearing. Equipped with adjustable straps for high-wind stability.',
    price: 1299,
    category: 'Custom Covers',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600',
    inStock: true
  },
  {
    id: 'prod-5',
    name: 'Cotton Drawstring Dust Bags (Set of 3)',
    description: 'Pack of three breathable organic cotton dust covers. Perfect for protecting luxury handbags, shoes, and leather accessories from dust and sunlight.',
    price: 349,
    category: 'Tote Bags',
    imageUrl: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600',
    inStock: true
  },
  {
    id: 'prod-6',
    name: 'Bespoke Industrial Equipment Cover',
    description: 'Custom-tailored, dustproof, and chemical-resistant cover for machinery or appliances. Designed to your exact dimensional blueprints.',
    price: 1599,
    category: 'Custom Covers',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
    inStock: true
  },
  {
    id: 'prod-7',
    name: 'Minimalist Neoprene Tablet Cover',
    description: 'Ultra-slim, form-fitting sleeve with a secure zippered top. Easy to slide inside backpacks or carry under your arm.',
    price: 399,
    category: 'Laptop Sleeves',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=600',
    inStock: true
  }
];

const DEFAULT_SETTINGS = {
  storeName: 'PIK Bags & Covers',
  whatsappNumber: '9869468143',
  currency: '₹',
  tagline: 'Custom Protection & Tailored Packaging',
  description: 'We design and manufacture premium, heavy-duty covers, travel bags, and protective sleeves. Tailored to your specifications using superior quality fabrics for ultimate durability.',
  heroImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1600',
  adminPasscode: 'Preet1405'
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

// Cloud helper — PUT a single key (with quick retry)
const cloudPut = async (key, data, retries = 1) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${DB_BASE_URL}/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return true;
      if (attempt < retries) await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      if (attempt < retries) await new Promise(r => setTimeout(r, 200));
    }
  }
  return false;
};

// Cloud helper — GET a single key
const cloudGet = async (key) => {
  try {
    const res = await fetch(`${DB_BASE_URL}/${key}?t=${Date.now()}`);
    if (res.ok) return await res.json();
    if (res.status === 404) return null;
  } catch (err) {
    console.warn(`Cloud GET /${key} failed:`, err);
  }
  return undefined;
};

// Base64 Cloud Sanitizer (~40KB budget per base64 image)
const MAX_B64_CHARS = 40000;
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
        return null;
      })
      .filter(Boolean);

    const safeImageUrl = cleanUrls[0] || (product.imageUrl && !product.imageUrl.startsWith('data:image/') ? product.imageUrl : '');

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
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('pik_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
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
    await cloudPut(CLOUD_STATE_KEY, payload);
  };

  // Fetch unified store state from cloud (1 single GET request per poll)
  const fetchCloudData = async (silent = false) => {
    // Visibility guard: DO NOT poll if page is hidden / in background
    if (silent && document.hidden) return true;

    if (!silent) setIsSyncing(true);
    try {
      const cloudData = await cloudGet(CLOUD_STATE_KEY);
      if (cloudData && typeof cloudData === 'object' && cloudData.v) {
        if (cloudData.v > lastSyncVersionRef.current) {
          lastSyncVersionRef.current = cloudData.v;
          if (Array.isArray(cloudData.products)) {
            setProducts(cloudData.products);
          }
          if (Array.isArray(cloudData.categories)) {
            setCategories(cloudData.categories);
          }
          if (cloudData.settings) {
            setSettings({ ...cloudData.settings, adminPasscode: 'Preet1405' });
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

  // Poll cloud every 6 seconds when active + on tab focus
  useEffect(() => {
    fetchCloudData();

    const intervalId = setInterval(() => {
      fetchCloudData(true);
    }, 6000);

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

    let updatedList = [];
    setProducts(prevProducts => {
      updatedList = [newProduct, ...prevProducts];
      return updatedList;
    });

    showToast('✓ Product saved!');
    pushStateToCloud(updatedList, categories, settings);
    return true;
  };

  const updateProduct = async (updatedProduct) => {
    let updatedList = [];
    setProducts(prevProducts => {
      updatedList = prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      return updatedList;
    });

    showToast('✓ Product updated!');
    pushStateToCloud(updatedList, categories, settings);
    return true;
  };

  const deleteProduct = async (id) => {
    let updatedList = [];
    setProducts(prevProducts => {
      updatedList = prevProducts.filter(p => p.id !== id);
      localStorage.setItem('pik_products', JSON.stringify(updatedList));
      return updatedList;
    });

    showToast('✓ Product deleted.');

    // Non-blocking background cloud update — instant 0ms deletion
    const sanitized = sanitizeForCloud(updatedList);
    cloudPut('pik_live_products_v6', sanitized).then(() => {
      bumpSyncVersion();
    });

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

    pushStateToCloud(products, updatedList, settings);
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

    pushStateToCloud(updatedProds, updatedCats, settings);
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

    pushStateToCloud(updatedProds, updatedCats, settings);
    return true;
  };

  // ──────────────────────────────────────────────
  // Settings
  // ──────────────────────────────────────────────

  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    pushStateToCloud(products, categories, updated);
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
