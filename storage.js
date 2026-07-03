// ===== storage.js =====

const STORAGE_KEYS = {
  PRODUCTS: "herb_products",
  INVOICES: "herb_invoices",
  SETTINGS: "herb_settings",
};

// ===== data defaults =====
function getDefaultProducts() {
  return [
    {
      id: 1,
      name: "لوز",
      category: "حلويات",
      type: "weighted",
      prices: { 1: 120, 0.5: 65, 0.25: 35, 0.125: 20 },
      stock: 50,
      unit: "kg",
      icon: "fa-seedling",
    },
    {
      id: 2,
      name: "جوز هند",
      category: "حلويات",
      type: "weighted",
      prices: { 1: 80, 0.5: 45, 0.25: 25, 0.125: 15 },
      stock: 30,
      unit: "kg",
      icon: "fa-coconut",
    },
    {
      id: 3,
      name: "زعتر",
      category: "عطارة",
      type: "weighted",
      prices: { 1: 60, 0.5: 35, 0.25: 20, 0.125: 12 },
      stock: 20,
      unit: "kg",
      icon: "fa-leaf",
    },
    {
      id: 4,
      name: "معلبة تونة",
      category: "معلبات",
      type: "fixed",
      price: 45,
      stock: 30,
      unit: "piece",
      icon: "fa-fish",
    },
    {
      id: 5,
      name: "سكر",
      category: "بقالة",
      type: "weighted",
      prices: { 1: 25, 0.5: 15, 0.25: 10, 0.125: 7 },
      stock: 100,
      unit: "kg",
      icon: "fa-cube",
    },
    {
      id: 6,
      name: "معلبة فول",
      category: "معلبات",
      type: "fixed",
      price: 25,
      stock: 40,
      unit: "piece",
      icon: "fa-can-food",
    },
    {
      id: 7,
      name: "أرز",
      category: "بقالة",
      type: "weighted",
      prices: { 1: 30, 0.5: 18, 0.25: 12, 0.125: 8 },
      stock: 80,
      unit: "kg",
      icon: "fa-wheat",
    },
    {
      id: 8,
      name: "حبهان",
      category: "عطارة",
      type: "weighted",
      prices: { 1: 150, 0.5: 80, 0.25: 45, 0.125: 25 },
      stock: 15,
      unit: "kg",
      icon: "fa-spice",
    },
  ];
}

// ===== generic functions =====
function getData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ===== products =====
function loadProducts() {
  let products = getData(STORAGE_KEYS.PRODUCTS);
  if (!products || products.length === 0) {
    products = getDefaultProducts();
    setData(STORAGE_KEYS.PRODUCTS, products);
  }
  return products;
}

function saveProducts(products) {
  setData(STORAGE_KEYS.PRODUCTS, products);
}

function getProductById(id) {
  const products = loadProducts();
  return products.find((p) => p.id === id);
}

function addProduct(product) {
  const products = loadProducts();
  product.id = Date.now();
  products.push(product);
  saveProducts(products);
  return product;
}

function updateProduct(id, updatedData) {
  const products = loadProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products[index] = { ...products[index], ...updatedData };
    saveProducts(products);
    return products[index];
  }
  return null;
}

function deleteProduct(id) {
  let products = loadProducts();
  products = products.filter((p) => p.id !== id);
  saveProducts(products);
  return products;
}

function updateStock(id, quantity, isWeighted = true) {
  const products = loadProducts();
  const product = products.find((p) => p.id === id);
  if (product) {
    product.stock -= quantity;
    if (product.stock < 0) product.stock = 0;
    saveProducts(products);
    return product;
  }
  return null;
}

// ===== invoices =====
function loadInvoices() {
  let invoices = getData(STORAGE_KEYS.INVOICES);
  if (!invoices) invoices = [];
  return invoices;
}

function saveInvoices(invoices) {
  setData(STORAGE_KEYS.INVOICES, invoices);
}

function addInvoice(invoice) {
  const invoices = loadInvoices();
  invoice.id = Date.now();
  invoice.date = new Date().toLocaleString("ar-EG");
  invoices.unshift(invoice);
  saveInvoices(invoices);
  return invoice;
}

function deleteInvoice(id) {
  let invoices = loadInvoices();
  invoices = invoices.filter((inv) => inv.id !== id);
  saveInvoices(invoices);
  return invoices;
}

// ===== settings =====
function loadSettings() {
  let settings = getData(STORAGE_KEYS.SETTINGS);
  if (!settings) {
    settings = { darkMode: false };
    setData(STORAGE_KEYS.SETTINGS, settings);
  }
  return settings;
}

function saveSettings(settings) {
  setData(STORAGE_KEYS.SETTINGS, settings);
}

// ===== helper =====
function generateId() {
  return Date.now() + Math.random() * 1000;
}

// export for other files
window.Storage = {
  loadProducts,
  saveProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  loadInvoices,
  saveInvoices,
  addInvoice,
  deleteInvoice,
  loadSettings,
  saveSettings,
  generateId,
};
