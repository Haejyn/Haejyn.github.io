"use strict";
(() => {
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  let saved;
  try { saved = localStorage.getItem("portfolio-theme"); } catch (_) {}
  let explicit = saved === "light" || saved === "dark";
  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const dark = theme === "dark";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#191919" : "#ffffff");
    const button = document.querySelector(".theme-toggle");
    if (button) {
      button.setAttribute("aria-label", dark ? "라이트 모드로 전환" : "다크 모드로 전환");
      button.setAttribute("aria-pressed", String(dark));
      button.querySelector(".theme-label").textContent = dark ? "라이트" : "다크";
    }
  }
  apply(explicit ? saved : system.matches ? "dark" : "light");
  document.addEventListener("DOMContentLoaded", () => {
    apply(root.dataset.theme);
    document.querySelector(".theme-toggle")?.addEventListener("click", () => {
      const theme = root.dataset.theme === "dark" ? "light" : "dark";
      explicit = true;
      try { localStorage.setItem("portfolio-theme", theme); } catch (_) {}
      apply(theme);
    });
  });
  system.addEventListener("change", event => { if (!explicit) apply(event.matches ? "dark" : "light"); });
})();
