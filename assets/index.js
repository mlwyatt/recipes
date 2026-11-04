const PAGE_SIZE = 24;
const grid = document.getElementById('grid');
const pager = document.getElementById('pager');
const count = document.getElementById('count');
const qInput = document.getElementById('q');

let all = [];
let filtered = [];

// State lives in the URL: index.html?q=beef&p=2
const params = () => new URLSearchParams(location.search);
const getQ = () => params().get('q') ?? '';
const getPage = () => Math.max(1, parseInt(params().get('p'), 10) || 1);

function setUrl(q, p, replace = false) {
  const sp = new URLSearchParams();
  if (q) sp.set('q', q);
  if (p > 1) sp.set('p', p);
  const url = location.pathname + (sp.toString() ? `?${sp}` : '');
  history[replace ? 'replaceState' : 'pushState'](null, '', url);
}

function applyFilter(q) {
  const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  filtered = !terms.length
    ? all
    : all.filter((r) => {
        const hay = [r.title, ...r.ingredients, ...r.cookware].join(' ').toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
}

function render() {
  const q = getQ();
  applyFilter(q);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(getPage(), pages);
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  qInput.value = q;
  count.textContent = `${filtered.length} recipe${filtered.length === 1 ? '' : 's'}`;

  grid.innerHTML = slice.length
    ? slice.map((r) => `
        <a class="card" href="show.html?id=${encodeURIComponent(r.id)}">
          ${r.image ? `<img loading="lazy" src="${esc(r.image)}" alt="">` : '<div class="noimg"></div>'}
          <h3>
            <span class="card-favorite">${r.favorite ? 'star' : ''}</span>
            ${esc(r.title)}
          </h3>
          <span class="card-minutes">${esc(r.cooking_minutes)} minutes</span>
        </a>`).join('')
    : '<p class="muted">No matches.</p>';

  pager.innerHTML = pages > 1 ? `
    <button ${page === 1 ? 'disabled' : ''} data-p="${page - 1}">Prev</button>
    <span>${page} / ${pages}</span>
    <button ${page === pages ? 'disabled' : ''} data-p="${page + 1}">Next</button>` : '';
}

pager.addEventListener('click', (e) => {
  const p = parseInt(e.target.dataset.p, 10);
  if (!p) return;
  setUrl(getQ(), p);
  render();
  window.scrollTo(0, 0);
});

let timer;
qInput.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    setUrl(qInput.value.trim(), 1, true); // new query resets to page 1
    render();
  }, 150);
});

window.addEventListener('popstate', render);

fetch('index.json')
  .then((r) => r.json())
  .then((data) => { all = data; render(); })
  .catch(() => { grid.innerHTML = '<p class="muted">Could not load index.json.</p>'; });
