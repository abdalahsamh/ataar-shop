// ===== dashboard.js =====

window.Dashboard = {
  init() {
    this.refresh();
    this.startLiveUpdates();
  },

  refresh() {
    const products = window.Storage.loadProducts();
    const invoices = window.Storage.loadInvoices();
    const customers = window.Storage.loadCustomers();
    const suppliers = window.Storage.loadSuppliers();

    // Stats
    const totalProducts = products.length;
    const totalInvoices = invoices.length;
    const totalProfit = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCustomers = customers.length;
    const totalSuppliers = suppliers.length;
    const totalStockValue = products.reduce((sum, p) => {
      let sellPrice = 0;
      if (p.type === "weighted") {
        sellPrice = Object.values(p.prices)[0] || 0;
      } else {
        sellPrice = p.price || 0;
      }
      return sum + sellPrice * p.stock;
    }, 0);
    const lowStock = products.filter((p) => {
      return p.type === "weighted" ? p.stock < 5 : p.stock < 10;
    }).length;

    // Animate numbers
    this.animateNumber("totalProfit", totalProfit);
    this.animateNumber("totalInvoices", totalInvoices);
    this.animateNumber("totalProducts", totalProducts);
    this.animateNumber("totalCustomers", totalCustomers);
    this.animateNumber("totalSuppliers", totalSuppliers);
    this.animateNumber("totalStockValue", totalStockValue);
    this.animateNumber("lowStock", lowStock);

    // Charts
    this.renderPieChart(products, invoices);
    this.renderDailyChart(invoices);

    // Tables
    this.renderRecentInvoices(invoices);
    this.renderStockAlerts(products);

    // Inventory
    this.renderInventory(products);

    // Top products
    this.renderTopProducts(invoices);
    this.renderBottomProducts(invoices, products);

    // Loyal customers
    this.renderLoyalCustomers(invoices, customers);

    // Top profit product
    this.renderTopProfitProduct(products);
  },

  animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let current = 0;
    const duration = 1800;
    const steps = 40;
    const increment = target / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        element.textContent = target;
        element.classList.add("count-animation");
        clearInterval(timer);
        return;
      }
      current += increment;
      element.textContent = Math.round(current);
    }, duration / steps);
  },

  renderPieChart(products, invoices) {
    const canvas = document.getElementById("salesChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const categories = ["عطارة", "حلويات", "معلبات", "بقالة"];
    const colors = ["#d4af37", "#28a745", "#17a2b8", "#ffc107"];

    const counts = categories.map((cat) => {
      let count = 0;
      invoices.forEach((inv) => {
        inv.items.forEach((item) => {
          const product = window.Storage.getProductById(item.productId);
          if (product && product.category === cat) {
            count += item.quantity;
          }
        });
      });
      return count;
    });

    const hasData = counts.some((c) => c > 0);
    const data = hasData ? counts : [30, 25, 20, 25];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 30;

    let startAngle = -Math.PI / 2;
    const total = data.reduce((a, b) => a + b, 0);

    let progress = 0;
    const animatePie = () => {
      progress += 0.02;
      if (progress > 1) progress = 1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let currentAngle = startAngle;
      data.forEach((value, index) => {
        if (value === 0) return;
        const sliceAngle = (value / total) * 2 * Math.PI * progress;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(
          centerX,
          centerY,
          radius,
          currentAngle,
          currentAngle + sliceAngle,
        );
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        const midAngle = currentAngle + sliceAngle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;

        const percent = Math.round((value / total) * 100);
        if (percent > 0 && progress > 0.8) {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 14px Tajawal";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${percent}%`, labelX, labelY);
        }

        currentAngle += sliceAngle;
      });

      if (progress < 1) {
        requestAnimationFrame(animatePie);
      } else {
        this.renderLegend(categories, data, colors);
      }
    };

    animatePie();
  },

  renderLegend(categories, data, colors) {
    const container = document.getElementById("chartLegend");
    if (!container) return;

    container.innerHTML = categories
      .map((cat, i) => {
        if (data[i] === 0) return "";
        return `
                <div class="legend-item">
                    <div class="legend-color" style="background:${colors[i % colors.length]}"></div>
                    ${cat} (${data[i]})
                </div>
            `;
      })
      .join("");
  },

  renderDailyChart(invoices) {
    const canvas = document.getElementById("dailySalesChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const days = [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];

    const today = new Date();
    const dailyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-CA");

      const total = invoices
        .filter((inv) => inv.date && inv.date.includes(dateStr))
        .reduce((sum, inv) => sum + inv.total, 0);

      dailyData.push(total);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const max = Math.max(...dailyData, 100);
    const barWidth = (canvas.width - 100) / dailyData.length;
    const baseY = canvas.height - 30;

    let progress = 0;
    const animateBars = () => {
      progress += 0.02;
      if (progress > 1) progress = 1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const y = baseY - (i / 4) * (baseY - 20);
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(canvas.width - 20, y);
        ctx.stroke();
      }

      dailyData.forEach((value, index) => {
        const x = 40 + index * barWidth + barWidth * 0.1;
        const height = (value / max) * (baseY - 40) * progress;
        const y = baseY - height;

        const gradient = ctx.createLinearGradient(0, y, 0, baseY);
        gradient.addColorStop(0, "#d4af37");
        gradient.addColorStop(1, "rgba(212,175,55,0.3)");

        ctx.fillStyle = gradient;
        ctx.shadowColor = "rgba(212,175,55,0.3)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth * 0.8, height, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#1a3c34";
        ctx.font = "12px Tajawal";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(value)}`, x + barWidth * 0.4, y - 8);

        ctx.fillStyle = "#6b7a6f";
        ctx.font = "11px Tajawal";
        ctx.textAlign = "center";
        ctx.fillText(days[index], x + barWidth * 0.4, baseY + 20);
      });

      if (progress < 1) {
        requestAnimationFrame(animateBars);
      }
    };

    animateBars();
  },

  renderRecentInvoices(invoices) {
    const tbody = document.getElementById("recentInvoices");
    if (!tbody) return;

    const recent = invoices.slice(0, 5);

    if (recent.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:#6b7a6f;">لا توجد فواتير</td></tr>';
      return;
    }

    tbody.innerHTML = recent
      .map((inv, index) => {
        const customerName = inv.customerName || "عميل نقدي";
        return `
                <tr class="slide-left" style="animation-delay:${index * 0.1}s">
                    <td>${index + 1}</td>
                    <td>${inv.date || "غير محدد"}</td>
                    <td>${customerName}</td>
                    <td><strong>${inv.total.toFixed(2)}</strong> ج.م</td>
                </tr>
            `;
      })
      .join("");
  },

  renderStockAlerts(products) {
    const container = document.getElementById("stockAlerts");
    if (!container) return;

    const alerts = products.filter((p) => {
      return p.type === "weighted" ? p.stock < 5 : p.stock < 10;
    });

    if (alerts.length === 0) {
      container.innerHTML =
        '<p style="color:#28a745;font-weight:600;animation:pop 0.5s ease;">✅ جميع المنتجات متوفرة</p>';
      return;
    }

    container.innerHTML = alerts
      .map((p, index) => {
        const supplier = window.Storage.getSupplierById(p.supplierId);
        const supplierName = supplier ? supplier.name : "";
        return `
                <div class="alert-item" style="animation:slideInLeft 0.5s ease ${index * 0.1}s forwards;">
                    <span class="alert-name">${p.name}</span>
                    <span>المتبقي: ${p.stock} ${p.unit === "kg" ? "كجم" : "قطعة"}</span>
                    ${supplierName ? `<span style="font-size:12px;color:#6b7a6f;">المورد: ${supplierName}</span>` : ""}
                </div>
            `;
      })
      .join("");
  },

  renderInventory(products) {
    let totalStock = 0;
    let totalSellValue = 0;
    let totalPurchaseValue = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      let sellPrice = 0;
      if (p.type === "weighted") {
        sellPrice = Object.values(p.prices)[0] || 0;
        totalStock += p.stock;
      } else {
        sellPrice = p.price || 0;
      }
      const buyPrice = p.purchasePrice || 0;
      totalSellValue += sellPrice * p.stock;
      totalPurchaseValue += buyPrice * p.stock;

      if (p.stock <= 0) outOfStock++;
      else if (p.stock < (p.type === "weighted" ? 5 : 10)) lowStock++;
    });

    document.getElementById("totalStockItems").textContent =
      totalStock.toFixed(1);
    document.getElementById("totalStockValueCard").textContent =
      totalSellValue.toFixed(0);
    document.getElementById("totalPurchaseValueCard").textContent =
      totalPurchaseValue.toFixed(0);
    document.getElementById("expectedProfitCard").textContent = (
      totalSellValue - totalPurchaseValue
    ).toFixed(0);
    document.getElementById("lowStockCount").textContent = lowStock;
    document.getElementById("outOfStockCount").textContent = outOfStock;

    const maxStock = 100;
    const percentage = Math.min((totalStock / maxStock) * 100, 100);
    document.getElementById("stockPercentage").textContent =
      `${Math.round(percentage)}%`;

    const progressBar = document.getElementById("stockProgressBar");
    progressBar.style.width = `${percentage}%`;
    if (percentage < 30) {
      progressBar.classList.add("danger");
    } else {
      progressBar.classList.remove("danger");
    }
  },

  renderTopProducts(invoices) {
    const container = document.getElementById("topProductsList");
    if (!container) return;

    const productSales = {};
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        productSales[item.productId] =
          (productSales[item.productId] || 0) + item.quantity;
      });
    });

    const sorted = Object.keys(productSales)
      .map((id) => ({ id: parseInt(id), quantity: productSales[id] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    if (sorted.length === 0) {
      container.innerHTML =
        '<p style="text-align:center;color:#6b7a6f;padding:20px;">لا توجد مبيعات بعد</p>';
      return;
    }

    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

    container.innerHTML = sorted
      .map((item, index) => {
        const product = window.Storage.getProductById(item.id);
        if (!product) return "";
        return `
                <div class="product-rank-item" style="animation:slideInRight 0.4s ease ${index * 0.1}s forwards;">
                    <span class="rank">${medals[index] || "🏅"}</span>
                    <span class="name">${product.name}</span>
                    <span class="count">${item.quantity} ${product.unit === "kg" ? "كجم" : "قطعة"}</span>
                    <span class="trend-up"><i class="fas fa-arrow-up"></i></span>
                </div>
            `;
      })
      .join("");
  },

  renderBottomProducts(invoices, products) {
    const container = document.getElementById("bottomProductsList");
    if (!container) return;

    const productSales = {};
    products.forEach((p) => {
      productSales[p.id] = 0;
    });

    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        productSales[item.productId] =
          (productSales[item.productId] || 0) + item.quantity;
      });
    });

    const sorted = Object.keys(productSales)
      .map((id) => ({ id: parseInt(id), quantity: productSales[id] || 0 }))
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);

    if (sorted.length === 0 || sorted.every((s) => s.quantity === 0)) {
      container.innerHTML =
        '<p style="text-align:center;color:#6b7a6f;padding:20px;">لا توجد بيانات كافية</p>';
      return;
    }

    const emojis = ["🪦", "😴", "🥱", "🤔", "😐"];

    container.innerHTML = sorted
      .map((item, index) => {
        const product = window.Storage.getProductById(item.id);
        if (!product) return "";
        return `
                <div class="product-rank-item" style="animation:slideInLeft 0.4s ease ${index * 0.1}s forwards;">
                    <span class="rank">${emojis[index] || "📦"}</span>
                    <span class="name">${product.name}</span>
                    <span class="count">${item.quantity} ${product.unit === "kg" ? "كجم" : "قطعة"}</span>
                    <span class="trend-down"><i class="fas fa-arrow-down"></i></span>
                </div>
            `;
      })
      .join("");
  },

  renderLoyalCustomers(invoices, customers) {
    const container = document.getElementById("loyalCustomersList");
    if (!container) return;

    const spendingMap = {};
    invoices.forEach((inv) => {
      if (inv.customerId) {
        spendingMap[inv.customerId] =
          (spendingMap[inv.customerId] || 0) + inv.total;
      }
    });

    const sorted = Object.keys(spendingMap)
      .map((id) => ({
        customer: customers.find((c) => c.id === parseInt(id)),
        spent: spendingMap[id],
      }))
      .filter((item) => item.customer)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    if (sorted.length === 0) {
      container.innerHTML =
        '<p style="text-align:center;color:#6b7a6f;padding:20px;">لا يوجد عملاء أوفياء بعد</p>';
      return;
    }

    const medals = ["🥇", "🥈", "🥉", "🏅", "🏅"];

    container.innerHTML = sorted
      .map(
        (item, index) => `
            <div class="loyalty-item" style="animation:slideInRight 0.5s ease ${index * 0.1}s forwards;">
                <span class="rank">${index + 1}</span>
                <span class="medal">${medals[index] || "🏅"}</span>
                <span class="customer-name">${item.customer.name}</span>
                <span class="customer-spent">${item.spent.toFixed(2)} ج.م</span>
            </div>
        `,
      )
      .join("");
  },

  renderTopProfitProduct(products) {
    let topProduct = null;
    let maxProfit = 0;

    products.forEach((p) => {
      let sellPrice = 0;
      if (p.type === "weighted") {
        sellPrice = Object.values(p.prices)[0] || 0;
      } else {
        sellPrice = p.price || 0;
      }
      const buyPrice = p.purchasePrice || 0;
      const profit = sellPrice - buyPrice;
      if (profit > maxProfit && p.stock > 0) {
        maxProfit = profit;
        topProduct = p;
      }
    });

    const el = document.getElementById("topProfitProduct");
    if (el) {
      if (topProduct) {
        el.textContent = `${topProduct.name} (${maxProfit.toFixed(2)} ج.م)`;
        el.style.fontSize = "16px";
      } else {
        el.textContent = "لا توجد بيانات";
      }
    }
  },

  startLiveUpdates() {
    setInterval(() => {
      this.refresh();
    }, 30000);
  },
};

// ===== roundRect polyfill for canvas =====
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
  };
}
