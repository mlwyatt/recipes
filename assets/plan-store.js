// @ts-check

// Meal plan state, kept in this browser's localStorage (works on GitHub Pages; not shared between devices).
// Keys are prefixed because every project site under <user>.github.io shares one origin.
(() => {
  const K_PLAN = 'recipe-site:plan';
  const K_DONE = 'recipe-site:checked';
  const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

  const listeners = new Set();
  // kind: 'plan' (meals changed) or 'checked' (shopping ticks changed); remote: change came from another tab
  const emit = (kind, remote = false) => listeners.forEach((fn) => fn(kind, remote));

  const Plan = {
    ids: () => read(K_PLAN, []),
    has: (id) => Plan.ids().includes(id),
    add(id) { const ids = Plan.ids(); if (!ids.includes(id)) write(K_PLAN, [...ids, id]); emit('plan'); },
    remove(id) { write(K_PLAN, Plan.ids().filter((x) => x !== id)); emit('plan'); },
    toggle(id) { Plan.has(id) ? Plan.remove(id) : Plan.add(id); },
    clear() { write(K_PLAN, []); write(K_DONE, {}); emit('plan'); },
    checked: () => read(K_DONE, {}),
    setChecked(key, on) {
      const c = Plan.checked();
      if (on) c[key] = 1; else delete c[key];
      write(K_DONE, c);
      emit('checked');
    },
    uncheckAll() { write(K_DONE, {}); emit('checked'); },
    onChange(fn) { listeners.add(fn); },
  };
  window.Plan = Plan;

  window.addEventListener('storage', (e) => {
    if (e.key === K_PLAN) emit('plan', true);
    else if (e.key === K_DONE) emit('checked', true);
  });

  // Keep any <span data-plan-count> badge current.
  const badge = () => document.querySelectorAll('[data-plan-count]').forEach((el) => {
    const n = Plan.ids().length;
    el.textContent = n || '';
    el.hidden = !n;
  });
  Plan.onChange(badge);
  document.addEventListener('DOMContentLoaded', badge);
})();
