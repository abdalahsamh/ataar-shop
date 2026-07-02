// ===== invoices.js =====

window.Invoices = {
  init() {
    this.render();
    this.setupEvents();
  },

  render() {
    const invoices = window.Storage.loadInvoices();
    const tbody = document.getElementById("invoicesTableBody");
    if (!tbody) return;

    if (invoices.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:#6b7a6f;">لا توجد فواتير</td></tr>';
      return;
    }

    tbody.innerHTML = invoices
      .map(
        (inv, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${inv.date || "غير محدد"}</td>
                <td>${inv.items.length}</td>
                <td><strong>${inv.total.toFixed(2)}</strong> ج.م</td>
                <td>
                    <button class="action-btn edit" onclick="window.Invoices.viewInvoice(${inv.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn delete" onclick="window.Invoices.deleteInvoice(${inv.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");
  },

  setupEvents() {
    // export button
    document
      .getElementById("exportInvoicesBtn")
      ?.addEventListener("click", () => {
        this.exportInvoices();
      });
  },

  viewInvoice(id) {
    const invoices = window.Storage.loadInvoices();
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) {
      window.showToast("الفاتورة غير موجودة", "error");
      return;
    }

    const modal = document.getElementById("invoiceModal");
    const details = document.getElementById("invoiceDetails");

    if (!modal || !details) return;

    details.innerHTML = `
            <div style="padding:20px 0;">
                <h4 style="text-align:center;color:#d4af37;margin-bottom:20px;">🧾 تفاصيل الفاتورة</h4>
                <p><strong>رقم الفاتورة:</strong> #${invoice.id}</p>
                <p><strong>التاريخ:</strong> ${invoice.date || "غير محدد"}</p>
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
                                <td style="text-align:center;padding:8px;">
                                    ${item.type === "weighted" ? `${item.quantity * item.weight} كجم` : `${item.quantity} قطعة`}
                                </td>
                                <td style="text-align:left;padding:8px;font-weight:700;color:#d4af37;">
                                    ${item.total.toFixed(2)} ج.م
                                </td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding:12px;font-weight:700;font-size:18px;text-align:left;">
                                الإجمالي الكلي:
                            </td>
                            <td style="padding:12px;font-weight:800;font-size:22px;color:#d4af37;text-align:left;">
                                ${invoice.total.toFixed(2)} ج.م
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

    modal.classList.add("show");

    // print button
    document
      .getElementById("printInvoiceBtn")
      ?.addEventListener("click", () => {
        window.print();
      });
  },

  deleteInvoice(id) {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;

    window.Storage.deleteInvoice(id);
    window.showToast("تم حذف الفاتورة", "warning");
    this.render();
    window.Dashboard?.refresh();
  },

  exportInvoices() {
    const invoices = window.Storage.loadInvoices();
    if (invoices.length === 0) {
      window.showToast("لا توجد فواتير للتصدير", "warning");
      return;
    }

    // create CSV
    let csv = "رقم الفاتورة,التاريخ,عدد المنتجات,الإجمالي\n";
    invoices.forEach((inv, index) => {
      csv += `${index + 1},${inv.date || ""},${inv.items.length},${inv.total.toFixed(2)}\n`;
    });

    // download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `الفواتير_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    window.showToast("تم تصدير الفواتير بنجاح", "success");
  },
};
