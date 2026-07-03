// ===== pos.js =====

window.POS = {
  cart: [],
  selectedWeight: null,
  selectedProductId: null,
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
        const typeIcon = p.type === "weighted" ? "⚖️" : "🥫";
        const priceDisplay =
          p.type === "weighted"
            ? `${Object.values(p.prices)[0]?.toFixed(2) || 0} ج.م`
            : `${p.price.toFixed(2)} ج.م`;
        const stockDisplay =
          p.type === "weighted" ? `${p.stock} كجم` : `${p.stock} قطعة`;

        return `
                <div class="pos-item" data-id="${p.id}" onclick="window.POS.selectProduct(${p.id})">
                    <div class="product-icon"><i class="fas ${p.icon || "fa-box"}"></i></div>
                    <div class="product-name">${typeIcon} ${p.name}</div>
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

    const existing = this.cart.find(
      (item) =>
        item.productId === productId &&
        (item.weight === quantity ||
          (!product.type === "weighted" && item.quantity === quantity)),
    );

    if (existing) {
      existing.quantity += quantity;
      existing.total = existing.quantity * (customPrice || existing.price);
    } else {
      const price = customPrice || product.price;
      this.cart.push({
        productId: productId,
        name: product.name,
        type: product.type,
        weight: product.type === "weighted" ? quantity : null,
        quantity: product.type === "weighted" ? quantity : 1,
        price: price,
        total: price * (product.type === "weighted" ? quantity : 1),
      });
    }

    this.animateFly(productId);
    this.renderCart();
    this.applyDiscount();
    window.showToast(`تم إضافة ${product.name}`, "success");
  },

  animateFly(productId) {
    const item = document.querySelector(`.pos-item[data-id="${productId}"]`);
    if (!item) return;

    const rect = item.getBoundingClientRect();
    const flyElement = item.cloneNode(true);
    flyElement.className = "fly-animation";
    flyElement.style.position = "fixed";
    flyElement.style.left = rect.left + "px";
    flyElement.style.top = rect.top + "px";
    flyElement.style.width = rect.width + "px";
    flyElement.style.zIndex = "9999";
    flyElement.style.pointerEvents = "none";
    flyElement.style.background = "#d4af37";
    flyElement.style.borderRadius = "12px";
    flyElement.style.padding = "10px";
    flyElement.style.color = "#1a3c34";
    flyElement.style.fontWeight = "700";
    flyElement.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)";
    document.body.appendChild(flyElement);

    const cart = document.querySelector(".pos-cart");
    if (cart) {
      const cartRect = cart.getBoundingClientRect();
      flyElement.style.transition =
        "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
      setTimeout(() => {
        flyElement.style.left =
          cartRect.left + cartRect.width / 2 - rect.width / 2 + "px";
        flyElement.style.top =
          cartRect.top + cartRect.height / 2 - rect.height / 2 + "px";
        flyElement.style.transform = "scale(0.2) rotate(360deg)";
        flyElement.style.opacity = "0";
      }, 50);
      setTimeout(() => {
        flyElement.remove();
        document.querySelector(".pos-cart")?.classList.add("cart-shake");
        setTimeout(
          () =>
            document.querySelector(".pos-cart")?.classList.remove("cart-shake"),
          400,
        );
      }, 700);
    } else {
      setTimeout(() => flyElement.remove(), 700);
    }
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
    document.getElementById("posSearch")?.addEventListener("input", (e) => {
      this.filterProducts(e.target.value);
    });

    document.getElementById("checkoutBtn")?.addEventListener("click", () => {
      this.checkout();
    });

    document.getElementById("clearCartBtn")?.addEventListener("click", () => {
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

    document
      .getElementById("selectCustomerBtn")
      ?.addEventListener("click", () => {
        this.selectCustomer();
      });
  },

  filterProducts(query) {
    const items = document.querySelectorAll(".pos-item");
    const q = query.toLowerCase().trim();
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? "" : "none";
    });
  },

  // ===== Customer functions =====
  selectCustomer() {
    const customers = window.Customers.loadCustomers();
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
                    style="display:block;width:100%;padding:12px;margin:5px 0;border:2px solid #e8e0d0;border-radius:10px;background:white;font-family:'Tajawal',sans-serif;font-size:16px;cursor:pointer;transition:all 0.3s ease;text-align:right;"
                    onmouseover="this.style.borderColor='#d4af37';this.style.background='#faf8f4';"
                    onmouseout="this.style.borderColor='#e8e0d0';this.style.background='white';">
                <strong>${c.name}</strong>
                ${c.phone ? `<span style="color:#6b7a6f;font-size:14px;margin-right:10px;">📱 ${c.phone}</span>` : ""}
                ${c.address ? `<span style="color:#6b7a6f;font-size:14px;margin-right:10px;">📍 ${c.address}</span>` : ""}
            </button>
        `,
      )
      .join("");

    modal.classList.add("show");
  },

  setCustomer(customerId) {
    const customer = window.Customers.getCustomer(customerId);
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

  // ===== Discount functions =====
  applyDiscount() {
    const total = this.cart.reduce((sum, item) => sum + item.total, 0);
    if (total === 0) {
      this.currentDiscount = null;
      this.updateDiscountUI(null);
      this.renderCart();
      return;
    }

    const customerId = this.currentCustomer?.id || null;
    const discountResult = window.Discounts.calculateDiscount(
      total,
      customerId,
    );

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

  // ===== Checkout =====
  checkout() {
    if (this.cart.length === 0) {
      window.showToast("السلة فارغة!", "error");
      return;
    }

    let canCheckout = true;
    const updates = [];

    for (const item of this.cart) {
      const product = window.Storage.getProductById(item.productId);
      if (!product) {
        window.showToast(`المنتج ${item.name} غير موجود`, "error");
        canCheckout = false;
        break;
      }

      if (item.type === "weighted") {
        const needed = item.quantity * item.weight;
        if (product.stock < needed) {
          window.showToast(
            `المخزون غير كافٍ لـ ${item.name} (المتبقي: ${product.stock} كجم)`,
            "error",
          );
          canCheckout = false;
          break;
        }
        updates.push({ id: item.productId, qty: needed, weighted: true });
      } else {
        if (product.stock < item.quantity) {
          window.showToast(
            `المخزون غير كافٍ لـ ${item.name} (المتبقي: ${product.stock})`,
            "error",
          );
          canCheckout = false;
          break;
        }
        updates.push({
          id: item.productId,
          qty: item.quantity,
          weighted: false,
        });
      }
    }

    if (!canCheckout) return;

    for (const update of updates) {
      window.Storage.updateStock(update.id, update.qty, update.weighted);
    }

    const subtotal = this.cart.reduce((sum, item) => sum + item.total, 0);
    let discountAmount = 0;
    let discountName = null;
    let finalTotal = subtotal;

    if (this.currentDiscount) {
      discountAmount = this.currentDiscount.amount;
      discountName = this.currentDiscount.discount.name;
      finalTotal = this.currentDiscount.finalTotal;
    }

    const invoice = {
      items: this.cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        type: item.type,
        weight: item.weight,
        quantity: item.quantity,
        price: item.price,
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

    window.Dashboard?.refresh();
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
    document
      .getElementById("printInvoiceBtn")
      ?.addEventListener("click", () => window.print());
  },
};
