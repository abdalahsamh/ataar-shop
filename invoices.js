// ===== invoices.js =====

const INVOICE_PASSWORD = "admin123"; // غير كلمة المرور هنا

window.Invoices = {
  isUnlocked: false,
  currentFilter: "all", // all, today, week, month, custom
  filterFrom: null,
  filterTo: null,

  init() {
    this.render();
    this.setupEvents();
    this.checkLockStatus();
    this.setDefaultDates();
  },

  setDefaultDates() {
    const today = new Date().toISOString().split("T")[0];
    const fromInput = document.getElementById("filterDateFrom");
    const toInput = document.getElementById("filterDateTo");
    if (fromInput) fromInput.value = today;
    if (toInput) toInput.value = today;
  },

  checkLockStatus() {
    const locked = localStorage.getItem("invoices_locked");
    if (locked === "false") {
      this.isUnlocked = true;
      this.showContent(true);
    } else {
      this.isUnlocked = false;
      this.showContent(false);
    }
  },

  showContent(unlocked) {
    const lockScreen = document.getElementById("invoiceLockScreen");
    const content = document.getElementById("invoiceContent");

    if (unlocked) {
      lockScreen.style.display = "none";
      content.style.display = "block";
      this.render();
    } else {
      lockScreen.style.display = "block";
      content.style.display = "none";
    }
  },

  setupEvents() {
    document
      .getElementById("unlockInvoicesBtn")
      ?.addEventListener("click", () => this.unlock());
    document
      .getElementById("invoicePassword")
      ?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.unlock();
      });
    document
      .getElementById("lockInvoicesBtn")
      ?.addEventListener("click", () => this.lock());
    document
      .getElementById("exportInvoicesBtn")
      ?.addEventListener("click", () => this.exportInvoices());
  },

  unlock() {
    const password = document.getElementById("invoicePassword").value;
    const errorEl = document.getElementById("invoicePasswordError");

    if (password === INVOICE_PASSWORD) {
      this.isUnlocked = true;
      localStorage.setItem("invoices_locked", "false");
      this.showContent(true);
      document.getElementById("invoicePassword").value = "";
      errorEl.style.display = "none";
      window.showToast("تم فتح الفواتير بنجاح", "success");
    } else {
      errorEl.style.display = "block";
      document.getElementById("invoicePassword").value = "";
      document.getElementById("invoicePassword").focus();
      window.showToast("كلمة المرور غير صحيحة", "error");
    }
  },

  lock() {
    this.isUnlocked = false;
    localStorage.setItem("invoices_locked", "true");
    this.showContent(false);
    document.getElementById("invoicePassword").value = "";
    document.getElementById("invoicePasswordError").style.display = "none";
    window.showToast("تم قفل الفواتير", "info");
  },

  // ===== دوال الفلتر الجديدة =====
  setFilter(filterType) {
    this.currentFilter = filterType;
    // تحديث شكل الأزرار
    document
      .querySelectorAll(".btn-filter")
      .forEach((btn) => btn.classList.remove("active-filter"));
    const btnMap = {
      today: "filterToday",
      week: "filterWeek",
      month: "filterMonth",
      all: "filterAll",
    };
    const activeBtn = document.getElementById(btnMap[filterType]);
    if (activeBtn) activeBtn.classList.add("active-filter");

    // إعادة التصيير
    this.render();
  },

  setCustomFilter() {
    const from = document.getElementById("filterDateFrom").value;
    const to = document.getElementById("filterDateTo").value;
    if (!from || !to) {
      window.showToast("يرجى اختيار تاريخ البداية والنهاية", "warning");
      return;
    }
    if (from > to) {
      window.showToast(
        "تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية",
        "error",
      );
      return;
    }
    this.currentFilter = "custom";
    this.filterFrom = from;
    this.filterTo = to;

    // إزالة التظليل من الأزرار السريعة
    document
      .querySelectorAll(".btn-filter")
      .forEach((btn) => btn.classList.remove("active-filter"));

    this.render();
    window.showToast(`تم التصفية من ${from} إلى ${to}`, "success");
  },

  // ===== دالة التصفية الأساسية =====
  getFilteredInvoices() {
    const invoices = window.Storage.loadInvoices();
    const now = new Date();
    let filtered = [...invoices];

    switch (this.currentFilter) {
      case "today":
        const todayStr = now.toISOString().split("T")[0];
        filtered = invoices.filter((inv) => {
          if (!inv.date) return false;
          const invDate = new Date(inv.date);
          const invStr = invDate.toISOString().split("T")[0];
          return invStr === todayStr;
        });
        break;

      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        filtered = invoices.filter((inv) => {
          if (!inv.date) return false;
          const invDate = new Date(inv.date);
          return invDate >= weekStart;
        });
        break;

      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = invoices.filter((inv) => {
          if (!inv.date) return false;
          const invDate = new Date(inv.date);
          return invDate >= monthStart;
        });
        break;

      case "custom":
        if (this.filterFrom && this.filterTo) {
          const fromDate = new Date(this.filterFrom);
          const toDate = new Date(this.filterTo);
          toDate.setHours(23, 59, 59, 999);

          filtered = invoices.filter((inv) => {
            if (!inv.date) return false;
            const invDate = new Date(inv.date);
            return invDate >= fromDate && invDate <= toDate;
          });
        }
        break;

      default: // 'all'
        break;
    }

    return filtered;
  },

  render() {
    if (!this.isUnlocked) return;

    const filteredInvoices = this.getFilteredInvoices();
    const tbody = document.getElementById("invoicesTableBody");
    if (!tbody) return;

    if (filteredInvoices.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:#6b7a6f;">لا توجد فواتير في هذه الفترة</td></tr>';
      return;
    }

    tbody.innerHTML = filteredInvoices
      .map((inv, index) => {
        const customerName = inv.customerName || "عميل نقدي";
        const discountDisplay = inv.discount
          ? `${inv.discount.toFixed(2)} ج.م`
          : "-";

        return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${inv.date || "غير محدد"}</td>
                    <td>${customerName}</td>
                    <td>${inv.items.length}</td>
                    <td>${discountDisplay}</td>
                    <td><strong>${inv.total.toFixed(2)}</strong> ج.م</td>
                    <td>
                        <button class="action-btn edit" onclick="window.Invoices.viewInvoice(${inv.id})"><i class="fas fa-eye"></i></button>
                        <button class="action-btn delete" onclick="window.Invoices.deleteInvoice(${inv.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
      })
      .join("");
  },

  viewInvoice(id) {
    if (!this.isUnlocked) return;

    const invoices = window.Storage.loadInvoices();
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) {
      window.showToast("الفاتورة غير موجودة", "error");
      return;
    }

    const modal = document.getElementById("invoiceModal");
    const details = document.getElementById("invoiceDetails");
    if (!modal || !details) return;

    const customerName = invoice.customerName || "عميل نقدي";
    const discountDisplay = invoice.discount
      ? `${invoice.discount.toFixed(2)} ج.م (${invoice.discountName || "خصم"})`
      : "لا يوجد";

    details.innerHTML = `
            <div style="padding:20px 0;">
                <h4 style="text-align:center;color:#d4af37;margin-bottom:20px;">🧾 تفاصيل الفاتورة</h4>
                <p><strong>رقم الفاتورة:</strong> #${invoice.id}</p>
                <p><strong>التاريخ:</strong> ${invoice.date || "غير محدد"}</p>
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
                                <td style="text-align:center;padding:8px;">${item.type === "weighted" ? `${item.quantity} كجم` : `${item.quantity} قطعة`}</td>
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

  deleteInvoice(id) {
    if (!this.isUnlocked) return;
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;

    window.Storage.deleteInvoice(id);
    window.showToast("تم حذف الفاتورة", "warning");
    this.render();
    window.Dashboard?.refresh();
  },

  exportInvoices() {
    if (!this.isUnlocked) return;

    const filteredInvoices = this.getFilteredInvoices();
    if (filteredInvoices.length === 0) {
      window.showToast("لا توجد فواتير للتصدير في هذه الفترة", "warning");
      return;
    }

    let csv = "رقم الفاتورة,التاريخ,العميل,عدد المنتجات,الخصم,الإجمالي\n";
    filteredInvoices.forEach((inv, index) => {
      const customerName = inv.customerName || "عميل نقدي";
      const discountDisplay = inv.discount ? inv.discount.toFixed(2) : "0";
      csv += `${index + 1},${inv.date || ""},${customerName},${inv.items.length},${discountDisplay},${inv.total.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `الفواتير_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    window.showToast("تم تصدير الفواتير بنجاح", "success");
  },
};
