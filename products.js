// ===== products.js =====

window.Products = {
  editingId: null,

  init() {
    this.render();
    this.setupEvents();
  },

  render() {
    const tbody = document.getElementById("productsTableBody");
    if (!tbody) return;

    const products = window.Storage.loadProducts();
    if (products.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align:center;color:#6b7a6f;">لا توجد منتجات</td></tr>';
      return;
    }

    const suppliers = window.Storage.loadSuppliers();

    tbody.innerHTML = products
      .map((p, index) => {
        const sellPrice =
          p.type === "weighted"
            ? `${Object.values(p.prices)[0]?.toFixed(2) || 0} ج.م`
            : `${p.price?.toFixed(2) || 0} ج.م`;
        const buyPrice = `${(p.purchasePrice || 0).toFixed(2)} ج.م`;
        const stockDisplay =
          p.type === "weighted" ? `${p.stock} كجم` : `${p.stock} قطعة`;
        const supplier = suppliers.find((s) => s.id === p.supplierId);
        const supplierName = supplier ? supplier.name : "-";

        return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${p.type === "weighted" ? "⚖️" : "🥫"} ${p.name}</td>
                    <td>${p.category}</td>
                    <td>${buyPrice}</td>
                    <td>${sellPrice}</td>
                    <td>${stockDisplay}</td>
                    <td>${supplierName}</td>
                    <td>
                        <button class="action-btn edit" onclick="window.Products.edit(${p.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="window.Products.deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
      })
      .join("");
  },

  setupEvents() {
    const addBtn = document.getElementById("addProductBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        this.editingId = null;
        document.getElementById("productModalTitle").textContent =
          "إضافة منتج جديد";
        document.getElementById("productForm").reset();
        document.getElementById("editProductId").value = "";
        document.getElementById("productModal").classList.add("show");
        this.updateWeightFields(
          document.getElementById("productType").value === "weighted",
        );
      });
    }

    const form = document.getElementById("productForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveProduct();
      });
    }

    const search = document.getElementById("productSearch");
    if (search) {
      search.addEventListener("input", (e) => {
        this.filterProducts(e.target.value);
      });
    }

    const typeSelect = document.getElementById("productType");
    if (typeSelect) {
      typeSelect.addEventListener("change", function () {
        window.Products.updateWeightFields(this.value === "weighted");
      });
    }

    const closeBtn = document.getElementById("productModalClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        document.getElementById("productModal").classList.remove("show");
      });
    }
  },

  updateWeightFields(isWeighted) {
    const container = document.getElementById("weightFields");
    if (!container) return;

    const suppliers = window.Storage.loadSuppliers();
    const supplierOptions = suppliers
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join("");

    if (isWeighted) {
      container.innerHTML = `
                <div class="form-group">
                    <label>أسعار البيع للأوزان (ج.م)</label>
                    <div class="weight-options">
                        <div><label>1 كجم</label><input type="number" id="price_1" placeholder="سعر البيع" step="0.01" min="0" style="width:100%;padding:8px;margin-top:4px;border:2px solid #e8e0d0;border-radius:8px;" /></div>
                        <div><label>½ كجم</label><input type="number" id="price_0.5" placeholder="سعر البيع" step="0.01" min="0" style="width:100%;padding:8px;margin-top:4px;border:2px solid #e8e0d0;border-radius:8px;" /></div>
                        <div><label>¼ كجم</label><input type="number" id="price_0.25" placeholder="سعر البيع" step="0.01" min="0" style="width:100%;padding:8px;margin-top:4px;border:2px solid #e8e0d0;border-radius:8px;" /></div>
                        <div><label>⅛ كجم</label><input type="number" id="price_0.125" placeholder="سعر البيع" step="0.01" min="0" style="width:100%;padding:8px;margin-top:4px;border:2px solid #e8e0d0;border-radius:8px;" /></div>
                    </div>
                </div>
                <div class="form-group">
                    <label>سعر الشراء (جملة) - ج.م</label>
                    <input type="number" id="purchasePrice" placeholder="سعر الشراء من المورد" step="0.01" min="0" />
                </div>
                <div class="form-group">
                    <label>المورد</label>
                    <select id="supplierId">
                        <option value="">بدون مورد</option>
                        ${supplierOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>المخزون (كجم)</label>
                    <input type="number" id="productStock" required min="0" step="0.1" />
                </div>
            `;
    } else {
      container.innerHTML = `
                <div class="form-group">
                    <label>سعر البيع (ج.م)</label>
                    <input type="number" id="productPrice" required min="0" step="0.01" />
                </div>
                <div class="form-group">
                    <label>سعر الشراء (جملة) - ج.م</label>
                    <input type="number" id="purchasePrice" placeholder="سعر الشراء من المورد" step="0.01" min="0" />
                </div>
                <div class="form-group">
                    <label>المورد</label>
                    <select id="supplierId">
                        <option value="">بدون مورد</option>
                        ${supplierOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>المخزون (قطعة)</label>
                    <input type="number" id="productStock" required min="0" />
                </div>
            `;
    }
  },

  saveProduct() {
    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value;
    const type = document.getElementById("productType").value;

    if (!name) {
      window.showToast("يرجى إدخال اسم المنتج", "error");
      return;
    }

    const productData = {
      name,
      category,
      type,
      icon: "fa-box",
      purchasePrice: parseFloat(
        document.getElementById("purchasePrice")?.value || 0,
      ),
      supplierId: document.getElementById("supplierId")?.value || null,
    };

    if (type === "weighted") {
      const prices = {};
      const weightKeys = ["1", "0.5", "0.25", "0.125"];
      let hasPrice = false;

      weightKeys.forEach((key) => {
        const input = document.getElementById(`price_${key}`);
        if (input && input.value) {
          prices[key] = parseFloat(input.value);
          hasPrice = true;
        }
      });

      if (!hasPrice) {
        window.showToast("يرجى إدخال سعر واحد على الأقل للأوزان", "error");
        return;
      }

      productData.prices = prices;
      productData.stock = parseFloat(
        document.getElementById("productStock")?.value || 0,
      );
      productData.unit = "kg";
    } else {
      const price = parseFloat(
        document.getElementById("productPrice")?.value || 0,
      );
      if (!price || price <= 0) {
        window.showToast("يرجى إدخال سعر صحيح", "error");
        return;
      }
      productData.price = price;
      productData.stock = parseInt(
        document.getElementById("productStock")?.value || 0,
      );
      productData.unit = "piece";
    }

    const editId = document.getElementById("editProductId").value;

    if (editId) {
      window.Storage.updateProduct(parseInt(editId), productData);
      window.showToast("تم تحديث المنتج بنجاح", "success");
    } else {
      window.Storage.addProduct(productData);
      window.showToast("تم إضافة المنتج بنجاح", "success");
    }

    document.getElementById("productModal").classList.remove("show");
    this.render();
    if (window.Dashboard) window.Dashboard.refresh();
  },

  edit(id) {
    const product = window.Storage.getProductById(id);
    if (!product) return;

    document.getElementById("productModalTitle").textContent = "تعديل المنتج";
    document.getElementById("editProductId").value = id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productType").value = product.type;

    this.updateWeightFields(product.type === "weighted");

    if (product.type === "weighted") {
      ["1", "0.5", "0.25", "0.125"].forEach((key) => {
        const input = document.getElementById(`price_${key}`);
        if (input && product.prices && product.prices[key]) {
          input.value = product.prices[key];
        }
      });
    } else {
      document.getElementById("productPrice").value = product.price || "";
    }

    document.getElementById("purchasePrice").value =
      product.purchasePrice || "";
    document.getElementById("supplierId").value = product.supplierId || "";
    document.getElementById("productStock").value = product.stock || "";
    document.getElementById("productModal").classList.add("show");
  },

  deleteProduct(id) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    window.Storage.deleteProduct(id);
    window.showToast("تم حذف المنتج", "warning");
    this.render();
    if (window.Dashboard) window.Dashboard.refresh();
  },

  filterProducts(query) {
    const rows = document.querySelectorAll("#productsTableBody tr");
    if (!rows.length) return;
    const q = query.toLowerCase().trim();
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  },
};
