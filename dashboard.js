// ===== dashboard.js =====

window.Dashboard = {
  chartInstance: null,

  init() {
    this.refresh();
  },

  refresh() {
    const products = window.Storage.loadProducts();
    const invoices = window.Storage.loadInvoices();

    // calculate stats
    const totalProducts = products.length;
    const totalInvoices = invoices.length;
    const totalProfit = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const lowStock = products.filter((p) => {
      if (p.type === "weighted") {
        return p.stock < 5;
      } else {
        return p.stock < 10;
      }
    }).length;

    // animate numbers
    this.animateNumber("totalProfit", totalProfit, "ج.م");
    this.animateNumber("totalInvoices", totalInvoices);
    this.animateNumber("totalProducts", totalProducts);
    this.animateNumber("lowStock", lowStock);

    // render chart
    this.renderChart(products, invoices);

    // render recent invoices
    this.renderRecentInvoices(invoices);

    // render stock alerts
    this.renderStockAlerts(products);
  },

  animateNumber(elementId, target, suffix = "") {
    const element = document.getElementById(elementId);
    if (!element) return;

    let current = 0;
    const duration = 1500;
    const steps = 30;
    const increment = target / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        element.textContent = target;
        clearInterval(timer);
        return;
      }
      current += increment;
      element.textContent = Math.round(current);
    }, duration / steps);
  },

  renderChart(products, invoices) {
    const canvas = document.getElementById("salesChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // count sales by category
    const categories = ["عطارة", "حلويات", "معلبات", "بقالة"];
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

    // if no data, use sample
    const hasData = counts.some((c) => c > 0);
    const data = hasData ? counts : [30, 25, 20, 25];

    const colors = ["#d4af37", "#28a745", "#17a2b8", "#ffc107"];

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw pie chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 30;

    let startAngle = -Math.PI / 2;
    const total = data.reduce((a, b) => a + b, 0);

    data.forEach((value, index) => {
      if (value === 0) return;
      const sliceAngle = (value / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // draw label
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(midAngle) * labelRadius;
      const labelY = centerY + Math.sin(midAngle) * labelRadius;

      const percent = Math.round((value / total) * 100);
      if (percent > 0) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Tajawal";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${percent}%`, labelX, labelY);
      }

      startAngle += sliceAngle;
    });

    // draw legend
    let legendY = 20;
    categories.forEach((cat, i) => {
      const count = data[i];
      if (count === 0) return;

      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(10, legendY, 15, 15);
      ctx.fillStyle = "#1a3c34";
      ctx.font = "12px Tajawal";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${cat} (${count})`, 30, legendY + 7);
      legendY += 25;
    });
  },

  renderRecentInvoices(invoices) {
    const tbody = document.getElementById("recentInvoices");
    if (!tbody) return;

    const recent = invoices.slice(0, 5);

    if (recent.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" style="text-align:center;color:#6b7a6f;">لا توجد فواتير</td></tr>';
      return;
    }

    tbody.innerHTML = recent
      .map(
        (inv, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${inv.date || "غير محدد"}</td>
                <td><strong>${inv.total.toFixed(2)}</strong> ج.م</td>
            </tr>
        `,
      )
      .join("");
  },

  renderStockAlerts(products) {
    const container = document.getElementById("stockAlerts");
    if (!container) return;

    const alerts = products.filter((p) => {
      if (p.type === "weighted") {
        return p.stock < 5;
      } else {
        return p.stock < 10;
      }
    });

    if (alerts.length === 0) {
      container.innerHTML =
        '<p style="color:#28a745;font-weight:600;">✅ جميع المنتجات متوفرة</p>';
      return;
    }

    container.innerHTML = alerts
      .map(
        (p) => `
            <div class="alert-item">
                <span class="alert-name">${p.name}</span>
                <span>المتبقي: ${p.stock} ${p.unit === "kg" ? "كجم" : "قطعة"}</span>
            </div>
        `,
      )
      .join("");
  },
};
