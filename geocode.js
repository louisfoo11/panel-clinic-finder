// Looks up the centre point of every postcode used by the clinic lists, using OpenStreetMap Nominatim
// (free, max 1 request/second). Distances in the app are measured to this point, so they are approximate (≈).
// Results are cached in data/postcodes.json; re-running only looks up postcodes not seen before.
// Usage: node geocode.js
const fs = require('fs');
const path = require('path');

const FILES = ['clinics.json', 'tgj.json'].map(f => path.join(__dirname, 'data', f)).filter(fs.existsSync);
const CACHE = path.join(__dirname, 'data', 'postcodes.json');
const UA = 'PanelClinicFinder/1.0 (github.com/louisfoo11/panel-clinic-finder)';
const inMY = r => +r.lat > 0.8 && +r.lat < 7.5 && +r.lon > 99.5 && +r.lon < 119.5;
const sleep = ms => new Promise(r => setTimeout(r, ms));
// The last 5-digit number is the postcode; earlier ones can be lot numbers ("Lot 14086 ... 93050 Kuching").
const postcodeOf = a => (a.match(/\b\d{5}\b/g) || []).pop() || '';

const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
const postcodes = new Set();
FILES.forEach(f => JSON.parse(fs.readFileSync(f, 'utf8')).clinics.forEach(c => { const pc = postcodeOf(c.address); if (pc) postcodes.add(pc); }));
const todo = [...postcodes].filter(pc => !(pc in cache)).sort();
console.log(`${postcodes.size} postcodes, ${todo.length} to look up`);

async function lookup(pc) {
  const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ format: 'jsonv2', countrycodes: 'my', postalcode: pc, limit: '1' });
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) { await sleep(10000 * attempt); continue; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const hit = (await res.json()).find(inMY);
      return hit ? { lat: +(+hit.lat).toFixed(5), lon: +(+hit.lon).toFixed(5) } : null;
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(3000 * attempt);
    }
  }
  return null;
}

(async () => {
  let n = 0;
  for (const pc of todo) {
    try { cache[pc] = await lookup(pc); } catch (e) { console.log(`${pc}: ${e.message} (will retry next run)`); }
    await sleep(1100);
    if (++n % 25 === 0) { fs.writeFileSync(CACHE, JSON.stringify(cache)); console.log(`${n}/${todo.length}`); }
  }
  fs.writeFileSync(CACHE, JSON.stringify(cache));
  const found = [...postcodes].filter(pc => cache[pc]).length;
  console.log(`Done. ${found}/${postcodes.size} postcodes located.`);
})();
