// Walks recipes/*.json and writes index.json (a lightweight summary list).
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const name = (x) => (typeof x === 'string' ? x : x?.name ?? x?.item ?? x?.ingredient_name ?? '');
const EXTS = ['jpg', 'jpeg', 'png', 'webp'];

const index = readdirSync('recipes')
  .filter((file) => file.endsWith('.json'))
  .map((file) => {
    const id = file.replace(/\.json$/, '');
    const data = JSON.parse(readFileSync(`recipes/${file}`, 'utf8'));
    const ext = EXTS.find((e) => existsSync(`images/${id}.${e}`));

    return {
      id,
      favorite: data.favorite === true,
      cooking_minutes: data.cooking_minutes,
      title: data.name,
      ingredients: (data.ingredients ?? []).map(name).filter(Boolean),
      cookware: (data.cookwares ?? []).map(name).filter(Boolean),
      image: ext ? `images/${id}.${ext}` : null,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

writeFileSync('index.json', JSON.stringify(index, null, 2));
console.log(`Wrote index.json with ${index.length} recipes`);
