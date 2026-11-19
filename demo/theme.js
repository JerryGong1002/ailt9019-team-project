'use strict';
// Apply before styles load to avoid flashing the opposite theme.
(() => {
  const key = 'spending-analyzer.theme.v1';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let choice = null;
  try { const saved = localStorage.getItem(key); if (['light', 'dark'].includes(saved)) choice = saved; } catch {}
  function apply() {
    const dark = (choice || (system.matches ? 'dark' : 'light')) === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelectorAll('[data-theme-option]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeOption === (dark ? 'dark' : 'light')));
    });
  }
  apply();
  system.addEventListener('change', () => { if (!choice) apply(); });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      choice = ['light', 'dark'].includes(event.newValue) ? event.newValue : null;
      apply();
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.querySelectorAll('[data-theme-option]').forEach(button => {
      button.addEventListener('click', () => {
        choice = button.dataset.themeOption;
        try { localStorage.setItem(key, choice); } catch {}
        apply();
      });
    });
  });
})();
