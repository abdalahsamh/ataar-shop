// ===== suppliers.js =====

window.Suppliers = {
  init() {
    this.render();
    this.setupEvents();
  },

  loadSuppliers() {
    return window.Storage.loadSuppliers();
  },

  saveSuppliers(suppliers) {
    window.Storage.saveSuppliers(suppliers);
  },

  render() {
    const tbody = document.getElementById("suppliersTableBody");
    if (!tbody) return;

    const suppliers = this.loadSuppliers();
    if (suppliers.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:#6b7a6f;">لا يوجد موردين</td></tr>';
      return;
    }

    const products = window.Storage.loadProducts();

    tbody.innerHTML = suppliers
      .map((s, index) => {
        const productCount = products.filter(
          (p) => p.supplierId === s.id,
        ).length;
        return `
                <tr>
                    <td>${index + 1}</td>
                    <td>🚚 ${s.name}</td>
                    <td>${s.phone || "-"}</td>
                    <td>${s.address || "-"}</td>
                    <td>${productCount}</td>
                    <td>
                        <button class="action-btn edit" onclick="window.Suppliers.edit(${s.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="window.Suppliers.deleteSupplier(${s.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
      })
      .join("");
  },

  setupEvents() {
    const addBtn = document.getElementById("addSupplierBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        document.getElementById("supplierModalTitle").textContent =
          "إضافة مورد جديد";
        document.getElementById("supplierForm").reset();
        document.getElementById("editSupplierId").value = "";
        document.getElementById("supplierModal").classList.add("show");
      });
    }

    const form = document.getElementById("supplierForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveSupplier();
      });
    }

    const search = document.getElementById("supplierSearch");
    if (search) {
      search.addEventListener("input", (e) => {
        this.filterSuppliers(e.target.value);
      });
    }

    const closeBtn = document.getElementById("supplierModalClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        document.getElementById("supplierModal").classList.remove("show");
      });
    }
  },

  saveSupplier() {
    const name = document.getElementById("supplierName").value.trim();
    const phone = document.getElementById("supplierPhone").value.trim();
    const address = document.getElementById("supplierAddress").value.trim();

    if (!name) {
      window.showToast("يرجى إدخال اسم المورد", "error");
      return;
    }

    const suppliers = this.loadSuppliers();
    const editId = document.getElementById("editSupplierId").value;

    if (editId) {
      const index = suppliers.findIndex((s) => s.id === parseInt(editId));
      if (index !== -1) {
        suppliers[index] = { ...suppliers[index], name, phone, address };
        window.showToast("تم تحديث بيانات المورد", "success");
      }
    } else {
      suppliers.push({
        id: Date.now(),
        name,
        phone,
        address,
        createdAt: new Date().toLocaleString("ar-EG"),
      });
      window.showToast("تم إضافة المورد بنجاح", "success");
    }

    this.saveSuppliers(suppliers);
    document.getElementById("supplierModal").classList.remove("show");
    this.render();
    if (window.Dashboard) window.Dashboard.refresh();
  },

  edit(id) {
    const suppliers = this.loadSuppliers();
    const supplier = suppliers.find((s) => s.id === id);
    if (!supplier) return;

    document.getElementById("supplierModalTitle").textContent =
      "تعديل بيانات المورد";
    document.getElementById("editSupplierId").value = id;
    document.getElementById("supplierName").value = supplier.name;
    document.getElementById("supplierPhone").value = supplier.phone || "";
    document.getElementById("supplierAddress").value = supplier.address || "";
    document.getElementById("supplierModal").classList.add("show");
  },

  deleteSupplier(id) {
    if (!confirm("هل أنت متأكد من حذف هذا المورد؟")) return;
    let suppliers = this.loadSuppliers();
    suppliers = suppliers.filter((s) => s.id !== id);
    this.saveSuppliers(suppliers);
    window.showToast("تم حذف المورد", "warning");
    this.render();
    if (window.Dashboard) window.Dashboard.refresh();
  },

  filterSuppliers(query) {
    const rows = document.querySelectorAll("#suppliersTableBody tr");
    if (!rows.length) return;
    const q = query.toLowerCase().trim();
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  },

  getSupplier(id) {
    return this.loadSuppliers().find((s) => s.id === id);
  },
};
