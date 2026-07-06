// ===== storage.js =====

const STORAGE_KEYS = {
  PRODUCTS: "herb_products",
  INVOICES: "herb_invoices",
  SETTINGS: "herb_settings",
  CUSTOMERS: "herb_customers",
  SUPPLIERS: "herb_suppliers",
  DISCOUNTS: "herb_discounts",
};

// ===== Generic functions =====
function getData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function setData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ===== Products =====
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

function updateStock(id, quantity) {
  const products = loadProducts();
  const product = products.find((p) => p.id === id);
  if (product) {
    product.stock = Math.max(0, product.stock - quantity);
    saveProducts(products);
    return product;
  }
  return null;
}

// ===== Default products =====
function getDefaultProducts() {
  return [
    {
      id: 1,
      name: "لوز",
      category: "حلويات",
      type: "weighted",
      prices: { 1: 120, 0.5: 65, 0.25: 35, 0.125: 20 },
      purchasePrice: 80,
      supplierId: null,
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
      purchasePrice: 50,
      supplierId: null,
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
      purchasePrice: 35,
      supplierId: null,
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
      purchasePrice: 30,
      supplierId: null,
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
      purchasePrice: 15,
      supplierId: null,
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
      purchasePrice: 15,
      supplierId: null,
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
      purchasePrice: 18,
      supplierId: null,
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
      purchasePrice: 90,
      supplierId: null,
      stock: 15,
      unit: "kg",
      icon: "fa-spice",
    },
  ];
}

// ===== Invoices =====
function loadInvoices() {
  let invoices = getData(STORAGE_KEYS.INVOICES);
  return invoices || [];
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
}

// ===== Customers =====
function loadCustomers() {
  let customers = getData(STORAGE_KEYS.CUSTOMERS);
  return customers || [];
}

function saveCustomers(customers) {
  setData(STORAGE_KEYS.CUSTOMERS, customers);
}

function getCustomerById(id) {
  const customers = loadCustomers();
  return customers.find((c) => c.id === id);
}

// ===== Suppliers =====
function loadSuppliers() {
  let suppliers = getData(STORAGE_KEYS.SUPPLIERS);
  return suppliers || [];
}

function saveSuppliers(suppliers) {
  setData(STORAGE_KEYS.SUPPLIERS, suppliers);
}

function getSupplierById(id) {
  const suppliers = loadSuppliers();
  return suppliers.find((s) => s.id === id);
}

// ===== Discounts =====
function loadDiscounts() {
  let discounts = getData(STORAGE_KEYS.DISCOUNTS);
  return discounts || [];
}

function saveDiscounts(discounts) {
  setData(STORAGE_KEYS.DISCOUNTS, discounts);
}

// ===== Settings =====
function loadSettings() {
  let settings = getData(STORAGE_KEYS.SETTINGS);
  return settings || { darkMode: false };
}

function saveSettings(settings) {
  setData(STORAGE_KEYS.SETTINGS, settings);
}

// ===== Calculate profit =====
function calculateProfit(productId) {
  const product = getProductById(productId);
  if (!product) return 0;

  let sellPrice = 0;
  if (product.type === "weighted") {
    sellPrice = Object.values(product.prices)[0] || 0;
  } else {
    sellPrice = product.price || 0;
  }
  return sellPrice - (product.purchasePrice || 0);
}

// ===== Export =====
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
  loadCustomers,
  saveCustomers,
  getCustomerById,
  loadSuppliers,
  saveSuppliers,
  getSupplierById,
  loadDiscounts,
  saveDiscounts,
  loadSettings,
  saveSettings,
  calculateProfit,
};
