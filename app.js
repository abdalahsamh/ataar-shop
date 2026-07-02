// ===== app.js =====

document.addEventListener("DOMContentLoaded", function () {
  // ===== DOM elements =====
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const navBtns = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");
  const pageTitle = document.getElementById("pageTitle");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const clock = document.getElementById("clock");
  const dateElement = document.getElementById("date");

  // ===== sidebar toggle (mobile) =====
  sidebarToggle.addEventListener("click", function () {
    sidebar.classList.toggle("collapsed");
  });

  // ===== navigation =====
  navBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const sectionId = this.dataset.section;

      // update active button
      navBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      // show section
      sections.forEach((s) => s.classList.remove("active"));
      const targetSection = document.getElementById(`section-${sectionId}`);
      if (targetSection) {
        targetSection.classList.add("active");
      }

      // update title
      const titleMap = {
        dashboard: "الرئيسية",
        pos: "البيع",
        products: "المخزون",
        invoices: "الفواتير",
      };
      pageTitle.textContent = titleMap[sectionId] || sectionId;

      // close sidebar on mobile
      if (window.innerWidth <= 768) {
        sidebar.classList.add("collapsed");
      }

      // refresh dashboard if needed
      if (sectionId === "dashboard" && window.Dashboard) {
        window.Dashboard.refresh();
      }
      if (sectionId === "pos" && window.POS) {
        window.POS.render();
      }
      if (sectionId === "products" && window.Products) {
        window.Products.render();
      }
      if (sectionId === "invoices" && window.Invoices) {
        window.Invoices.render();
      }
    });
  });

  // ===== dark mode =====
  let settings = window.Storage.loadSettings();

  function applyDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add("dark-mode");
      darkModeToggle.innerHTML =
        '<i class="fas fa-sun"></i><span>الوضع النهاري</span>';
    } else {
      document.body.classList.remove("dark-mode");
      darkModeToggle.innerHTML =
        '<i class="fas fa-moon"></i><span>الوضع الليلي</span>';
    }
    settings.darkMode = enabled;
    window.Storage.saveSettings(settings);
  }

  applyDarkMode(settings.darkMode);

  darkModeToggle.addEventListener("click", function () {
    applyDarkMode(!document.body.classList.contains("dark-mode"));
  });

  // ===== clock =====
  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    dateElement.textContent = now.toLocaleDateString("ar-EG", options);
  }

  updateClock();
  setInterval(updateClock, 1000);

  // ===== toast system =====
  window.showToast = function (message, type = "info") {
    const container = document.getElementById("toastContainer");
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

  // ===== close modals on backdrop click =====
  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.remove("show");
      }
    });
  });

  // ===== close modals with X button =====
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.closest(".modal-overlay").classList.remove("show");
    });
  });

  // ===== load initial dashboard =====
  if (window.Dashboard) {
    window.Dashboard.init();
  }
  if (window.POS) {
    window.POS.init();
  }
  if (window.Products) {
    window.Products.init();
  }
  if (window.Invoices) {
    window.Invoices.init();
  }

  console.log(" نظام البيع المتكامل جاهز!");
});
