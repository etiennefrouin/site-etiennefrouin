/* Panier E9 INERTION — partagé par toutes les pages du site */
(function () {
  const STORAGE_KEY = "e9-cart";
  const CONTACT_EMAIL = "contact@etiennefrouin.com";
  const PAYPAL_ME = "etiennefrouin";

  const SHIPPING_RATES = {
    print:     { fr: 0, eu: 0,  intl: 0 },
    sculpture: { fr: 45, eu: 90,  intl: 150 },
    large:     { fr: null, eu: null, intl: null } // sur devis
  };
  const DEST_KEY = "e9-cart-dest";

  function getDestination() {
    return localStorage.getItem(DEST_KEY) || "fr";
  }
  function setDestination(dest) {
    localStorage.setItem(DEST_KEY, dest);
    renderCart();
  }

  function getCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    renderCart();
  }

  function addToCart(item) {
    const cart = getCart();
    if (cart.find((i) => i.id === item.id)) {
      openCart();
      renderCart();
      return;
    }
    cart.push(item);
    saveCart(cart);
    openCart();
  }

  function removeFromCart(id) {
    const cart = getCart().filter((i) => i.id !== id);
    saveCart(cart);
  }

  function formatPrice(n) {
    return n.toLocaleString("fr-FR") + " €";
  }

  function cartTotal(cart) {
    return cart.reduce((sum, i) => sum + i.price, 0);
  }

  function shippingInfo(cart) {
    const dest = getDestination();
    let total = 0;
    let hasQuote = false;
    cart.forEach((item) => {
      const cat = item.shipping || "print";
      const rate = SHIPPING_RATES[cat] ? SHIPPING_RATES[cat][dest] : SHIPPING_RATES.print[dest];
      if (rate === null || rate === undefined) {
        hasQuote = true;
      } else {
        total += rate;
      }
    });
    return { total, hasQuote };
  }

  function renderCart() {
    const cart = getCart();
    const countEls = document.querySelectorAll("[data-cart-count]");
    countEls.forEach((el) => {
      el.textContent = cart.length;
      el.style.display = cart.length > 0 ? "inline-flex" : "none";
    });

    const listEl = document.querySelector("[data-cart-list]");
    const totalEl = document.querySelector("[data-cart-total]");
    const emptyEl = document.querySelector("[data-cart-empty]");
    const checkoutBtn = document.querySelector("[data-cart-checkout]");
    const paypalBtn = document.querySelector("[data-cart-paypal]");
    if (!listEl) return;

    listEl.innerHTML = "";
    if (cart.length === 0) {
      if (emptyEl) emptyEl.style.display = "block";
      if (checkoutBtn) checkoutBtn.setAttribute("disabled", "disabled");
      if (paypalBtn) paypalBtn.setAttribute("disabled", "disabled");
    } else {
      if (emptyEl) emptyEl.style.display = "none";
      if (checkoutBtn) checkoutBtn.removeAttribute("disabled");
      if (paypalBtn) paypalBtn.removeAttribute("disabled");
      cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "cart-row";
        row.innerHTML = `
          <img src="${item.image}" alt="${item.title}">
          <div class="cart-row-info">
            <p class="cart-row-title">${item.title}</p>
            <p class="cart-row-price">${formatPrice(item.price)}</p>
          </div>
          <button class="cart-row-remove" data-remove="${item.id}" aria-label="Retirer">✕</button>
        `;
        listEl.appendChild(row);
      });
    }
    if (totalEl) {
      const ship = shippingInfo(cart);
      const subtotal = cartTotal(cart);
      const subtotalEl = document.querySelector("[data-cart-subtotal]");
      const shippingEl = document.querySelector("[data-cart-shipping]");
      if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
      if (shippingEl) shippingEl.textContent = ship.hasQuote
        ? (ship.total > 0 ? `${formatPrice(ship.total)} + sur devis` : "Sur devis")
        : formatPrice(ship.total);
      totalEl.textContent = ship.hasQuote
        ? `${formatPrice(subtotal + ship.total)} + frais sur devis`
        : formatPrice(subtotal + ship.total);
    }

    const destSelect = document.querySelector("[data-cart-dest]");
    if (destSelect) destSelect.value = getDestination();

    listEl.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => removeFromCart(btn.getAttribute("data-remove")));
    });
  }

  function openCart() {
    const panel = document.querySelector("[data-cart-panel]");
    const overlay = document.querySelector("[data-cart-overlay]");
    if (panel) panel.classList.add("cart-open");
    if (overlay) overlay.classList.add("cart-open");
  }

  function closeCart() {
    const panel = document.querySelector("[data-cart-panel]");
    const overlay = document.querySelector("[data-cart-overlay]");
    if (panel) panel.classList.remove("cart-open");
    if (overlay) overlay.classList.remove("cart-open");
  }

  function checkout() {
    const cart = getCart();
    if (cart.length === 0) return;
    const ship = shippingInfo(cart);
    const destLabels = { fr: "France", eu: "Europe", intl: "International" };
    const lines = cart.map((i) => `- ${i.title} — ${formatPrice(i.price)}`).join("%0D%0A");
    const subtotal = formatPrice(cartTotal(cart));
    const shippingLine = ship.hasQuote
      ? (ship.total > 0 ? `${formatPrice(ship.total)} + une ou plusieurs pièces sur devis` : "sur devis (grande pièce)")
      : formatPrice(ship.total);
    const subject = encodeURIComponent("Demande de réservation — E9 Inertion");
    const body =
      `Bonjour Étienne,%0D%0A%0D%0AJe souhaite réserver les œuvres suivantes :%0D%0A%0D%0A${lines}%0D%0A%0D%0ASous-total : ${subtotal}%0D%0ALivraison (${destLabels[getDestination()]}) : ${shippingLine}%0D%0A%0D%0AMerci de me recontacter pour finaliser le paiement et confirmer les frais de port.`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  function payWithPaypal() {
    const cart = getCart();
    if (cart.length === 0) return;
    const ship = shippingInfo(cart);
    const total = Math.round(cartTotal(cart) + ship.total);
    window.open(`https://paypal.me/${PAYPAL_ME}/${total}EUR`, "_blank", "noopener");
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.E9_CART_RENDER = renderCart;
    window.E9_ADD_TO_CART = addToCart;
    renderCart();

    document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
      btn.addEventListener("click", () => {
        addToCart({
          id: btn.getAttribute("data-id"),
          title: btn.getAttribute("data-title"),
          price: parseFloat(btn.getAttribute("data-price")),
          image: btn.getAttribute("data-image"),
          shipping: btn.getAttribute("data-shipping") || "print",
        });
      });
    });

    const openBtn = document.querySelector("[data-cart-open]");
    const closeBtn = document.querySelector("[data-cart-close]");
    const overlay = document.querySelector("[data-cart-overlay]");
    const checkoutBtn = document.querySelector("[data-cart-checkout]");
    const paypalBtn = document.querySelector("[data-cart-paypal]");
    const destSelect = document.querySelector("[data-cart-dest]");

    if (openBtn) openBtn.addEventListener("click", openCart);
    if (closeBtn) closeBtn.addEventListener("click", closeCart);
    if (overlay) overlay.addEventListener("click", closeCart);
    if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);
    if (paypalBtn) paypalBtn.addEventListener("click", payWithPaypal);
    if (destSelect) destSelect.addEventListener("change", (e) => setDestination(e.target.value));
  });
})();
