import React, { createContext, useState, useEffect } from 'react';

export const StoreContext = createContext();

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
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3bb64e0be5e?auto=format&fit=crop&q=80&w=600',
    inStock: true
  },
  {
    id: 'prod-5',
    name: 'Cotton Drawstring Dust Bags (Set of 3)',
    description: 'Pack of three breathable organic cotton dust covers. Perfect for protecting luxury handbags, shoes, and leather accessories from dust and sunlight.',
    price: 349,
    category: 'Tote Bags',
    imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=600',
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
  whatsappNumber: '+919876543210',
  currency: '₹',
  tagline: 'Custom Protection & Tailored Packaging',
  description: 'We design and manufacture premium, heavy-duty covers, travel bags, and protective sleeves. Tailored to your specifications using superior quality fabrics for ultimate durability.',
  heroImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1600',
  adminPasscode: 'admin123'
};

export const StoreProvider = ({ children }) => {
  // Load state from localStorage or use defaults
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

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pik_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('pik_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pik_settings', JSON.stringify(settings));
  }, [settings]);

  // Product CRUD
  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (updatedProduct) => {
    setProducts(prev =>
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Category CRUD
  const addCategory = (categoryName) => {
    const cleanedName = categoryName.trim();
    if (cleanedName && !categories.includes(cleanedName)) {
      setCategories(prev => [...prev, cleanedName]);
    }
  };

  const renameCategory = (oldName, newName) => {
    const cleanedNewName = newName.trim();
    if (!cleanedNewName || oldName === cleanedNewName) return;

    setCategories(prev =>
      prev.map(cat => cat === oldName ? cleanedNewName : cat)
    );

    // Update the category inside all products belonging to the old category
    setProducts(prev =>
      prev.map(prod => prod.category === oldName ? { ...prod, category: cleanedNewName } : prod)
    );
  };

  const deleteCategory = (categoryName) => {
    setCategories(prev => prev.filter(cat => cat !== categoryName));
    // Re-assign products in this category to first category
    setProducts(prev =>
      prev.map(prod => prod.category === categoryName ? { ...prod, category: categories[0] || 'Uncategorized' } : prod)
    );
  };

  // Settings update
  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
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
    const message = `Hello! I would like to order this product from *${settings.storeName}*:\n\n` +
                    `*Product:* ${product.name}\n` +
                    `*Category:* ${product.category}\n` +
                    `*Price:* ${settings.currency}${product.price}\n\n` +
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
