// @ts-check

const mealsEl = document.getElementById('meals');
const shoppingEl = document.getElementById('shopping');
const progressEl = document.getElementById('progress');
const mealCountEl = document.getElementById('meal-count');
const colsEl = document.getElementById('plan-cols');
const emptyEl = document.getElementById('empty');

const cache = new Map();   // id -> recipe JSON, or null if it couldn't be loaded
let index = new Map();     // id -> { title, image } from index.json
let items = [];            // current shopping list, used by "Copy list"
let run = 0;               // drops results from out-of-date renders

async function recipeFor(id) {
  if (!cache.has(id)) {
    try {
      const r = await fetch(`recipes/${encodeURIComponent(id)}.json`);
      cache.set(id, r.ok ? await r.json() : null);
    } catch { cache.set(id, null); }
  }
  return cache.get(id);
}

function updateProgress() {
  const boxes = [...shoppingEl.querySelectorAll('input')];
  const done = boxes.filter((b) => b.checked).length;
  progressEl.textContent = boxes.length ? `${done} of ${boxes.length} checked` : '';
}

async function render() {
  const mine = ++run;
  const ids = Plan.ids();
  colsEl.hidden = !ids.length;
  emptyEl.hidden = ids.length > 0;
  if (!ids.length) { mealsEl.innerHTML = shoppingEl.innerHTML = ''; items = []; return; }

  const recipes = await Promise.all(ids.map(async (id) => ({ id, data: await recipeFor(id) })));
  if (mine !== run) return;

  const title = (id, data) => data?.title ?? data?.name ?? index.get(id)?.title ?? id;

  mealCountEl.textContent = `(${ids.length})`;
  mealsEl.innerHTML = recipes.map(({ id, data }) => {
    const img = index.get(id)?.image;
    return `
      <li class="meal">
        ${img ? `<img src="${esc(img)}" alt="">` : '<div class="noimg"></div>'}
        ${data
          ? `<a href="show.html?id=${encodeURIComponent(id)}">${esc(title(id, data))}</a>`
          : `<span class="muted">${esc(id)} (recipe not found)</span>`}
        <button class="x" data-remove="${esc(id)}" aria-label="Remove ${esc(title(id, data))} from plan">&times;</button>
      </li>`;
  }).join('');

  items = Shopping.build(recipes.filter((r) => r.data).map((r) => ({
    title: title(r.id, r),
    ingredients: r.data.ingredients,
  })));
  const checked = Plan.checked();
  // Unchecked first, so what's left to buy stays at the top after a refresh.
  const sorted = [...items.filter((i) => !checked[i.key]), ...items.filter((i) => checked[i.key])];

  shoppingEl.innerHTML = sorted.map((i) => `
    <li class="item${checked[i.key] ? ' done' : ''}">
      <label class="check">
        <input type="checkbox" data-key="${esc(i.key)}" ${checked[i.key] ? 'checked' : ''}>
        <span>${i.amount ? `<span class="qty">${esc(i.amount)}</span> ` : ''}<span class="nm">${esc(i.name)}</span></span>
      </label>
      <span class="from muted">${esc(i.from.join(', '))}</span>
    </li>`).join('');
  updateProgress();
}

// Ticking an item updates the row in place (no re-render, so keyboard focus stays put).
shoppingEl.addEventListener('change', (e) => {
  const box = e.target.closest('input[data-key]');
  if (!box) return;
  Plan.setChecked(box.dataset.key, box.checked);
  box.closest('li').classList.toggle('done', box.checked);
  updateProgress();
});

mealsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-remove]');
  if (btn) Plan.remove(btn.dataset.remove);
});

document.getElementById('uncheck').addEventListener('click', () => { Plan.uncheckAll(); render(); });

document.getElementById('clear').addEventListener('click', () => {
  if (confirm('Remove all meals from the plan and reset the shopping list?')) Plan.clear();
});

document.getElementById('copy').addEventListener('click', async (e) => {
  const checked = Plan.checked();
  const text = items.filter((i) => !checked[i.key]).map((i) => `- ${i.amount ? i.amount + ' ' : ''}${i.name}`).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    e.target.textContent = 'Copied!';
    setTimeout(() => { e.target.textContent = 'Copy list'; }, 1500);
  } catch { alert('Could not copy to the clipboard.'); }
});

Plan.onChange((kind, remote) => { if (kind === 'plan' || remote) render(); });

fetch('index.json')
  .then((r) => r.json())
  .then((list) => { index = new Map(list.map((r) => [r.id, r])); })
  .catch(() => {})
  .finally(render);
