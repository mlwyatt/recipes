const el = document.getElementById('recipe');
const id = new URLSearchParams(location.search).get('id');

// Only allow simple slugs so ?id= can't be used to fetch arbitrary paths.
if (!id || !/^[\w.-]+$/.test(id)) {
  el.innerHTML = '<p class="muted">No recipe specified.</p>';
} else {
  Promise.all([
    fetch(`recipes/${id}.json`).then((r) => { if (!r.ok) throw 0; return r.json(); }),
    fetch('index.json').then((r) => r.json()).catch(() => []),
  ])
    .then(([r, index]) => show(r, index.find((x) => x.id === id)))
    .catch(() => { el.innerHTML = '<p class="muted">Recipe not found.</p>'; });
}

function list(items, tag = 'ul') {
  return `<${tag}>${(items ?? []).map((i) => `<li>${esc(label(i))}</li>`).join('')}</${tag}>`;
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
  if (document.referrer.startsWith(location.origin) && /index\.html|\/$|\?/.test(document.referrer)) {
    document.getElementById('back').href = document.referrer;
  }
}
