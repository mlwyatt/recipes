// @ts-check

// Shared helpers.
window.esc = (/** @type {string} */ str) =>
  String(str ?? '')
  .replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? ''));

// Normalize "string or object" entries into a display string.
window.label = (/** @type {string} */ toLabel) => {
  if ( typeof toLabel === 'string' ) {
    return toLabel;
  }

  if ( !toLabel || typeof toLabel !== 'object' ) {
    return '';
  }

  const qty = [toLabel.quantity ?? toLabel.amount, toLabel.unit].filter((value) => value !== undefined && value !== null && value !== '').join(' ');
  const nm = toLabel.name ?? toLabel.item ?? toLabel.ingredient_name ?? toLabel.primary_message ?? '';

  return [qty, nm].filter(Boolean).join(' ');
};
