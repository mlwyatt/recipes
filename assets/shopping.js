// @ts-check

// Turns ingredient lists into one merged shopping list.
// Same ingredient + same unit are summed; different units stay separate lines (no unit conversion).
(() => {
  const UNITS = {
    tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
    tbsp: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
    cup: 'cup', cups: 'cup',
    oz: 'oz', ounce: 'oz', ounces: 'oz',
    lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
    g: 'g', gram: 'g', grams: 'g', kg: 'kg', ml: 'ml', l: 'l',
    clove: 'clove', cloves: 'clove', can: 'can', cans: 'can', pinch: 'pinch', bunch: 'bunch',
  };
  const PLURAL = { cup: 'cups', clove: 'cloves', can: 'cans', bunch: 'bunches' };
  const FRACS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

  // 2, "1.5", "1/2", "1 1/2", "1½", "½"  ->  number (or null)
  function parseQty(v) {
    if (typeof v === 'number') return v;
    if (typeof v !== 'string' || !v.trim()) return null;
    let total = 0;
    for (const part of v.trim().replace(/(\d)([½¼¾⅓⅔])/, '$1 $2').split(/\s+/)) {
      if (FRACS[part] !== undefined) total += FRACS[part];
      else if (/^\d+\/\d+$/.test(part)) { const [a, b] = part.split('/'); total += Number(a) / Number(b); }
      else if (/^\d*\.?\d+$/.test(part)) total += parseFloat(part);
      else return null;
    }
    return total;
  }

  const cleanName = (s) => String(s).split(',')[0].trim();
  const QTY_RE = /^((?:\d+\s+)?\d+\/\d+|\d*\.?\d+(?:\s*[½¼¾⅓⅔])?|[½¼¾⅓⅔])\s*(.*)$/;

  // "1 ½ lb" -> { qty: 1.5, rest: "lb" };  "2-3 cloves garlic" -> { qty: 3, rest: "cloves garlic" } (upper bound)
  function splitQuantity(s) {
    s = String(s).trim().replace(/^(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)/, (_, a, b) => String(Math.max(a, b)));
    const m = s.match(QTY_RE);
    return m ? { qty: parseQty(m[1]), rest: m[2].trim() } : { qty: null, rest: s };
  }

  const canon = (u) => { u = u.trim().toLowerCase().replace(/\.$/, ''); return UNITS[u] ?? u; };

  // Accepts { ingredient_name, quantity: "1 ½ lb" } (also name/item/ingredient, quantity|amount, optional unit)
  // or a plain string like "1 1/2 cups flour, sifted".
  function normalize(ing) {
    if (ing && typeof ing === 'object') {
      const name = cleanName(ing.ingredient_name ?? ing.name ?? ing.item ?? ing.ingredient ?? '');
      if (!name) return null;
      const q = ing.quantity ?? ing.amount;
      let qty = null, unit = String(ing.unit ?? ''), text = '';
      if (typeof q === 'number') qty = q;
      else if (typeof q === 'string' && q.trim()) {
        const { qty: n, rest } = splitQuantity(q);
        qty = n;
        if (n === null) text = q.trim();            // e.g. "to taste", "a pinch": shown as-is
        else if (!unit.trim()) unit = rest;         // unit lives inside the quantity string
      }
      return { qty, unit: canon(unit), name, text };
    }
    const s = String(ing ?? '').trim();
    if (!s) return null;
    const { qty, rest } = splitQuantity(s);
    if (qty === null) return { qty: null, unit: '', name: cleanName(s), text: '' };
    const [first, ...others] = rest.split(/\s+/);
    const unit = UNITS[first.toLowerCase().replace(/\.$/, '')];
    const name = cleanName(unit ? others.join(' ').replace(/^of\s+/i, '') : rest);
    return name ? { qty, unit: unit ?? '', name, text: '' } : { qty: null, unit: '', name: cleanName(s), text: '' };
  }

  // 1.5 -> "1½", 0.333 -> "⅓", 2.07 -> "2.07"
  function fmtQty(n) {
    const whole = Math.floor(n + 1e-9);
    const f = n - whole;
    const steps = [[0, ''], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']];
    const best = steps.reduce((a, b) => (Math.abs(b[0] - f) < Math.abs(a[0] - f) ? b : a));
    if (Math.abs(best[0] - f) > 0.04) return String(Math.round(n * 100) / 100);
    const w = whole + (best[0] === 1 ? 1 : 0);
    return (w ? String(w) : '') + best[1] || '0';
  }

  function amountText({ qty, unit, text }) {
    if (qty === null) return text || '';
    const q = fmtQty(qty);
    if (!unit) return q;
    return `${q} ${qty > 1 && PLURAL[unit] ? PLURAL[unit] : unit}`;
  }

  // entries: [{ title, ingredients }]  ->  [{ key, name, amount, from: [titles] }]
  function build(entries) {
    const map = new Map();
    for (const { title, ingredients } of entries) {
      for (const raw of ingredients ?? []) {
        const ing = normalize(raw);
        if (!ing) continue;
        const key = `${ing.name.toLowerCase()}|${ing.unit}`;
        let item = map.get(key);
        if (!item) { item = { key, name: ing.name, unit: ing.unit, qty: null, text: '', from: [] }; map.set(key, item); }
        if (ing.qty !== null) item.qty = (item.qty ?? 0) + ing.qty;
        if (ing.text && !item.text) item.text = ing.text;
        if (!item.from.includes(title)) item.from.push(title);
      }
    }
    return [...map.values()]
      .map((it) => ({ key: it.key, name: it.name, amount: amountText(it), from: it.from }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const api = { build };
  if (typeof window !== 'undefined') window.Shopping = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
