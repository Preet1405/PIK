import React, { useState, useContext } from 'react';
import { StoreContext } from '../context/StoreContext';
import { 
  Package, 
  FolderPlus, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Lock, 
  Check, 
  X,
  RefreshCw,
  Phone,
  UploadCloud
} from 'lucide-react';

export default function AdminDashboard() {
  const {
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
    fetchCloudData,
    isSyncing
  } = useContext(StoreContext);

  // Auth State
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');

  // Tab State: 'products' | 'categories' | 'settings'
  const [activeTab, setActiveTab] = useState('products');

  // Sub-view for products: 'list' | 'add' | 'edit'
  const [productMode, setProductMode] = useState('list');
  const [editingProduct, setEditingProduct] = useState(null);

  // Image input option: 'upload' | 'url'
  const [imageOption, setImageOption] = useState('upload');

  // Saving state to block UI during database sync operations
  const [isSaving, setIsSaving] = useState(false);

  // GitHub image token (stored in localStorage, NOT cloud — stays on this device only)
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('pik_gh_token') || '');

  // ─────────────────────────────────────────────────────────────────
  // GITHUB IMAGE UPLOAD — stores images at FULL original quality
  // Images are committed to the GitHub repo and served from GitHub CDN.
  // No base64 compression at all — the URL (not the image data) is stored in kvdb.io.
  // ─────────────────────────────────────────────────────────────────
  const uploadImageToGitHub = (file, token) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        // Strip the "data:image/...;base64," prefix to get raw base64 for GitHub API
        const base64Content = event.target.result.split(',')[1];
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const filename = `img_${Date.now()}.${ext}`;

        try {
          const res = await fetch(
            `https://api.github.com/repos/Preet1405/PIK/contents/public/images/${filename}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `token ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/vnd.github.v3+json'
              },
              body: JSON.stringify({
                message: `Upload product image: ${filename}`,
                content: base64Content
              })
            }
          );

          if (res.ok) {
            // raw.githubusercontent.com serves the file directly from the repo
            resolve(`https://raw.githubusercontent.com/Preet1405/PIK/main/public/images/${filename}`);
          } else {
            console.warn('GitHub upload failed:', res.status, await res.text());
            resolve(null); // will fall back to local compression
          }
        } catch (err) {
          console.warn('GitHub upload error:', err);
          resolve(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // ── Fallback local compression — used when no GitHub token is set ──
  const processFileLocally = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 720px max keeps base64 under ~70KB so cloud sync stays stable
        const MAX_DIM = 720;
        let w = img.width, h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) { h = Math.round((h * MAX_DIM) / w); w = MAX_DIM; }
          else { w = Math.round((w * MAX_DIM) / h); h = MAX_DIM; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProductForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, dataUrl] }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Main image upload handler — uses GitHub if token is set, local fallback otherwise
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const token = localStorage.getItem('pik_gh_token');

    if (token) {
      setIsSaving(true);
      for (const file of files) {
        const url = await uploadImageToGitHub(file, token);
        if (url) {
          // Success — full quality GitHub URL stored (tiny, no compression)
          setProductForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
        } else {
          // GitHub upload failed — fall back to local compression
          processFileLocally(file);
        }
      }
      setIsSaving(false);
    } else {
      // No GitHub token — use local compression
      files.forEach(file => processFileLocally(file));
    }
  };

  // Forms States
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    imageUrls: [],
    inStock: true
  });

  const [newCatName, setNewCatName] = useState('');
  const [renamingCat, setRenamingCat] = useState(null);
  const [renamingCatName, setRenamingCatName] = useState('');

  const [settingsForm, setSettingsForm] = useState({
    storeName: settings.storeName,
    whatsappNumber: settings.whatsappNumber,
    currency: settings.currency,
    tagline: settings.tagline,
    description: settings.description,
    adminPasscode: settings.adminPasscode
  });

  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Authentication Handler
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginAdmin(passcode)) {
      setLoginError('');
      // Initialize setting form with updated settings
      setSettingsForm({
        storeName: settings.storeName,
        whatsappNumber: settings.whatsappNumber,
        currency: settings.currency,
        tagline: settings.tagline,
        description: settings.description,
        adminPasscode: settings.adminPasscode
      });
    } else {
      setLoginError('Invalid passcode. Please try again.');
    }
  };

  // Product Add / Edit Handlers
  const handleOpenAddProduct = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: categories[0] || 'Uncategorized',
      imageUrl: '',
      imageUrls: [],
      inStock: true
    });
    setImageOption('upload');
    setProductMode('add');
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    const resolvedUrls = prod.imageUrls || (prod.imageUrl ? [prod.imageUrl] : []);
    setProductForm({
      name: prod.name,
      description: prod.description,
      price: prod.price,
      category: prod.category,
      imageUrl: prod.imageUrl || '',
      imageUrls: resolvedUrls,
      inStock: prod.inStock
    });
    
    // Auto-detect if image is custom uploaded or web URL
    const mainImg = resolvedUrls[0] || '';
    if (mainImg && (mainImg.startsWith('http') || mainImg.startsWith('//'))) {
      setImageOption('url');
    } else {
      setImageOption('upload');
    }
    setProductMode('edit');
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const parsedPrice = parseFloat(productForm.price) || 0;
    
    // Set first image in imageUrl for backward compatibility
    const finalForm = {
      ...productForm,
      price: parsedPrice,
      imageUrl: productForm.imageUrls[0] || ''
    };

    setIsSaving(true);
    let success = false;
    try {
      if (productMode === 'add') {
        success = await addProduct(finalForm);
      } else if (productMode === 'edit' && editingProduct) {
        success = await updateProduct({
          ...finalForm,
          id: editingProduct.id
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }

    if (success) {
      setProductMode('list');
      setEditingProduct(null);
    }
  };

  // Toggle quick in-stock status
  const handleToggleStock = (prod) => {
    updateProduct({
      ...prod,
      inStock: !prod.inStock
    });
  };



  // Category Add / Rename Handlers
  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    if (newCatName.trim()) {
      setIsSaving(true);
      try {
        await addCategory(newCatName);
        setNewCatName('');
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleStartRenameCategory = (cat) => {
    setRenamingCat(cat);
    setRenamingCatName(cat);
  };

  const handleSaveRenameCategory = async () => {
    if (renamingCatName.trim() && renamingCat) {
      setIsSaving(true);
      try {
        await renameCategory(renamingCat, renamingCatName);
        setRenamingCat(null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (window.confirm(`Are you sure you want to delete the category "${cat}"? Products in this category will be re-assigned.`)) {
      setIsSaving(true);
      try {
        await deleteCategory(cat);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setIsSaving(true);
      try {
        await deleteProduct(id);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Settings Save Handler
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(settingsForm);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // If Admin is not logged in, show login page
  if (!isAdminLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 73px)', padding: '2rem' }}>
        <div className="admin-login-card animate-scale">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>
            <Lock size={40} />
          </div>
          <h2 className="admin-login-title">Admin Access</h2>
          <form onSubmit={handleLogin}>
            {loginError && <div className="alert-error">{loginError}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="passcode">Enter Admin Passcode</label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className="form-control"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <button
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => { setActiveTab('products'); setProductMode('list'); }}
        >
          <Package size={18} />
          <span>Products</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <FolderPlus size={18} />
          <span>Categories</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </aside>

      {/* Main Content Pane */}
      <main className="admin-content animate-fade">
        
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="admin-tab-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Catalog Management</span>
              {productMode === 'list' && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => fetchCloudData()}
                    disabled={isSyncing || isSaving}
                    title="Pull latest data from cloud"
                  >
                    <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync from Cloud'}</span>
                  </button>
                  <button className="btn btn-primary" onClick={handleOpenAddProduct} disabled={isSyncing || isSaving}>
                    <Plus size={16} />
                    <span>Add Product</span>
                  </button>
                </div>
              )}
            </div>

            {productMode === 'list' ? (
              products.length === 0 ? (
                <div className="empty-state">
                  <Package className="empty-state-icon text-muted" size={48} style={{ margin: '0 auto 1rem auto' }} />
                  <p className="empty-state-text">No products in your catalog yet.</p>
                  <button className="btn btn-primary" onClick={handleOpenAddProduct}>
                    Create Your First Product
                  </button>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((prod) => (
                        <tr key={prod.id} className="admin-table-row">
                          <td>
                            <img
                              src={prod.imageUrl || 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=100'}
                              alt={prod.name}
                              className="admin-table-img"
                            />
                          </td>
                          <td>
                            <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{prod.name}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {prod.description}
                            </span>
                          </td>
                          <td>
                            <span className="category-pill" style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
                              {prod.category}
                            </span>
                          </td>
                          <td style={{ fontWeight: '600' }}>
                            {settings.currency}{prod.price}
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleStock(prod)}
                              className={`btn ${prod.inStock ? 'btn-secondary' : 'btn-primary'}`}
                              style={{ 
                                padding: '0.25rem 0.75rem', 
                                fontSize: '0.75rem', 
                                background: prod.inStock ? 'rgba(37, 211, 102, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                border: `1px solid ${prod.inStock ? 'rgba(37, 211, 102, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                color: prod.inStock ? 'var(--accent-whatsapp)' : '#f87171',
                                width: '100px'
                              }}
                            >
                              {prod.inStock ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <button 
                                className="icon-btn icon-btn-edit" 
                                onClick={() => handleOpenEditProduct(prod)}
                                title="Edit Product"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                className="icon-btn icon-btn-danger" 
                                onClick={() => handleDeleteProduct(prod.id)}
                                title="Delete Product"
                                disabled={isSaving}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* Add / Edit Form */
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', maxWidth: '700px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                    {productMode === 'add' ? 'Add New Product' : `Edit: ${editingProduct?.name}`}
                  </h3>
                  <button className="icon-btn" onClick={() => setProductMode('list')}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit}>
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="e.g. Royal Emerald Pendant"
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Write description detailing craftsmanship, dimensions, and styling suggestions..."
                      className="form-control"
                      style={{ minHeight: '100px' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Price ({settings.currency})</label>
                      <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="250"
                        className="form-control"
                        required
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="form-control"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                    <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>Product Image</label>
                    
                    {/* Toggle Selector */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--bg-primary)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
                      <button
                        type="button"
                        className={`btn ${imageOption === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', boxShadow: 'none' }}
                        onClick={() => setImageOption('upload')}
                      >
                        Upload from Device
                      </button>
                      <button
                        type="button"
                        className={`btn ${imageOption === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', boxShadow: 'none' }}
                        onClick={() => setImageOption('url')}
                      >
                        Paste Image URL
                      </button>
                    </div>

                    {/* Image Option Content */}
                    {imageOption === 'upload' ? (
                      <div>
                        <label className="upload-dropzone">
                          <UploadCloud className="upload-dropzone-icon" size={32} />
                          <div>
                            <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>Tap to open Gallery &amp; pick photos</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Images are auto-cropped &amp; fitted. Select multiple.</p>
                          </div>
                          {/* No `capture` attribute → opens Gallery/Files picker by default on mobile */}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden-file-input"
                            multiple
                          />
                        </label>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="url"
                          id="webImageUrlInput"
                          placeholder="https://images.unsplash.com/photo-..."
                          className="form-control"
                          style={{ marginBottom: 0 }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ whiteSpace: 'nowrap', padding: '0 1.25rem' }}
                          onClick={() => {
                            const input = document.getElementById('webImageUrlInput');
                            const val = input ? input.value.trim() : '';
                            if (val) {
                              setProductForm(prev => ({
                                ...prev,
                                imageUrls: [...prev.imageUrls, val]
                              }));
                              input.value = '';
                            }
                          }}
                        >
                          Add URL
                        </button>
                      </div>
                    )}

                    {/* Image Previews */}
                    {productForm.imageUrls && productForm.imageUrls.length > 0 && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>
                          Product Photos ({productForm.imageUrls.length}) - First photo is primary catalog image
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.75rem' }}>
                          {productForm.imageUrls.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                              <img
                                src={url}
                                alt={`Preview ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                style={{
                                  position: 'absolute',
                                  top: '2px',
                                  right: '2px',
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  lineHeight: '1'
                                }}
                                onClick={() => {
                                  setProductForm(prev => ({
                                    ...prev,
                                    imageUrls: prev.imageUrls.filter((_, i) => i !== idx)
                                  }));
                                }}
                                title="Remove photo"
                              >
                                &times;
                              </button>
                              {idx === 0 && (
                                <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(128, 44, 92, 0.85)', color: '#fff', fontSize: '8px', textAlign: 'center', padding: '2px 0', fontWeight: 'bold' }}>
                                  Primary
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <input
                      id="inStockCheckbox"
                      type="checkbox"
                      checked={productForm.inStock}
                      onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                      disabled={isSaving}
                    />
                    <label htmlFor="inStockCheckbox" style={{ userSelect: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                      Mark product as <strong>In Stock</strong> (Available for ordering)
                    </label>
                  </div>



                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Product'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setProductMode('list')} disabled={isSaving}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="admin-tab-title">
              <span>Category Settings</span>
            </div>

            <div className="category-manager-grid">
              {/* Add category form */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem' }}>Create Category</h3>
                <form onSubmit={handleAddCategorySubmit}>
                  <div className="form-group">
                    <label className="form-label">Category Name</label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Brooches"
                      className="form-control"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSaving}>
                    <Plus size={16} />
                    <span>{isSaving ? 'Creating...' : 'Create Category'}</span>
                  </button>
                </form>
              </div>

              {/* Category list */}
              <div>
                <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem' }}>Manage Categories</h3>
                {categories.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <p className="empty-state-text">No custom categories created.</p>
                  </div>
                ) : (
                  <div className="category-list">
                    {categories.map((cat) => (
                      <div key={cat} className="category-item animate-fade">
                        {renamingCat === cat ? (
                          <div style={{ display: 'flex', width: '100%', gap: '0.5rem' }}>
                            <input
                              type="text"
                              value={renamingCatName}
                              onChange={(e) => setRenamingCatName(e.target.value)}
                              className="form-control"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
                              autoFocus
                            />
                            <button className="icon-btn icon-btn-edit" onClick={handleSaveRenameCategory} style={{ color: 'var(--accent-whatsapp)' }}>
                              <Check size={16} />
                            </button>
                            <button className="icon-btn" onClick={() => setRenamingCat(null)}>
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="category-item-name">{cat}</span>
                            <div className="category-actions">
                              <button 
                                className="icon-btn icon-btn-edit" 
                                onClick={() => handleStartRenameCategory(cat)}
                                title="Rename Category"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                className="icon-btn icon-btn-danger" 
                                onClick={() => handleDeleteCategory(cat)}
                                title="Delete Category"
                                disabled={isSaving}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <div className="admin-tab-title">
              <span>Configuration Settings</span>
            </div>

            <div className="settings-grid">
              <form onSubmit={handleSettingsSubmit} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.5rem' }}>
                {settingsSuccess && (
                  <div className="alert-error" style={{ background: 'rgba(37, 211, 102, 0.1)', borderColor: 'rgba(37, 211, 102, 0.3)', color: 'var(--accent-whatsapp)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} />
                    <span>Configuration successfully updated and persisted!</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Store Brand Name</label>
                  <input
                    type="text"
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Contact Number</label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                    className="form-control"
                    required
                  />
                  <p className="form-hint">Include country code (e.g. <strong>+919876543210</strong> or <strong>+15551234567</strong>) with no spaces.</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Currency Notation</label>
                  <input
                    type="text"
                    value={settingsForm.currency}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                    className="form-control"
                    required
                    style={{ maxWidth: '100px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Store Tagline</label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Branding Description</label>
                  <textarea
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                    className="form-control"
                    style={{ minHeight: '100px' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                  <label className="form-label" style={{ color: 'var(--accent-gold)' }}>Change Security Admin Passcode</label>
                  <input
                    type="password"
                    value={settingsForm.adminPasscode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, adminPasscode: e.target.value })}
                    placeholder="New admin passcode"
                    className="form-control"
                    required
                  />
                </div>

                {/* GitHub Image Token — enables full-quality, no-compression image uploads */}
                <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                  <label className="form-label" style={{ color: 'var(--accent-coral)', fontSize: '0.95rem' }}>
                    🖼️ GitHub Image Token — Crystal-Clear Photos
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setGithubToken(val);
                      localStorage.setItem('pik_gh_token', val);
                    }}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="form-control"
                  />
                  <div style={{ marginTop: '0.75rem', padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.65' }}>
                    {githubToken ? (
                      <span style={{ color: 'var(--accent-whatsapp)' }}>
                        ✅ Token active — new image uploads will be stored at <strong>100% original quality</strong> on GitHub CDN.
                      </span>
                    ) : (
                      <>
                        <strong style={{ color: 'var(--text-secondary)' }}>One-time setup for HD images (no blur ever):</strong><br />
                        1. Open <strong>github.com/settings/tokens</strong><br />
                        2. Click <strong>Generate new token (classic)</strong><br />
                        3. Select scope: <strong>repo</strong> (full control)<br />
                        4. Click Generate → copy the <strong>ghp_...</strong> token<br />
                        5. Paste it above and save. Done! 🎉
                      </>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={isSaving}>
                  <RefreshCw size={16} className={isSaving ? "animate-spin" : ""} />
                  <span>{isSaving ? 'Updating...' : 'Update and Save settings'}</span>
                </button>
              </form>

              {/* Sidebar Settings Preview */}
              <div className="settings-preview">
                <span className="preview-badge">Live Store Info</span>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Current Storefront</h4>
                  <p style={{ fontSize: '1.25rem', fontWeight: '600', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{settings.storeName}</p>
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>"{settings.tagline}"</p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>WhatsApp Connection</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-whatsapp)', fontSize: '0.9rem', fontWeight: '600' }}>
                    <Phone size={14} />
                    <span>{settings.whatsappNumber}</span>
                  </div>
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Default Currency</h4>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{settings.currency} (e.g. {settings.currency}2,500)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
