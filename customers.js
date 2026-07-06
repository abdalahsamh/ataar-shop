// ===== customers.js =====

window.Customers = {
  init() {
    this.render();
    this.setupEvents();
  },

  loadCustomers() {
    return window.Storage.loadCustomers();
  },

  saveCustomers(customers) {
    window.Storage.saveCustomers(customers);
  },

  render() {
    const tbody = document.getElementById("customersTableBody");
    if (!tbody) return;

    const customers = this.loadCustomers();
    if (customers.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:#6b7a6f;">لا يوجد عملاء</td></tr>';
      return;
    }

    const invoices = window.Storage.loadInvoices();

    tbody.innerHTML = customers
      .map((c, index) => {
        const customerInvoices = invoices.filter(
          (inv) => inv.customerId === c.id,
        );
        const totalSpent = customerInvoices.reduce(
          (sum, inv) => sum + inv.total,
          0,
        );
        return `
                <tr>
                    <td>${index + 1}</td>
                    <td>👤 ${c.name}</td>
                    <td>${c.phone || "-"}</td>
                    <td>${c.address || "-"}</td>
                    <td>${customerInvoices.length}</td>
                    <td><strong>${totalSpent.toFixed(2)}</strong> ج.م</td>
                    <td>
                        <button class="action-btn edit" onclick="window.Customers.edit(${c.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="window.Customers.deleteCustomer(${c.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
      })
      .join("");
  },

  setupEvents() {
    const addBtn = document.getElementById("addCustomerBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        document.getElementById("customerModalTitle").textContent =
          "إضافة عميل جديد";
        document.getElementById("customerForm").reset();
        document.getElementById("editCustomerId").value = "";
        document.getElementById("customerModal").classList.add("show");
      });
    }

    const form = document.getElementById("customerForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveCustomer();
      });
    }

    const search = document.getElementById("customerSearch");
    if (search) {
      search.addEventListener("input", (e) => {
        this.filterCustomers(e.target.value);
      });
    }

    const closeBtn = document.getElementById("customerModalClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        document.getElementById("customerModal").classList.remove("show");
      });
    }
  },

  saveCustomer() {
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const address = document.getElementById("customerAddress").value.trim();

    if (!name) {
      window.showToast("يرجى إدخال اسم العميل", "error");
      return;
    }

    const customers = this.loadCustomers();
    const editId = document.getElementById("editCustomerId").value;

    if (editId) {
      const index = customers.findIndex((c) => c.id === parseInt(editId));
      if (index !== -1) {
        customers[index] = { ...customers[index], name, phone, address };
        window.showToast("تم تحديث بيانات العميل", "success");
      }
    } else {
      customers.push({
        id: Date.now(),
        name,
        phone,
        address,
        createdAt: new Date().toLocaleString("ar-EG"),
      });
      window.showToast("تم إضافة العميل بنجاح", "success");
    }

    this.saveCustomers(customers);
    document.getElementById("customerModal").classList.remove("show");
    this.render();
    if (window.Dashboard) window.Dashboard.refresh();
  },

  edit(id) {
    const customers = this.loadCustomers();
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;

    document.getElementById("customerModalTitle").textContent =
      "تعديل بيانات العميل";
    document.getElementById("editCustomerId").value = id;
    document.getElementById("customerName").value = customer.name;
    document.getElementById("customerPhone").value = customer.phone || "";
    document.getElementById("customerAddress").value = customer.address || "";
    document.getElementById("customerModal").classList.add("show");
  },

  deleteCustomer(id) {
    if (!confirm("هل أنت متأكد من حذف هذا العميل؟")) return;
    let customers = this.loadCustomers();
    customers = customers.filter((c) => c.id !== id);
    this.saveCustomers(customers);
    window.showToast("تم حذف العميل", "warning");
    this.render();
    if (window.Dashboard) window.Dashboard.refresh();
  },

  filterCustomers(query) {
    const rows = document.querySelectorAll("#customersTableBody tr");
    if (!rows.length) return;
    const q = query.toLowerCase().trim();
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  },

  getCustomer(id) {
    return this.loadCustomers().find((c) => c.id === id);
  },
};
