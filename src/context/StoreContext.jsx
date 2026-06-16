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
  whatsappNumber: '9869468143', // Default set to customer requirements
  currency: '₹',
  tagline: 'Custom Protection & Tailored Packaging',
  description: 'We design and manufacture premium, heavy-duty covers, travel bags, and protective sleeves. Tailored to your specifications using superior quality fabrics for ultimate durability.',
  heroImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1600',
  adminPasscode: 'admin123'
};

// Toast Notification Helper (module-level so it can be used before provider mounts)
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

// Helper to write to cloud database (with retry)
const syncToCloud = async (path, data, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${DB_BASE_URL}/${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return true;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    } catch (err) {
      if (attempt === retries) {
        console.error(`Failed to sync to cloud /${path}:`, err);
      }
    }
  }
  return false;
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
  useEffect(() => {
    localStorage.setItem('pik_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('pik_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pik_settings', JSON.stringify(settings));
  }, [settings]);

  // Load from Cloud Database on mount — merge with local data
  useEffect(() => {
    const loadCloudData = async () => {
      setIsSyncing(true);
      try {
        const cacheBuster = `?t=${Date.now()}`;

        // 1. Fetch categories
        try {
          const catRes = await fetch(`${DB_BASE_URL}/categories${cacheBuster}`);
          if (catRes.status === 404) {
            const localCats = JSON.parse(localStorage.getItem('pik_categories') || 'null') || DEFAULT_CATEGORIES;
            await syncToCloud('categories', localCats);
          } else if (catRes.ok) {
            const catData = await catRes.json();
            if (Array.isArray(catData)) {
              setCategories(catData);
            }
          }
        } catch (err) {
          console.warn('Error loading categories:', err);
        }

        // 2. Fetch settings
        try {
          const setRes = await fetch(`${DB_BASE_URL}/settings${cacheBuster}`);
          if (setRes.status === 404) {
            const localSettings = JSON.parse(localStorage.getItem('pik_settings') || 'null') || DEFAULT_SETTINGS;
            await syncToCloud('settings', localSettings);
          } else if (setRes.ok) {
            const setData = await setRes.json();
            if (setData && typeof setData === 'object' && !setData.error) {
              setSettings(setData);
            }
          }
        } catch (err) {
          console.warn('Error loading settings:', err);
        }

        // 3. Fetch products — MERGE with local to avoid losing unsaved additions
        try {
          const prodRes = await fetch(`${DB_BASE_URL}/products${cacheBuster}`);
          if (prodRes.status === 404) {
            const localProds = JSON.parse(localStorage.getItem('pik_products') || 'null') || DEFAULT_PRODUCTS;
            await syncToCloud('products', localProds);
          } else if (prodRes.ok) {
            const prodData = await prodRes.json();
            if (prodData && !prodData.error) {
              const cloudProds = Array.isArray(prodData)
                ? prodData.filter(Boolean)
                : Object.values(prodData);

              // Merge: cloud as base, add any local-only products on top
              setProducts(prevLocal => {
                const cloudIds = new Set(cloudProds.map(p => p.id));
                const localOnly = prevLocal.filter(p => !cloudIds.has(p.id));
                if (localOnly.length > 0) {
                  const merged = [...localOnly, ...cloudProds];
                  syncToCloud('products', merged);
                  return merged;
                }
                return cloudProds;
              });
            }
          }
        } catch (err) {
          console.warn('Error loading products:', err);
        }
      } catch (err) {
        console.warn('Cloud sync unavailable, running offline:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    loadCloudData();
  }, []);

  // ──────────────────────────────────────────────
  // Product CRUD — functional state updates (prev => ...) to avoid stale closures
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

    // Sync to cloud in background
    const synced = await syncToCloud('products', updatedList);
    showToast(synced ? '✓ Product saved!' : '⚠ Saved locally. Cloud sync will retry.');
    return synced;
  };

  const updateProduct = async (updatedProduct) => {
    const updatedList = await new Promise(resolve => {
      setProducts(prev => {
        const next = prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
        resolve(next);
        return next;
      });
    });

    const synced = await syncToCloud('products', updatedList);
    return synced;
  };

  const deleteProduct = async (id) => {
    const updatedList = await new Promise(resolve => {
      setProducts(prev => {
        const next = prev.filter(p => p.id !== id);
        resolve(next);
        return next;
      });
    });

    const synced = await syncToCloud('products', updatedList);
    if (synced) showToast('✓ Product deleted.');
    return synced;
  };

  // ──────────────────────────────────────────────
  // Category CRUD — functional state updates
  // ──────────────────────────────────────────────

  const addCategory = async (categoryName) => {
    const cleanedName = categoryName.trim();
    if (!cleanedName) return false;

    let updatedList;
    let exists = false;
    setCategories(prev => {
      if (prev.includes(cleanedName)) {
        exists = true;
        return prev;
      }
      updatedList = [...prev, cleanedName];
      return updatedList;
    });
    if (exists) return false;
    await new Promise(r => setTimeout(r, 0));
    return await syncToCloud('categories', updatedList);
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
    const catSync = await syncToCloud('categories', updatedCats);
    const prodSync = await syncToCloud('products', updatedProds);
    return catSync && prodSync;
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
    const catSync = await syncToCloud('categories', updatedCats);
    const prodSync = await syncToCloud('products', updatedProds);
    return catSync && prodSync;
  };

  // ──────────────────────────────────────────────
  // Settings update
  // ──────────────────────────────────────────────

  const updateSettings = async (newSettings) => {
    let updated;
    setSettings(prev => {
      updated = { ...prev, ...newSettings };
      return updated;
    });
    await new Promise(r => setTimeout(r, 0));
    const synced = await syncToCloud('settings', updated);
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

  // Clipboard Helper to copy product images (supports Base64 and Web URLs)
  const copyImageToClipboard = async (imageUrl) => {
    try {
      if (!imageUrl) return false;
      
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      
      let finalBlob = blob;
      if (blob.type !== 'image/png') {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        finalBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      }
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': finalBlob
        })
      ]);
      return true;
    } catch (err) {
      console.warn('Failed to copy image to clipboard:', err);
      return false;
    }
  };

  // Helper to send order message via WhatsApp
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
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 2000);
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
