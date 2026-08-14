/* i18n E9 INERTION — sélection et application de la langue */
(function () {
  const LANG_KEY = "e9-lang";

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "fr";
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
  }

  function applyLang(lang) {
    const dict = (window.E9_TRANSLATIONS && window.E9_TRANSLATIONS[lang]) || {};
    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (lang === "fr") return; // le français est déjà le texte par défaut dans le HTML
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    document.querySelectorAll("[data-lang-select]").forEach((sel) => {
      sel.value = lang;
    });

    // re-render le panier si déjà chargé (pour les libellés dynamiques)
    if (window.E9_CART_RENDER) window.E9_CART_RENDER();
  }

  document.addEventListener("DOMContentLoaded", function () {
    const lang = getLang();
    applyLang(lang);

    document.querySelectorAll("[data-lang-select]").forEach((sel) => {
      sel.value = lang;
      sel.addEventListener("change", (e) => setLang(e.target.value));
    });
  });
})();
