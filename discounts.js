// ===== discounts.js =====

window.Discounts = {
  init() {
    this.render();
    this.setupEvents();
  },

  loadDiscounts() {
    return window.Storage.loadDiscounts();
  },

  saveDiscounts(discounts) {
    window.Storage.saveDiscounts(discounts);
  },

  render() {
    const tbody = document.getElementById("discountsTableBody");
    if (!tbody) return;

    const discounts = this.loadDiscounts();
    if (discounts.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:#6b7a6f;">لا توجد خصومات</td></tr>';
      return;
    }

    tbody.innerHTML = discounts
      .map((d, index) => {
        const typeLabel = d.type === "percentage" ? "نسبة مئوية" : "قيمة ثابتة";
        const valueDisplay =
          d.type === "percentage" ? `${d.value}%` : `${d.value} ج.م`;
        const statusLabel = d.active ? "🟢 نشط" : "🔴 غير نشط";

        return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${d.name}</td>
                    <td>${typeLabel}</td>
                    <td><strong>${valueDisplay}</strong></td>
                    <td>${d.minPurchase ? `${d.minPurchase} ج.م` : "-"}</td>
                    <td>${statusLabel}</td>
                    <td>
                        <button class="action-btn edit" onclick="window.Discounts.edit(${d.id})"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" onclick="window.Discounts.deleteDiscount(${d.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
      })
      .join("");
  },

  setupEvents() {
    const addBtn = document.getElementById("addDiscountBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        document.getElementById("discountModalTitle").textContent =
          "إضافة خصم جديد";
        document.getElementById("discountForm").reset();
        document.getElementById("editDiscountId").value = "";
        document.getElementById("discountModal").classList.add("show");
        this.toggleDiscountType("percentage");
      });
    }

    const form = document.getElementById("discountForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveDiscount();
      });
    }

    const typeSelect = document.getElementById("discountType");
    if (typeSelect) {
      typeSelect.addEventListener("change", function () {
        window.Discounts.toggleDiscountType(this.value);
      });
    }

    const closeBtn = document.getElementById("discountModalClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        document.getElementById("discountModal").classList.remove("show");
      });
    }
  },

  toggleDiscountType(type) {
    const label = document.getElementById("discountValueLabel");
    const input = document.getElementById("discountValue");
    if (!label || !input) return;

    if (type === "percentage") {
      label.textContent = "نسبة الخصم (%)";
      input.placeholder = "مثال: 10";
      input.max = 100;
    } else {
      label.textContent = "قيمة الخصم (ج.م)";
      input.placeholder = "مثال: 20";
      input.max = Infinity;
    }
  },

  saveDiscount() {
    const name = document.getElementById("discountName").value.trim();
    const type = document.getElementById("discountType").value;
    const value = parseFloat(document.getElementById("discountValue").value);
    const minPurchase =
      parseFloat(document.getElementById("discountMinPurchase").value) || 0;
    const active = document.getElementById("discountActive").checked;

    if (!name) {
      window.showToast("يرجى إدخال اسم الخصم", "error");
      return;
    }
    if (!value || value <= 0) {
      window.showToast("يرجى إدخال قيمة صحيحة للخصم", "error");
      return;
    }
    if (type === "percentage" && value > 100) {
      window.showToast("نسبة الخصم لا تتجاوز 100%", "error");
      return;
    }

    const discounts = this.loadDiscounts();
    const editId = document.getElementById("editDiscountId").value;

    if (editId) {
      const index = discounts.findIndex((d) => d.id === parseInt(editId));
      if (index !== -1) {
        discounts[index] = {
          ...discounts[index],
          name,
          type,
          value,
          minPurchase,
          active,
        };
        window.showToast("تم تحديث الخصم", "success");
      }
    } else {
      discounts.push({
        id: Date.now(),
        name,
        type,
        value,
        minPurchase,
        active,
        createdAt: new Date().toLocaleString("ar-EG"),
      });
      window.showToast("تم إضافة الخصم بنجاح", "success");
    }

    this.saveDiscounts(discounts);
    document.getElementById("discountModal").classList.remove("show");
    this.render();
    if (window.Dashboard) window.Dashboard.refresh();
  },

  edit(id) {
    const discounts = this.loadDiscounts();
    const discount = discounts.find((d) => d.id === id);
    if (!discount) return;

    document.getElementById("discountModalTitle").textContent = "تعديل الخصم";
    document.getElementById("editDiscountId").value = id;
    document.getElementById("discountName").value = discount.name;
    document.getElementById("discountType").value = discount.type;
    document.getElementById("discountValue").value = discount.value;
    document.getElementById("discountMinPurchase").value =
      discount.minPurchase || "";
    document.getElementById("discountActive").checked = discount.active;
    this.toggleDiscountType(discount.type);
    document.getElementById("discountModal").classList.add("show");
  },

  deleteDiscount(id) {
    if (!confirm("هل أنت متأكد من حذف هذا الخصم؟")) return;
    let discounts = this.loadDiscounts();
    discounts = discounts.filter((d) => d.id !== id);
    this.saveDiscounts(discounts);
    window.showToast("تم حذف الخصم", "warning");
    this.render();
    if (window.Dashboard) window.Dashboard.refresh();
  },

  calculateDiscount(total) {
    const discounts = this.loadDiscounts();
    let bestDiscount = null;
    let bestValue = 0;

    const activeDiscounts = discounts.filter((d) => d.active);

    for (const discount of activeDiscounts) {
      if (discount.minPurchase && total < discount.minPurchase) continue;

      let discountAmount = 0;
      if (discount.type === "percentage") {
        discountAmount = (total * discount.value) / 100;
      } else {
        discountAmount = discount.value;
      }

      if (discountAmount > bestValue) {
        bestValue = discountAmount;
        bestDiscount = discount;
      }
    }

    if (bestDiscount) {
      return {
        discount: bestDiscount,
        amount: bestValue,
        finalTotal: Math.max(0, total - bestValue),
      };
    }
    return null;
  },
};
