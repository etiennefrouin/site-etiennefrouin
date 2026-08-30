/* Affichage des prix depuis data/prices.json — permet à Étienne de modifier les prix sans toucher au code */
document.addEventListener("DOMContentLoaded", function () {
  fetch("data/prices.json")
    .then((r) => r.json())
    .then((data) => {
      // Compatibilité : accepte soit le nouveau format {items:[{id,...}]}, soit l'ancien format {id: {...}}
      const prices = {};
      if (Array.isArray(data.items)) {
        data.items.forEach((item) => {
          prices[item.id] = item;
        });
      } else {
        Object.assign(prices, data);
      }

      document.querySelectorAll("[data-price-id]").forEach((slot) => {
        const id = slot.getAttribute("data-price-id");
        const info = prices[id];
        if (!info) return;

        // Statut fixe (Vendu / Pas à vendre) : texte simple, non cliquable
        if (info.status && info.status !== "Prix sur demande") {
          slot.innerHTML = `<p class="on-request-tag" style="pointer-events:none;">${info.status}</p>`;
          return;
        }

        if (info.onRequest || !info.price) {
          slot.innerHTML = `<a class="on-request-tag" href="mailto:contact@etiennefrouin.com?subject=Demande%20de%20prix%20-%20${encodeURIComponent(info.title)}">Prix sur demande →</a>`;
        } else {
          const formatted = Number(info.price).toLocaleString("fr-FR") + " €";
          slot.innerHTML = `
            <p class="piece-price">${formatted}</p>
            <button class="add-to-cart-btn" type="button">Ajouter au panier</button>
          `;
          const btn = slot.querySelector("button");
          btn.addEventListener("click", () => {
            if (window.E9_ADD_TO_CART) {
              window.E9_ADD_TO_CART({
                id: id,
                title: info.title,
                price: Number(info.price),
                image: slot.getAttribute("data-image") || "",
                shipping: slot.getAttribute("data-shipping") || "print",
              });
            }
          });
        }
      });
    })
    .catch(() => {
      // en cas d'échec, les prix codés en dur (si présents) restent affichés
    });
});
