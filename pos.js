// ===== pos.js =====

window.POS = {
  cart: [],
  currentCustomer: null,
  currentDiscount: null,

  init() {
    this.render();
    this.setupEvents();
  },

  render() {
    const products = window.Storage.loadProducts();
    const grid = document.getElementById("posGrid");
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML =
        '<p style="text-align:center;color:#6b7a6f;padding:40px;">لا توجد منتجات</p>';
      return;
    }

    grid.innerHTML = products
      .map((p) => {
        const priceDisplay =
          p.type === "weighted"
            ? `${Object.values(p.prices)[0]?.toFixed(2) || 0} ج.م`
            : `${p.price?.toFixed(2) || 0} ج.م`;
        const stockDisplay =
          p.type === "weighted" ? `${p.stock} كجم` : `${p.stock} قطعة`;

        return `
                <div class="pos-item" data-id="${p.id}" onclick="window.POS.selectProduct(${p.id})">
                    <div class="product-icon"><i class="fas ${p.icon || "fa-box"}"></i></div>
                    <div class="product-name">${p.type === "weighted" ? "⚖️" : "🥫"} ${p.name}</div>
                    <div class="product-price">${priceDisplay}</div>
                    <div class="product-stock">المتبقي: ${stockDisplay}</div>
                </div>
            `;
      })
      .join("");

    this.renderCart();
  },

  selectProduct(id) {
    const product = window.Storage.getProductById(id);
    if (!product) return;

    if (product.type === "weighted") {
      this.showWeightSelection(product);
    } else {
      this.addToCart(id, 1);
    }
  },

  showWeightSelection(product) {
    const weights = Object.keys(product.prices).sort(
      (a, b) => parseFloat(b) - parseFloat(a),
    );

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay show";
    overlay.id = "weightModal";
    overlay.innerHTML = `
            <div class="modal-content weight-pop">
                <div class="modal-header">
                    <h3>اختر وزن ${product.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="weight-options">
                    ${weights
                      .map((w) => {
                        const weightName =
                          w === "1"
                            ? "1 كجم"
                            : w === "0.5"
                              ? "½ كجم"
                              : w === "0.25"
                                ? "¼ كجم"
                                : "⅛ كجم";
                        return `
                            <button class="weight-btn" onclick="window.POS.addWeightedToCart(${product.id}, ${w})">
                                ${weightName}
                                <span class="weight-price">${product.prices[w].toFixed(2)} ج.م</span>
                            </button>
                        `;
                      })
                      .join("")}
                </div>
            </div>
        `;
    document.body.appendChild(overlay);
  },

  addWeightedToCart(productId, weight) {
    const product = window.Storage.getProductById(productId);
    if (!product) return;

    const price = product.prices[weight];
    if (!price) {
      window.showToast("هذا الوزن غير متوفر", "error");
      return;
    }
    if (product.stock < weight) {
      window.showToast(
        `المخزون غير كافٍ (المتبقي: ${product.stock} كجم)`,
        "error",
      );
      return;
    }

    this.addToCart(productId, weight, price);
    document.getElementById("weightModal")?.remove();
  },

  addToCart(productId, quantity, customPrice = null) {
    const product = window.Storage.getProductById(productId);
    if (!product) return;

    const price = customPrice || product.price;

    const existing = this.cart.find(
      (item) =>
        item.productId === productId &&
        (item.weight === quantity ||
          (!product.type === "weighted" && item.quantity === quantity)),
    );

    if (existing) {
      existing.quantity += quantity;
      existing.total = existing.quantity * price;
    } else {
      this.cart.push({
        productId: productId,
        name: product.name,
        type: product.type,
        weight: product.type === "weighted" ? quantity : null,
        quantity: product.type === "weighted" ? quantity : 1,
        price: price,
        purchasePrice: product.purchasePrice || 0,
        total: price * (product.type === "weighted" ? quantity : 1),
      });
    }

    this.renderCart();
    this.applyDiscount();
    window.showToast(`تم إضافة ${product.name}`, "success");
  },

  renderCart() {
    const container = document.getElementById("cartItems");
    const totalElement = document.getElementById("cartTotal");
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = '<p class="empty-cart">🛒 السلة فارغة</p>';
      if (totalElement) totalElement.textContent = "0";
      return;
    }

    container.innerHTML = this.cart
      .map((item, index) => {
        const detail =
          item.type === "weighted"
            ? `وزن: ${item.weight} كجم`
            : `العدد: ${item.quantity}`;
        return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-detail">${detail}</div>
                    </div>
                    <div class="cart-item-qty">
                        <button onclick="window.POS.updateCartQty(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="window.POS.updateCartQty(${index}, 1)">+</button>
                    </div>
                    <div class="cart-item-total">${item.total.toFixed(2)}</div>
                    <button class="cart-item-remove" onclick="window.POS.removeFromCart(${index})"><i class="fas fa-times"></i></button>
                </div>
            `;
      })
      .join("");

    const total = this.cart.reduce((sum, item) => sum + item.total, 0);
    if (totalElement) {
      totalElement.textContent = this.currentDiscount
        ? this.currentDiscount.finalTotal.toFixed(2)
        : total.toFixed(2);
    }
  },

  updateCartQty(index, delta) {
    if (index < 0 || index >= this.cart.length) return;

    const item = this.cart[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      this.removeFromCart(index);
      return;
    }

    const product = window.Storage.getProductById(item.productId);
    if (product) {
      if (item.type === "weighted" && product.stock < newQty * item.weight) {
        window.showToast("المخزون غير كافٍ", "error");
        return;
      } else if (item.type === "fixed" && product.stock < newQty) {
        window.showToast("المخزون غير كافٍ", "error");
        return;
      }
    }

    item.quantity = newQty;
    item.total = item.price * newQty;
    this.renderCart();
    this.applyDiscount();
  },

  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.renderCart();
    this.applyDiscount();
  },

  setupEvents() {
    const search = document.getElementById("posSearch");
    if (search) {
      search.addEventListener("input", (e) => {
        this.filterProducts(e.target.value);
      });
    }

    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        this.checkout();
      });
    }

    const clearBtn = document.getElementById("clearCartBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (this.cart.length === 0) return;
        if (confirm("هل أنت متأكد من تفريغ السلة؟")) {
          this.cart = [];
          this.currentCustomer = null;
          this.currentDiscount = null;
          this.renderCart();
          document.getElementById("customerDisplay").style.display = "none";
          document.getElementById("discountDisplay").innerHTML = "";
          window.showToast("تم تفريغ السلة", "info");
        }
      });
    }

    const selectCustomerBtn = document.getElementById("selectCustomerBtn");
    if (selectCustomerBtn) {
      selectCustomerBtn.addEventListener("click", () => {
        this.selectCustomer();
      });
    }
  },

  filterProducts(query) {
    const items = document.querySelectorAll(".pos-item");
    const q = query.toLowerCase().trim();
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? "" : "none";
    });
  },

  selectCustomer() {
    const customers = window.Storage.loadCustomers();
    if (customers.length === 0) {
      window.showToast("لا يوجد عملاء. أضف عميلاً أولاً", "warning");
      return;
    }

    const listContainer = document.getElementById("customerSelectList");
    const modal = document.getElementById("customerSelectModal");
    if (!listContainer || !modal) return;

    listContainer.innerHTML = customers
      .map(
        (c) => `
            <button onclick="window.POS.setCustomer(${c.id})" 
                    style="display:block;width:100%;padding:12px;margin:5px 0;border:2px solid #e8e0d0;border-radius:10px;background:white;font-family:'Tajawal',sans-serif;font-size:16px;cursor:pointer;transition:all 0.3s ease;text-align:right;">
                <strong>${c.name}</strong>
                ${c.phone ? `<span style="color:#6b7a6f;font-size:14px;margin-right:10px;">📱 ${c.phone}</span>` : ""}
            </button>
        `,
      )
      .join("");

    modal.classList.add("show");
  },

  setCustomer(customerId) {
    const customer = window.Storage.getCustomerById(customerId);
    if (!customer) return;

    this.currentCustomer = customer;
    document.getElementById("customerSelectModal")?.classList.remove("show");

    const display = document.getElementById("customerDisplay");
    const nameSpan = document.getElementById("currentCustomer");
    if (display && nameSpan) {
      nameSpan.textContent = customer.name;
      display.style.display = "block";
    }

    window.showToast(`تم اختيار العميل: ${customer.name}`, "success");
    this.applyDiscount();
  },

  applyDiscount() {
    const total = this.cart.reduce((sum, item) => sum + item.total, 0);
    if (total === 0) {
      this.currentDiscount = null;
      this.updateDiscountUI(null);
      this.renderCart();
      return;
    }

    const discountResult = window.Discounts.calculateDiscount(total);
    if (discountResult && discountResult.amount > 0) {
      this.currentDiscount = discountResult;
      this.updateDiscountUI(discountResult);
    } else {
      this.currentDiscount = null;
      this.updateDiscountUI(null);
    }
    this.renderCart();
  },

  updateDiscountUI(discountResult) {
    const container = document.getElementById("discountDisplay");
    if (!container) return;

    if (discountResult && discountResult.amount > 0) {
      container.innerHTML = `
                <div style="background:#28a745;color:white;padding:8px 12px;border-radius:8px;margin:8px 0;display:flex;justify-content:space-between;align-items:center;animation:weightPop 0.3s ease;">
                    <span>🎉 خصم: ${discountResult.discount.name}</span>
                    <span>- ${discountResult.amount.toFixed(2)} ج.م</span>
                </div>
            `;
      container.style.display = "block";
    } else {
      container.innerHTML = "";
      container.style.display = "none";
    }
  },

  checkout() {
    if (this.cart.length === 0) {
      window.showToast("السلة فارغة!", "error");
      return;
    }

    // Check stock
    for (const item of this.cart) {
      const product = window.Storage.getProductById(item.productId);
      if (!product) {
        window.showToast(`المنتج ${item.name} غير موجود`, "error");
        return;
      }

      if (item.type === "weighted") {
        if (product.stock < item.quantity * item.weight) {
          window.showToast(`المخزون غير كافٍ لـ ${item.name}`, "error");
          return;
        }
      } else {
        if (product.stock < item.quantity) {
          window.showToast(`المخزون غير كافٍ لـ ${item.name}`, "error");
          return;
        }
      }
    }

    // Deduct stock
    for (const item of this.cart) {
      const qty =
        item.type === "weighted" ? item.quantity * item.weight : item.quantity;
      window.Storage.updateStock(item.productId, qty);
    }

    // Calculate totals
    const subtotal = this.cart.reduce((sum, item) => sum + item.total, 0);
    let discountAmount = 0;
    let discountName = null;
    let finalTotal = subtotal;

    if (this.currentDiscount) {
      discountAmount = this.currentDiscount.amount;
      discountName = this.currentDiscount.discount.name;
      finalTotal = this.currentDiscount.finalTotal;
    }

    // Create invoice
    const invoice = {
      items: this.cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        type: item.type,
        weight: item.weight,
        quantity: item.quantity,
        price: item.price,
        purchasePrice: item.purchasePrice || 0,
        total: item.total,
      })),
      subtotal: subtotal,
      discount: discountAmount,
      discountName: discountName,
      total: finalTotal,
      customerId: this.currentCustomer?.id || null,
      customerName: this.currentCustomer?.name || null,
    };

    window.Storage.addInvoice(invoice);
    this.showInvoicePreview(invoice);

    this.cart = [];
    this.currentCustomer = null;
    this.currentDiscount = null;
    this.renderCart();
    this.render();

    document.getElementById("customerDisplay").style.display = "none";
    document.getElementById("discountDisplay").innerHTML = "";

    if (window.Dashboard) window.Dashboard.refresh();
    window.showToast("تم إنهاء الفاتورة بنجاح 🎉", "success");
  },

  showInvoicePreview(invoice) {
    const modal = document.getElementById("invoiceModal");
    const details = document.getElementById("invoiceDetails");
    if (!modal || !details) return;

    const customerName = invoice.customerName || "عميل نقدي";
    const discountDisplay = invoice.discount
      ? `${invoice.discount.toFixed(2)} ج.م (${invoice.discountName || "خصم"})`
      : "لا يوجد";

    details.innerHTML = `
            <div style="padding:20px 0;">
                <h4 style="text-align:center;color:#d4af37;margin-bottom:20px;">🧾 فاتورة البيع</h4>
                <p><strong>التاريخ:</strong> ${new Date().toLocaleString("ar-EG")}</p>
                <p><strong>العميل:</strong> ${customerName}</p>
                <p><strong>الخصم:</strong> ${discountDisplay}</p>
                <hr style="margin:15px 0;border-color:#e8e0d0;" />
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:2px solid #d4af37;">
                            <th style="text-align:right;padding:8px;">المنتج</th>
                            <th style="text-align:center;padding:8px;">الكمية</th>
                            <th style="text-align:left;padding:8px;">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items
                          .map(
                            (item) => `
                            <tr style="border-bottom:1px solid #f0ebe0;">
                                <td style="padding:8px;">${item.name}</td>
                                <td style="text-align:center;padding:8px;">${item.type === "weighted" ? `${item.quantity * item.weight} كجم` : `${item.quantity} قطعة`}</td>
                                <td style="text-align:left;padding:8px;font-weight:700;color:#d4af37;">${item.total.toFixed(2)} ج.م</td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                    <tfoot>
                        ${
                          invoice.discount
                            ? `
                            <tr>
                                <td colspan="2" style="padding:8px;text-align:left;color:#dc3545;">الخصم:</td>
                                <td style="padding:8px;text-align:left;color:#dc3545;font-weight:700;">- ${invoice.discount.toFixed(2)} ج.م</td>
                            </tr>
                        `
                            : ""
                        }
                        <tr>
                            <td colspan="2" style="padding:12px;font-weight:700;font-size:18px;text-align:left;">الإجمالي الكلي:</td>
                            <td style="padding:12px;font-weight:800;font-size:22px;color:#d4af37;text-align:left;">${invoice.total.toFixed(2)} ج.م</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

    modal.classList.add("show");

    const printBtn = document.getElementById("printInvoiceBtn");
    if (printBtn) {
      printBtn.onclick = () => window.print();
    }
  },
};
