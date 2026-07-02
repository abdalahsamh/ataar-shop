// ===== products.js =====

window.Products = {
  editingId: null,

  init() {
    this.render();
    this.setupEvents();
  },

  render() {
    const products = window.Storage.loadProducts();
    const tbody = document.getElementById("productsTableBody");
    if (!tbody) return;

    if (products.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:#6b7a6f;">لا توجد منتجات</td></tr>';
      return;
    }

    tbody.innerHTML = products
      .map((p, index) => {
        const priceDisplay =
          p.type === "weighted"
            ? `${Object.values(p.prices)
                .map((v) => v.toFixed(2))
                .join(" - ")} ج.م`
            : `${p.price.toFixed(2)} ج.م`;

        const stockDisplay =
          p.type === "weighted" ? `${p.stock} كجم` : `${p.stock} قطعة`;

        const typeIcon = p.type === "weighted" ? "⚖️" : "🥫";

        return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${typeIcon} ${p.name}</td>
                    <td>${p.category}</td>
                    <td>${priceDisplay}</td>
                    <td>${stockDisplay}</td>
                    <td>
                        <button class="action-btn edit" onclick="window.Products.edit(${p.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="window.Products.deleteProduct(${p.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
      })
      .join("");
  },

  setupEvents() {
    // add product button
    document.getElementById("addProductBtn")?.addEventListener("click", () => {
      this.editingId = null;
      document.getElementById("productModalTitle").textContent =
        "إضافة منتج جديد";
      document.getElementById("productForm").reset();
      document.getElementById("editProductId").value = "";
      document.getElementById("productModal").classList.add("show");
      this.updateWeightFields(false);
    });

    // product form submit
    document.getElementById("productForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveProduct();
    });

    // search
    document.getElementById("productSearch")?.addEventListener("input", (e) => {
      this.filterProducts(e.target.value);
    });
  },

  updateWeightFields(isWeighted) {
    const container = document.getElementById("weightFields");
    if (!container) return;

    if (isWeighted) {
      container.innerHTML = `
                <div class="form-group">
                    <label>أسعار الأوزان (ج.م)</label>
                    <div class="weight-options">
                        <div class="weight-input">
                            <label>1 كجم</label>
                            <input type="number" id="price_1" placeholder="السعر" step="0.01" min="0" />
                        </div>
                        <div class="weight-input">
                            <label>½ كجم</label>
                            <input type="number" id="price_0.5" placeholder="السعر" step="0.01" min="0" />
                        </div>
                        <div class="weight-input">
                            <label>¼ كجم</label>
                            <input type="number" id="price_0.25" placeholder="السعر" step="0.01" min="0" />
                        </div>
                        <div class="weight-input">
                            <label>⅛ كجم</label>
                            <input type="number" id="price_0.125" placeholder="السعر" step="0.01" min="0" />
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>المخزون (كجم)</label>
                    <input type="number" id="productStock" required min="0" step="0.1" />
                </div>
            `;
    } else {
      container.innerHTML = `
                <div class="form-group">
                    <label>السعر (ج.م)</label>
                    <input type="number" id="productPrice" required min="0" step="0.01" />
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
    const type = document.getElementById("productType")?.value || "weighted";

    if (!name) {
      window.showToast("يرجى إدخال اسم المنتج", "error");
      return;
    }

    let productData = {
      name,
      category,
      type,
      icon: "fa-box",
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

      const stock = parseFloat(
        document.getElementById("productStock")?.value || 0,
      );
      productData.prices = prices;
      productData.stock = stock;
      productData.unit = "kg";
    } else {
      const price = parseFloat(
        document.getElementById("productPrice")?.value || 0,
      );
      const stock = parseInt(
        document.getElementById("productStock")?.value || 0,
      );

      if (!price || price <= 0) {
        window.showToast("يرجى إدخال سعر صحيح", "error");
        return;
      }

      productData.price = price;
      productData.stock = stock;
      productData.unit = "piece";
    }

    const editId = document.getElementById("editProductId").value;

    if (editId) {
      // update
      const updated = window.Storage.updateProduct(
        parseInt(editId),
        productData,
      );
      if (updated) {
        window.showToast("تم تحديث المنتج بنجاح", "success");
      }
    } else {
      // add
      window.Storage.addProduct(productData);
      window.showToast("تم إضافة المنتج بنجاح", "success");
    }

    document.getElementById("productModal").classList.remove("show");
    this.render();
  },

  edit(id) {
    const product = window.Storage.getProductById(id);
    if (!product) return;

    this.editingId = id;
    document.getElementById("productModalTitle").textContent = "تعديل المنتج";
    document.getElementById("editProductId").value = id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productType").value = product.type;

    this.updateWeightFields(product.type === "weighted");

    if (product.type === "weighted") {
      const weightKeys = ["1", "0.5", "0.25", "0.125"];
      weightKeys.forEach((key) => {
        const input = document.getElementById(`price_${key}`);
        if (input && product.prices && product.prices[key]) {
          input.value = product.prices[key];
        }
      });
      document.getElementById("productStock").value = product.stock;
    } else {
      document.getElementById("productPrice").value = product.price;
      document.getElementById("productStock").value = product.stock;
    }

    document.getElementById("productModal").classList.add("show");
  },

  deleteProduct(id) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    window.Storage.deleteProduct(id);
    window.showToast("تم حذف المنتج", "warning");
    this.render();
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

// add product type field to modal
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("productForm");
  if (form) {
    const typeGroup = document.createElement("div");
    typeGroup.className = "form-group";
    typeGroup.innerHTML = `
            <label>نوع المنتج</label>
            <select id="productType" required>
                <option value="weighted">وزني (كجم)</option>
                <option value="fixed">ثابت (قطعة)</option>
            </select>
        `;
    form.insertBefore(
      typeGroup,
      form.querySelector("#editProductId").nextSibling,
    );

    document
      .getElementById("productType")
      ?.addEventListener("change", function () {
        window.Products.updateWeightFields(this.value === "weighted");
      });
  }
});
