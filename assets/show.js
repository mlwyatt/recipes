// @ts-check

/**
 * @typedef {Object} Cookware
 * @property {number} id
 * @property {string} name
 * @property {string} slug
 */

/**
 * @typedef {Object} Instruction
 * @property {number} id
 * @property {string} primary_message
 * @property {string | null} secondary_message
 */

/**
 * @typedef {Object} Ingredient
 * @property {number} id
 * @property {string} quantity
 * @property {string} ingredient_name
 */

/**
 * @typedef {Object} Recipe
 * @property {number} id
 * @property {boolean} favorite
 * @property {number} cooking_minutes
 * @property {string} name
 * @property {Array<Cookware>} cookwares
 * @property {Array<Instruction>} instructions
 * @property {Array<Ingredient>} ingredients
 */

/**
 * @typedef {Object} IndexRecipe
 * @property {string} id
 * @property {boolean} favorite
 * @property {number} cooking_minutes
 * @property {string} title
 * @property {string} image
 * @property {Array<string>} cookware
 * @property {Array<string>} ingredients
 */

const el = document.getElementById('recipe');
const id = new URLSearchParams(location.search).get('id');

// Only allow simple slugs so ?id= can't be used to fetch arbitrary paths.
if ( !id || !/^[\w.-]+$/.test(id) ) {
  el.innerHTML = '<p class="muted">No recipe specified.</p>';
}
else {
  Promise.all([
    fetch(`recipes/${id}.json`).then((r) => { if (!r.ok) throw 0; return r.json(); }),
    fetch('index.json').then((r) => r.json()).catch(() => []),
  ])
    .then((/* @type {[Recipe, Array<IndexRecipe>]} */ [r, index]) => show(r, index.find((/** @type {IndexRecipe} */ item) => item.id === id)))
    .catch(() => { el.innerHTML = '<p class="muted">Recipe not found.</p>'; });
}

function list(items, tag = 'ul') {
  return `<${tag}>${(items ?? []).map((item) => `<li>${esc(label(item))}</li>`).join('')}</${tag}>`;
}

function show(r, meta) {
  const data = r;
  const title = data.title ?? data.name ?? id;

  document.title = title;

  const img = meta?.image;
  const steps = (data.instructions ?? []).map((s) =>
    typeof s === 'string' ? s : s.text ?? s.instruction ?? label(s));

  el.innerHTML = `
    <h1>${esc(title)}</h1>
    ${img ? `<img class="hero" src="${esc(img)}" alt="">` : ''}
    <div class="cols">
      <section>
        <h2>Ingredients</h2>
        ${list(data.ingredients)}
        ${data.cookwares?.length ? `<h2>Cookware</h2>${list(data.cookwares)}` : ''}
      </section>
      <section>
        <h2>Instructions</h2>
        ${list(steps, 'ol')}
      </section>
    </div>`;

  // "Back" keeps the search/page the user came from, when available.
  if ( document.referrer.startsWith(location.origin) && /index\.html|\/$|\?/.test(document.referrer) ) {
    const link = document.getElementById('back');

    if ( link instanceof HTMLAnchorElement ) {
      link.href = document.referrer;
    }
  }
}
