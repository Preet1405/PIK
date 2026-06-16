import React, { createContext, useState, useEffect } from 'react';

export const StoreContext = createContext();

const DB_BASE_URL = 'https://kvdb.io/3h6MXWHLN9eTgfQ2je81HH';

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
  adminPasscode: 'admin123'
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

// Cloud helper — PUT a single key (with retry)
const cloudPut = async (key, data, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${DB_BASE_URL}/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return true;
      if (attempt < retries) await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    } catch (err) {
      if (attempt === retries) console.error(`Cloud PUT /${key} failed:`, err);
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
  return undefined; // undefined = error, null = not found
};

// Cloud helper — DELETE a single key
const cloudDelete = async (key) => {
  try {
    await fetch(`${DB_BASE_URL}/${key}`, { method: 'DELETE' });
  } catch (err) {
    console.warn(`Cloud DELETE /${key} failed:`, err);
  }
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

  // Persist to localStorage on every state change
  useEffect(() => { localStorage.setItem('pik_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('pik_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('pik_settings', JSON.stringify(settings)); }, [settings]);

  // ──────────────────────────────────────────────────────────────
  // CLOUD SYNC: Each product is stored as its own key (p_{id})
  // to avoid exceeding kvdb.io's 100KB per-key limit.
  // A product_index key holds the array of product IDs.
  // ──────────────────────────────────────────────────────────────

  // Save a single product to cloud
  const saveProductToCloud = async (product) => {
    return await cloudPut(`p_${product.id}`, product);
  };

  // Delete a single product from cloud
  const removeProductFromCloud = async (id) => {
    await cloudDelete(`p_${id}`);
  };

  // Save the product index (list of IDs) to cloud
  const saveProductIndex = async (productList) => {
    const ids = productList.map(p => p.id);
    return await cloudPut('product_index', ids);
  };

  // Load all products from cloud using the index
  const loadProductsFromCloud = async () => {
    const ids = await cloudGet('product_index');

    if (ids === null) {
      // No index exists yet — this is the first time. Migrate existing data.
      // Check if old-style "products" key exists
      const oldProducts = await cloudGet('products');
      if (oldProducts && !oldProducts.error) {
        const prods = Array.isArray(oldProducts) ? oldProducts.filter(Boolean) : Object.values(oldProducts);
        if (prods.length > 0) {
          // Migrate each product to individual keys
          await Promise.all(prods.map(p => saveProductToCloud(p)));
          await saveProductIndex(prods);
          // Clean up old key
          await cloudDelete('products');
          return prods;
        }
      }
      // Nothing in cloud — push local data
      return null;
    }

    if (ids === undefined) return undefined; // fetch error

    if (!Array.isArray(ids) || ids.length === 0) return [];

    // Fetch each product by its key
    const results = await Promise.all(
      ids.map(id => cloudGet(`p_${id}`))
    );
    return results.filter(p => p && typeof p === 'object' && p.id);
  };

  // Load cloud data on mount
  useEffect(() => {
    const loadCloudData = async () => {
      setIsSyncing(true);
      try {
        // 1. Categories
        const cloudCats = await cloudGet('categories');
        if (cloudCats === null) {
          const localCats = JSON.parse(localStorage.getItem('pik_categories') || 'null') || DEFAULT_CATEGORIES;
          await cloudPut('categories', localCats);
        } else if (Array.isArray(cloudCats)) {
          setCategories(cloudCats);
        }

        // 2. Settings
        const cloudSettings = await cloudGet('settings');
        if (cloudSettings === null) {
          const localSettings = JSON.parse(localStorage.getItem('pik_settings') || 'null') || DEFAULT_SETTINGS;
          await cloudPut('settings', localSettings);
        } else if (cloudSettings && typeof cloudSettings === 'object' && !cloudSettings.error) {
          setSettings(cloudSettings);
        }

        // 3. Products (individual keys)
        const cloudProds = await loadProductsFromCloud();
        if (cloudProds === null) {
          // Nothing in cloud — push local products
          const localProds = JSON.parse(localStorage.getItem('pik_products') || 'null') || DEFAULT_PRODUCTS;
          await Promise.all(localProds.map(p => saveProductToCloud(p)));
          await saveProductIndex(localProds);
        } else if (cloudProds !== undefined && Array.isArray(cloudProds)) {
          // Merge: cloud as base, add any local-only products
          setProducts(prevLocal => {
            const cloudIds = new Set(cloudProds.map(p => p.id));
            const localOnly = prevLocal.filter(p => !cloudIds.has(p.id));
            if (localOnly.length > 0) {
              const merged = [...localOnly, ...cloudProds];
              // Sync the local-only products to cloud
              localOnly.forEach(p => saveProductToCloud(p));
              saveProductIndex(merged);
              return merged;
            }
            return cloudProds;
          });
        }
        // if undefined (error), keep local data as-is
      } catch (err) {
        console.warn('Cloud sync unavailable, running offline:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    loadCloudData();
  }, []);

  // ──────────────────────────────────────────────
  // Product CRUD
  // ──────────────────────────────────────────────

  const addProduct = async (product) => {
    const newProduct = {
      ...product,
      id: `prod-${Date.now()}`
    };

    // Immediately update state + localStorage
    const updatedList = await new Promise(resolve => {
      setProducts(prev => {
        const next = [newProduct, ...prev];
        resolve(next);
        return next;
      });
    });

    // Sync to cloud: save individual product + update index
    const saved = await saveProductToCloud(newProduct);
    if (saved) {
      await saveProductIndex(updatedList);
      showToast('✓ Product saved!');
    } else {
      showToast('⚠ Saved locally. Cloud sync failed.');
    }
    return saved;
  };

  const updateProduct = async (updatedProduct) => {
    const updatedList = await new Promise(resolve => {
      setProducts(prev => {
        const next = prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        resolve(next);
        return next;
      });
    });

    const saved = await saveProductToCloud(updatedProduct);
    if (saved) showToast('✓ Product updated!');
    return saved;
  };

  const deleteProduct = async (id) => {
    const updatedList = await new Promise(resolve => {
      setProducts(prev => {
        const next = prev.filter(p => p.id !== id);
        resolve(next);
        return next;
      });
    });

    await removeProductFromCloud(id);
    await saveProductIndex(updatedList);
    showToast('✓ Product deleted.');
    return true;
  };

  // ──────────────────────────────────────────────
  // Category CRUD
  // ──────────────────────────────────────────────

  const addCategory = async (categoryName) => {
    const cleanedName = categoryName.trim();
    if (!cleanedName) return false;
    let updatedList;
    let exists = false;
    setCategories(prev => {
      if (prev.includes(cleanedName)) { exists = true; return prev; }
      updatedList = [...prev, cleanedName];
      return updatedList;
    });
    if (exists) return false;
    await new Promise(r => setTimeout(r, 0));
    return await cloudPut('categories', updatedList);
  };

  const renameCategory = async (oldName, newName) => {
    const cleanedNewName = newName.trim();
    if (!cleanedNewName || oldName === cleanedNewName) return false;
    let updatedCats, updatedProds;
    setCategories(prev => {
      updatedCats = prev.map(cat => cat === oldName ? cleanedNewName : cat);
      return updatedCats;
    });
    setProducts(prev => {
      updatedProds = prev.map(prod =>
        prod.category === oldName ? { ...prod, category: cleanedNewName } : prod
      );
      return updatedProds;
    });
    await new Promise(r => setTimeout(r, 0));
    const catSync = await cloudPut('categories', updatedCats);
    // Update each renamed product in cloud
    const renamedProds = updatedProds.filter(p => p.category === cleanedNewName);
    await Promise.all(renamedProds.map(p => saveProductToCloud(p)));
    return catSync;
  };

  const deleteCategory = async (categoryName) => {
    let updatedCats, updatedProds;
    setCategories(prev => {
      updatedCats = prev.filter(cat => cat !== categoryName);
      return updatedCats;
    });
    setProducts(prev => {
      updatedProds = prev.map(prod =>
        prod.category === categoryName
          ? { ...prod, category: updatedCats[0] || 'Uncategorized' }
          : prod
      );
      return updatedProds;
    });
    await new Promise(r => setTimeout(r, 0));
    const catSync = await cloudPut('categories', updatedCats);
    const reassigned = updatedProds.filter(p => p.category === (updatedCats[0] || 'Uncategorized'));
    await Promise.all(reassigned.map(p => saveProductToCloud(p)));
    return catSync;
  };

  // ──────────────────────────────────────────────
  // Settings
  // ──────────────────────────────────────────────

  const updateSettings = async (newSettings) => {
    let updated;
    setSettings(prev => {
      updated = { ...prev, ...newSettings };
      return updated;
    });
    await new Promise(r => setTimeout(r, 0));
    const synced = await cloudPut('settings', updated);
    if (synced) showToast('✓ Settings saved!');
    return synced;
  };

  // Admin Login/Logout
  const loginAdmin = (passcode) => {
    if (passcode === settings.adminPasscode) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('pik_admin_logged', 'true');
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
      orderProductViaWhatsapp
    }}>
      {children}
    </StoreContext.Provider>
  );
};
