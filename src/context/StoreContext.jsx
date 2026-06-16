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

export const StoreProvider = ({ children }) => {
  // Read local cache initially
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

  // Sync state to local storage when state changes locally
  useEffect(() => {
    localStorage.setItem('pik_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('pik_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pik_settings', JSON.stringify(settings));
  }, [settings]);  // Load from Cloud Database on mount
  useEffect(() => {
    const loadCloudData = async () => {
      setIsSyncing(true);
      try {
        const cacheBuster = `?t=${Date.now()}`;
        // 1. Fetch categories
        try {
          const catRes = await fetch(`${DB_BASE_URL}/categories${cacheBuster}`);
          if (catRes.status === 404) {
            // Initialize if not present
            await fetch(`${DB_BASE_URL}/categories`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(DEFAULT_CATEGORIES)
            });
            setCategories(DEFAULT_CATEGORIES);
          } else if (catRes.ok) {
            const catData = await catRes.json();
            if (Array.isArray(catData)) {
              setCategories(catData);
            }
          }
        } catch (err) {
          console.warn('Error loading categories from cloud database:', err);
        }

        // 2. Fetch settings
        try {
          const setRes = await fetch(`${DB_BASE_URL}/settings${cacheBuster}`);
          if (setRes.status === 404) {
            // Initialize if not present
            await fetch(`${DB_BASE_URL}/settings`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(DEFAULT_SETTINGS)
            });
            setSettings(DEFAULT_SETTINGS);
          } else if (setRes.ok) {
            const setData = await setRes.json();
            if (setData && typeof setData === 'object' && !setData.error) {
              setSettings(setData);
            }
          }
        } catch (err) {
          console.warn('Error loading settings from cloud database:', err);
        }

        // 3. Fetch products
        try {
          const prodRes = await fetch(`${DB_BASE_URL}/products${cacheBuster}`);
          if (prodRes.status === 404) {
            // Initialize if not present
            await fetch(`${DB_BASE_URL}/products`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(DEFAULT_PRODUCTS)
            });
            setProducts(DEFAULT_PRODUCTS);
          } else if (prodRes.ok) {
            const prodData = await prodRes.json();
            if (prodData && !prodData.error) {
              const normalizedProds = Array.isArray(prodData)
                ? prodData.filter(Boolean)
                : Object.values(prodData);
              setProducts(normalizedProds);
            }
          }
        } catch (err) {
          console.warn('Error loading products from cloud database:', err);
        }
      } catch (err) {
        console.warn('Unable to sync with cloud database. Running in offline/cache mode:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    loadCloudData();
  }, []);

  // Helper helper to write to cloud database
  const syncToCloud = async (path, data) => {
    try {
      await fetch(`${DB_BASE_URL}/${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error(`Failed to sync changes to cloud path /${path}:`, err);
    }
  };

  // Product CRUD (with Cloud Sync)
  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: `prod-${Date.now()}`
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    syncToCloud('products', updated);
  };

  const updateProduct = (updatedProduct) => {
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    syncToCloud('products', updated);
  };

  const deleteProduct = (id) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    syncToCloud('products', updated);
  };

  // Category CRUD (with Cloud Sync)
  const addCategory = (categoryName) => {
    const cleanedName = categoryName.trim();
    if (cleanedName && !categories.includes(cleanedName)) {
      const updated = [...categories, cleanedName];
      setCategories(updated);
      syncToCloud('categories', updated);
    }
  };

  const renameCategory = (oldName, newName) => {
    const cleanedNewName = newName.trim();
    if (!cleanedNewName || oldName === cleanedNewName) return;

    const updatedCats = categories.map(cat => cat === oldName ? cleanedNewName : cat);
    setCategories(updatedCats);
    syncToCloud('categories', updatedCats);

    const updatedProds = products.map(prod => prod.category === oldName ? { ...prod, category: cleanedNewName } : prod);
    setProducts(updatedProds);
    syncToCloud('products', updatedProds);
  };

  const deleteCategory = (categoryName) => {
    const updatedCats = categories.filter(cat => cat !== categoryName);
    setCategories(updatedCats);
    syncToCloud('categories', updatedCats);

    // Re-assign products in this category to first category
    const updatedProds = products.map(prod => prod.category === categoryName ? { ...prod, category: categories[0] || 'Uncategorized' } : prod);
    setProducts(updatedProds);
    syncToCloud('products', updatedProds);
  };

  // Settings update (with Cloud Sync)
  const updateSettings = (newSettings) => {
    const updated = {
      ...settings,
      ...newSettings
    };
    setSettings(updated);
    syncToCloud('settings', updated);
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

  // Helper to send order message via WhatsApp
  const orderProductViaWhatsapp = (product) => {
    const cleanNumber = settings.whatsappNumber.replace(/\D/g, '');
    
    // Check if the image is a web URL or a base64 string
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
    window.open(whatsappUrl, '_blank');
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
