(function () {
  const SHIPPING_GOAL = 100;
  const STORAGE_KEY = "clubhausCart";
  const DEFAULT_PRICE = 75;
  let openCartDrawer = null;

  function dollars(value) {
    return `$${value.toFixed(2)}`;
  }

  function getCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function setCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function totalQty(items) {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }

  function totalPrice(items) {
    return items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function normalizeCartPrices() {
    const cart = getCart();
    const normalized = cart.map((item) => ({
      ...item,
      price: typeof item.price === "number" && item.price > 12 ? item.price : DEFAULT_PRICE
    }));
    setCart(normalized);
  }

  function addPaymentMethods() {
    const footer = document.querySelector(".site-footer");
    const footerBottom = document.querySelector(".site-footer .footer-bottom");
    if (!footer || !footerBottom) return;

    let wrap = document.querySelector(".payment-methods");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "payment-methods";
      wrap.innerHTML = [
        "<img src='film%20images/Klarna.svg' alt='Klarna'>",
        "<img src='film%20images/ApplePay.svg' alt='Apple Pay'>",
        "<img src='film%20images/AmazonPay.svg' alt='Amazon Pay'>",
        "<img src='film%20images/Amex.svg' alt='American Express'>",
        "<img src='film%20images/Interac.svg' alt='Interac'>",
        "<img src='film%20images/Visa%20Icon.svg' alt='Visa'>",
        "<img src='film%20images/PayPal.svg' alt='PayPal'>"
      ].join("");
    }

    footer.insertBefore(wrap, footerBottom);
  }

  function addSearchDropdown() {
    const header = document.querySelector(".site-header");
    const searchBtn = document.querySelector('.nav-icon-button[aria-label="Search"]');
    if (!header || !searchBtn || document.querySelector(".search-dropdown")) return;

    const search = document.createElement("div");
    search.className = "search-dropdown";
    search.innerHTML = `
      <div class="search-dropdown-inner">
        <div class="search-field-wrap">
          <input type="text" placeholder="Search" aria-label="Search input" />
          <img src="film%20images/Magnifiying%20Glass%20icon.svg" alt="Search" />
        </div>
        <button class="search-close" type="button" aria-label="Close search">&times;</button>
      </div>
    `;
    header.appendChild(search);

    const input = search.querySelector("input");
    const close = search.querySelector(".search-close");

    function openSearch() {
      search.classList.add("is-open");
      if (input) input.focus();
    }

    function closeSearch() {
      search.classList.remove("is-open");
    }

    searchBtn.addEventListener("click", (event) => {
      event.preventDefault();
      search.classList.contains("is-open") ? closeSearch() : openSearch();
    });

    close.addEventListener("click", closeSearch);

    document.addEventListener("click", (event) => {
      if (!search.classList.contains("is-open")) return;
      if (!search.contains(event.target) && !searchBtn.contains(event.target)) {
        closeSearch();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSearch();
      }
    });
  }

  function createCartDrawer() {
    if (document.querySelector(".cart-drawer")) return;

    const overlay = document.createElement("div");
    overlay.className = "cart-overlay";

    const drawer = document.createElement("aside");
    drawer.className = "cart-drawer";
    drawer.innerHTML = `
      <div class="cart-head">
        <div class="cart-head-top">
          <h2 id="bag-title">Your bag (0)</h2>
          <button type="button" class="cart-close" aria-label="Close bag">&times;</button>
        </div>
        <p class="shipping-note">Spend $100.00 more to unlock free shipping</p>
        <div class="shipping-track"><div class="shipping-fill"></div></div>
        <div class="shipping-labels"><span>$0.00</span><span>$100.00</span></div>
      </div>
      <div class="cart-body" id="cart-items"></div>
      <div class="cart-foot">
        <div class="cart-total"><span>Total</span><span id="cart-total-value">$0.00</span></div>
        <button type="button" class="checkout-btn">Checkout</button>
        <button type="button" class="continue-shopping">Continue shopping</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    const cartBtn = document.querySelector('.nav-icon-button[aria-label="Cart"]');
    const closeBtn = drawer.querySelector(".cart-close");
    const continueBtn = drawer.querySelector(".continue-shopping");

    function open() {
      drawer.classList.add("is-open");
      overlay.classList.add("is-open");
      renderCart();
      document.body.style.overflow = "hidden";
    }

    function close() {
      drawer.classList.remove("is-open");
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    if (cartBtn) {
      cartBtn.addEventListener("click", (event) => {
        event.preventDefault();
        open();
      });
    }

    openCartDrawer = open;

    closeBtn.addEventListener("click", close);
    continueBtn.addEventListener("click", close);
    overlay.addEventListener("click", close);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function renderCart() {
    const cart = getCart();
    const title = document.getElementById("bag-title");
    const note = document.querySelector(".shipping-note");
    const fill = document.querySelector(".shipping-fill");
    const itemsWrap = document.getElementById("cart-items");
    const totalNode = document.getElementById("cart-total-value");

    if (!title || !note || !fill || !itemsWrap || !totalNode) return;

    const qty = totalQty(cart);
    const total = totalPrice(cart);
    const remaining = Math.max(0, SHIPPING_GOAL - total);
    const percentage = Math.min(100, (total / SHIPPING_GOAL) * 100);

    title.textContent = `Your bag (${qty})`;
    note.textContent = remaining > 0
      ? `Spend ${dollars(remaining)} more to unlock free shipping`
      : "Free shipping unlocked!";
    fill.style.width = `${percentage}%`;
    totalNode.textContent = dollars(total);

    if (!cart.length) {
      itemsWrap.innerHTML = "<p class='empty-cart'>There are no items in your cart.</p>";
      return;
    }

    itemsWrap.innerHTML = cart.map((item) => `
      <article class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <p class="cart-item-name">${item.name}</p>
          <div class="qty-controls">
            <button type="button" data-action="decrease">-</button>
            <span>${item.qty}</span>
            <button type="button" data-action="increase">+</button>
          </div>
        </div>
        <div>
          <p class="cart-item-price">${dollars(item.price * item.qty)}</p>
          <button class="cart-item-remove" type="button" data-action="remove" aria-label="Remove item">x</button>
        </div>
      </article>
    `).join("");
  }

  function attachCartInteractions() {
    document.body.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const itemNode = button.closest(".cart-item");
      if (!itemNode) return;

      const id = itemNode.getAttribute("data-id");
      const action = button.getAttribute("data-action");
      const cart = getCart();
      const item = cart.find((entry) => entry.id === id);
      if (!item) return;

      if (action === "increase") item.qty += 1;
      if (action === "decrease") item.qty -= 1;
      if (action === "remove") item.qty = 0;

      const filtered = cart.filter((entry) => entry.qty > 0);
      setCart(filtered);
      renderCart();
    });
  }

  function addShopQuickButtons() {
    const galleryItems = document.querySelectorAll(".gallery-section .gallery-item, .shop-section .gallery-item");
    if (!galleryItems.length) return;

    galleryItems.forEach((item, index) => {
      if (item.querySelector(".quick-add-btn")) return;

      const image = item.querySelector("img");
      if (!image) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-add-btn";
      button.textContent = "Add to cart";

      const productId = image.getAttribute("src") || `product-${index}`;
      const productName = (image.getAttribute("alt") || "Film print").trim();
      const productImage = image.getAttribute("src") || "";

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const cart = getCart();
        const existing = cart.find((entry) => entry.id === productId);

        if (existing) {
          existing.price = DEFAULT_PRICE;
          existing.qty += 1;
        } else {
          cart.push({
            id: productId,
            name: productName,
            price: DEFAULT_PRICE,
            qty: 1,
            image: productImage
          });
        }

        setCart(cart);
        renderCart();
        if (typeof openCartDrawer === "function") {
          openCartDrawer();
        }
      });

      item.appendChild(button);
    });
  }

  function addProductRedirects() {
    const galleryItems = document.querySelectorAll(".gallery-section .gallery-item, .shop-section .gallery-item");
    if (!galleryItems.length) return;

    galleryItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        if (event.target.closest(".quick-add-btn")) return;

        const image = item.querySelector("img");
        if (!image) return;

        const productImage = image.getAttribute("src") || "";
        if (!productImage) return;

        const productName = (image.getAttribute("alt") || "Film print").trim();
        const detailUrl = `product.html?image=${encodeURIComponent(productImage)}&name=${encodeURIComponent(productName)}`;

        event.preventDefault();
        window.location.href = detailUrl;
      });
    });
  }

  function syncHeaderFooterContrast() {
    const header = document.querySelector(".site-header");
    const footer = document.querySelector(".site-footer");
    if (!header || !footer) return;

    function updateHeaderContrast() {
      const footerTop = footer.getBoundingClientRect().top;
      const threshold = header.offsetHeight + 12;
      const nearFooter = footerTop <= threshold;
      header.classList.toggle("footer-contrast", nearFooter);
    }

    window.addEventListener("scroll", updateHeaderContrast, { passive: true });
    window.addEventListener("resize", updateHeaderContrast);
    updateHeaderContrast();
  }

  function initMobileNavigation() {
    const header = document.querySelector(".site-header");
    const nav = document.querySelector(".primary-navigation");
    const navList = nav ? nav.querySelector("ul") : null;
    if (!header || !nav || !navList) return;

    Array.from(navList.children).forEach((item) => {
      if (!(item instanceof HTMLElement)) return;
      if (item.querySelector(".nav-icon-button")) {
        item.classList.add("nav-icon-item");
      } else {
        item.classList.add("nav-menu-item");
      }
    });

    let toggle = header.querySelector(".nav-toggle-button");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "nav-toggle-button";
      toggle.setAttribute("aria-label", "Toggle navigation menu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = [
        '<span class="nav-toggle-line"></span>',
        '<span class="nav-toggle-line"></span>',
        '<span class="nav-toggle-line"></span>'
      ].join("");
      header.insertBefore(toggle, nav);
    }

    let mobileMenu = header.querySelector(".mobile-nav-menu");
    if (!mobileMenu) {
      mobileMenu = document.createElement("ul");
      mobileMenu.className = "mobile-nav-menu";
      mobileMenu.innerHTML = Array.from(navList.children)
        .filter((item) => item instanceof HTMLElement && item.classList.contains("nav-menu-item"))
        .map((item) => item.outerHTML)
        .join("");
      header.appendChild(mobileMenu);
    }

    function closeMenu() {
      header.classList.remove("mobile-menu-open");
      toggle.setAttribute("aria-expanded", "false");
      mobileMenu.querySelectorAll("li.mobile-dropdown-open").forEach((item) => {
        item.classList.remove("mobile-dropdown-open");
      });
      mobileMenu.querySelectorAll("li.dropdown > a").forEach((link) => {
        link.setAttribute("aria-expanded", "false");
      });
    }

    function syncVisibility() {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      toggle.style.display = isMobile ? "inline-flex" : "none";
      if (!isMobile) {
        closeMenu();
      }
    }

    toggle.addEventListener("click", () => {
      header.classList.toggle("mobile-menu-open");
      const expanded = header.classList.contains("mobile-menu-open");
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      if (!expanded) {
        closeMenu();
      }
    });

    mobileMenu.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const dropdownTrigger = target.closest("li.dropdown > a");
      if (dropdownTrigger && mobileMenu.contains(dropdownTrigger)) {
        event.preventDefault();
        const parentItem = dropdownTrigger.closest("li.dropdown");
        if (!(parentItem instanceof HTMLElement)) return;

        const shouldOpen = !parentItem.classList.contains("mobile-dropdown-open");
        parentItem.classList.toggle("mobile-dropdown-open", shouldOpen);
        dropdownTrigger.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
        return;
      }

      if (target.closest("a")) {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (!window.matchMedia("(max-width: 768px)").matches) return;
      if (!header.classList.contains("mobile-menu-open")) return;
      if (!header.contains(event.target)) {
        closeMenu();
      }
    });

    window.addEventListener("resize", syncVisibility);
    syncVisibility();
  }

  function init() {
    normalizeCartPrices();
    initMobileNavigation();
    syncHeaderFooterContrast();
    addPaymentMethods();
    addSearchDropdown();
    createCartDrawer();
    attachCartInteractions();
    addShopQuickButtons();
    addProductRedirects();
    renderCart();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
