// ===== app.js =====
// هذا الملف يعمل مع بنية المجلد المسطح (جميع الملفات في مجلد واحد)

document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ تم تحميل الصفحة بالكامل");

  // ===== 1. التحقق من التخزين =====
  if (typeof window.Storage === "undefined") {
    console.error("❌ ملف storage.js لم يتم تحميله");
    return;
  }

  // ===== 2. تعريف الوحدات =====
  const modules = {
    dashboard: window.Dashboard,
    pos: window.POS,
    products: window.Products,
    customers: window.Customers,
    suppliers: window.Suppliers,
    inventory: window.InventoryReports,
    discounts: window.Discounts,
    invoices: window.Invoices,
  };

  // ===== 3. تهيئة كل وحدة =====
  Object.keys(modules).forEach((key) => {
    if (modules[key] && typeof modules[key].init === "function") {
      try {
        modules[key].init();
        console.log(`✅ تم تهيئة ${key}`);
      } catch (e) {
        console.error(`❌ خطأ في تهيئة ${key}:`, e);
      }
    } else {
      console.warn(`⚠️ الوحدة ${key} غير موجودة أو ليس لها دالة init`);
    }
  });

  // ===== 4. ربط أزرار التنقل =====
  const navBtns = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");
  const pageTitle = document.getElementById("pageTitle");

  if (navBtns.length === 0) {
    console.error("❌ أزرار التنقل غير موجودة في الصفحة");
  } else {
    navBtns.forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const sectionId = this.dataset.section;
        console.log(`🔄 تم الضغط على: ${sectionId}`);

        navBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");

        sections.forEach((s) => s.classList.remove("active"));
        const target = document.getElementById(`section-${sectionId}`);
        if (target) target.classList.add("active");

        const titles = {
          dashboard: "الرئيسية",
          pos: "البيع",
          products: "المخزون",
          customers: "العملاء",
          suppliers: "الموردين",
          inventory: "الجرد",
          discounts: "الخصومات",
          invoices: "الفواتير",
        };
        if (pageTitle) pageTitle.textContent = titles[sectionId] || sectionId;

        if (sectionId === "dashboard" && window.Dashboard?.refresh)
          window.Dashboard.refresh();
        if (sectionId === "pos" && window.POS?.render) window.POS.render();
        if (sectionId === "products" && window.Products?.render)
          window.Products.render();
        if (sectionId === "customers" && window.Customers?.render)
          window.Customers.render();
        if (sectionId === "suppliers" && window.Suppliers?.render)
          window.Suppliers.render();
        if (sectionId === "inventory" && window.InventoryReports?.renderReport)
          window.InventoryReports.renderReport("all");
        if (sectionId === "discounts" && window.Discounts?.render)
          window.Discounts.render();
        if (sectionId === "invoices" && window.Invoices?.render)
          window.Invoices.render();
      });
    });
    console.log("✅ تم ربط أزرار التنقل");
  }

  // ===== 5. الوضع الليلي =====
  const darkToggle = document.getElementById("darkModeToggle");
  if (darkToggle) {
    darkToggle.addEventListener("click", function () {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      this.innerHTML = isDark
        ? '<i class="fas fa-sun"></i><span>الوضع النهاري</span>'
        : '<i class="fas fa-moon"></i><span>الوضع الليلي</span>';
      const settings = window.Storage.loadSettings();
      settings.darkMode = isDark;
      window.Storage.saveSettings(settings);
    });
    console.log("✅ تم ربط زر الوضع الليلي");
  }

  // ===== 6. الساعة =====
  function updateClock() {
    const clock = document.getElementById("clock");
    const dateEl = document.getElementById("date");
    if (clock && dateEl) {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      dateEl.textContent = now.toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ===== 7. نظام الإشعارات =====
  window.showToast = function (message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icons = {
      success: "fa-check-circle",
      error: "fa-times-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(60px)";
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  };

  // ===== 8. إغلاق المودالات =====
  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) this.classList.remove("show");
    });
  });

  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.closest(".modal-overlay")?.classList.remove("show");
    });
  });

  // ===== 9. شاشة الترحيب =====
  const splash = document.getElementById("splashScreen");
  const app = document.getElementById("appContainer");
  if (splash && app) {
    setTimeout(() => {
      splash.style.display = "none";
      app.style.display = "flex";
    }, 2500);
  }

  console.log("🚀 النظام جاهز للعمل");
});
