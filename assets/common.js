// Shared helpers.
window.esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Normalize "string or object" entries into a display string.
window.label = (x) => {
  if (typeof x === 'string') return x;
  if (!x || typeof x !== 'object') return '';
  const qty = [x.quantity ?? x.amount, x.unit].filter((v) => v !== undefined && v !== null && v !== '').join(' ');
  const nm = x.name ?? x.item ?? x.ingredient_name ?? x.primary_message ?? '';
  return [qty, nm].filter(Boolean).join(' ');
};
