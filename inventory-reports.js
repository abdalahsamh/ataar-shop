// ===== inventory-reports.js =====

window.InventoryReports = {
  currentReportType: "all",

  init() {
    this.renderReport("all");
    this.setupEvents();
  },

  setupEvents() {
    const exportBtn = document.getElementById("exportInventoryBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportReport());
    }

    const printBtn = document.getElementById("printInventoryBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => window.print());
    }
  },

  renderReport(period) {
    this.currentReportType = period;
    const invoices = window.Storage.loadInvoices();
    const products = window.Storage.loadProducts();
    const now = new Date();
    let filteredInvoices = [];

    switch (period) {
      case "monthly":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredInvoices = invoices.filter((inv) => {
          const invDate = new Date(inv.date);
          return invDate >= monthStart;
        });
        break;
      case "semiannual":
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        filteredInvoices = invoices.filter((inv) => {
          const invDate = new Date(inv.date);
          return invDate >= sixMonthsAgo;
        });
        break;
      case "yearly":
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        filteredInvoices = invoices.filter((inv) => {
          const invDate = new Date(inv.date);
          return invDate >= oneYearAgo;
        });
        break;
      default:
        filteredInvoices = invoices;
    }

    // Inventory stats
    let totalStock = 0;
    let totalSellValue = 0;
    let totalPurchaseValue = 0;
    let totalProfit = 0;

    const productRows = products
      .map((p) => {
        let sellPrice = 0;
        if (p.type === "weighted") {
          sellPrice = Object.values(p.prices)[0] || 0;
        } else {
          sellPrice = p.price || 0;
        }
        const buyPrice = p.purchasePrice || 0;
        const stock = p.stock || 0;
        const sellValue = sellPrice * stock;
        const purchaseValue = buyPrice * stock;
        const profit = sellValue - purchaseValue;

        totalStock += stock;
        totalSellValue += sellValue;
        totalPurchaseValue += purchaseValue;
        totalProfit += profit;

        const supplier = window.Storage.getSupplierById(p.supplierId);
        const supplierName = supplier ? supplier.name : "-";

        return `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.category}</td>
                    <td>${buyPrice.toFixed(2)} ج.م</td>
                    <td>${sellPrice.toFixed(2)} ج.م</td>
                    <td>${stock} ${p.unit === "kg" ? "كجم" : "قطعة"}</td>
                    <td>${supplierName}</td>
                    <td>${sellValue.toFixed(2)} ج.م</td>
                    <td style="color:${profit >= 0 ? "#28a745" : "#dc3545"}">${profit.toFixed(2)} ج.م</td>
                </tr>
            `;
      })
      .join("");

    // Invoice stats
    const totalSales = filteredInvoices.reduce(
      (sum, inv) => sum + inv.total,
      0,
    );
    const totalInvoices = filteredInvoices.length;
    const totalItems = filteredInvoices.reduce(
      (sum, inv) => sum + inv.items.length,
      0,
    );

    const periodNames = {
      all: "كل الفواتير",
      monthly: "تقرير شهري",
      semiannual: "تقرير نصف سنوي",
      yearly: "تقرير سنوي",
    };

    const container = document.getElementById("inventoryReportContent");
    if (!container) return;

    container.innerHTML = `
            <div style="margin-bottom:20px;">
                <h4 style="color:#d4af37;margin-bottom:15px;">📋 ${periodNames[period] || "تقرير الجرد"}</h4>
                
                <!-- Inventory Summary -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;margin-bottom:20px;">
                    <div class="stat-card" style="padding:15px;text-align:center;">
                        <span class="stat-label">📦 إجمالي المخزون</span>
                        <span class="stat-number" style="font-size:20px;">${totalStock.toFixed(1)}</span>
                        <span class="stat-currency">كجم</span>
                    </div>
                    <div class="stat-card" style="padding:15px;text-align:center;border-right-color:#28a745;">
                        <span class="stat-label">💰 قيمة المخزون (بيع)</span>
                        <span class="stat-number" style="font-size:20px;color:#28a745;">${totalSellValue.toFixed(2)}</span>
                        <span class="stat-currency">ج.م</span>
                    </div>
                    <div class="stat-card" style="padding:15px;text-align:center;border-right-color:#17a2b8;">
                        <span class="stat-label">📦 قيمة المخزون (شراء)</span>
                        <span class="stat-number" style="font-size:20px;color:#17a2b8;">${totalPurchaseValue.toFixed(2)}</span>
                        <span class="stat-currency">ج.م</span>
                    </div>
                    <div class="stat-card" style="padding:15px;text-align:center;border-right-color:#d4af37;">
                        <span class="stat-label">📈 الربح المتوقع</span>
                        <span class="stat-number" style="font-size:20px;color:#d4af37;">${totalProfit.toFixed(2)}</span>
                        <span class="stat-currency">ج.م</span>
                    </div>
                </div>

                <!-- Products Table -->
                <div style="overflow-x:auto;margin-bottom:25px;">
                    <h5 style="margin-bottom:10px;color:#1a3c34;">📋 تفاصيل المخزون</h5>
                    <table class="products-table" id="inventoryPrintTable">
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>التصنيف</th>
                                <th>سعر الشراء</th>
                                <th>سعر البيع</th>
                                <th>الكمية</th>
                                <th>المورد</th>
                                <th>قيمة المخزون</th>
                                <th>الربح المتوقع</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                              products.length === 0
                                ? '<tr><td colspan="8" style="text-align:center;color:#6b7a6f;">لا توجد منتجات</td></tr>'
                                : productRows
                            }
                        </tbody>
                        <tfoot style="font-weight:700;background:rgba(212,175,55,0.1);">
                            <tr>
                                <td colspan="6" style="text-align:left;">الإجمالي الكلي:</td>
                                <td>${totalSellValue.toFixed(2)} ج.م</td>
                                <td>${totalProfit.toFixed(2)} ج.م</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <!-- Invoices Report -->
                <div style="overflow-x:auto;">
                    <h5 style="margin-bottom:10px;color:#1a3c34;">🧾 ${periodNames[period] || "كل الفواتير"}</h5>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:15px;">
                        <div class="stat-card" style="padding:12px;text-align:center;">
                            <span class="stat-label">💰 إجمالي المبيعات</span>
                            <span class="stat-number" style="font-size:18px;">${totalSales.toFixed(2)}</span>
                            <span class="stat-currency">ج.م</span>
                        </div>
                        <div class="stat-card" style="padding:12px;text-align:center;border-right-color:#17a2b8;">
                            <span class="stat-label">📄 عدد الفواتير</span>
                            <span class="stat-number" style="font-size:18px;">${totalInvoices}</span>
                        </div>
                        <div class="stat-card" style="padding:12px;text-align:center;border-right-color:#28a745;">
                            <span class="stat-label">📦 عدد المنتجات المباعة</span>
                            <span class="stat-number" style="font-size:18px;">${totalItems}</span>
                        </div>
                    </div>
                    <table class="products-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>التاريخ</th>
                                <th>العميل</th>
                                <th>عدد المنتجات</th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                              filteredInvoices.length === 0
                                ? '<tr><td colspan="5" style="text-align:center;color:#6b7a6f;">لا توجد فواتير في هذه الفترة</td></tr>'
                                : filteredInvoices
                                    .map(
                                      (inv, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${inv.date || "غير محدد"}</td>
                                        <td>${inv.customerName || "عميل نقدي"}</td>
                                        <td>${inv.items.length}</td>
                                        <td><strong>${inv.total.toFixed(2)}</strong> ج.م</td>
                                    </tr>
                                `,
                                    )
                                    .join("")
                            }
                        </tbody>
                        <tfoot style="font-weight:700;background:rgba(212,175,55,0.1);">
                            <tr>
                                <td colspan="4" style="text-align:left;">الإجمالي الكلي:</td>
                                <td>${totalSales.toFixed(2)} ج.م</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
  },

  exportReport() {
    const table = document.getElementById("inventoryPrintTable");
    if (!table) {
      window.showToast("لا توجد بيانات للتصدير", "error");
      return;
    }

    let csv =
      "المنتج,التصنيف,سعر الشراء,سعر البيع,الكمية,المورد,قيمة المخزون,الربح المتوقع\n";
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length === 8) {
        csv += cells.map((cell) => cell.textContent.trim()).join(",") + "\n";
      }
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_الجرد_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.showToast("تم تصدير التقرير بنجاح", "success");
  },
};
