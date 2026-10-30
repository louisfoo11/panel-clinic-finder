// Turns the TGJ panel clinic PDF into data/tgj.json.
// Usage: node pdf2rows.mjs "<TGJ pdf>" > data/tgj/rows.txt && node parse-tgj.js
const fs = require('fs');
const path = require('path');

const ROWS = path.join(__dirname, 'data', 'tgj', 'rows.txt');
const OUT = path.join(__dirname, 'data', 'tgj.json');
const AS_OF = '2025-09-22';

// Same state names as the medical exam list, so one state filter works for both.
const STATE = {
  'PENANG': 'PULAU PINANG',
  'WILAYAH PERSEKUTUAN KUALA LUMPUR': 'KUALA LUMPUR',
  'WILAYAH PERSEKUTUAN PUTRAJAYA': 'PUTRAJAYA',
  'WILAYAH PERSEKUTUAN LABUAN': 'LABUAN',
};
// Trailing state names are removed only when a town name remains in front of them.
const TRAILING_STATE = /[\s,]*\b(kedah( darul ?aman)?|darul ?aman|darulaman|perlis( indera kayangan)?|pulau pinang|p\.? ?pinang|penang|perak( darul ridzuan)?|selangor( darul ehsan)?|darul ehsan|wilayah persekutuan( kuala lumpur)?|w\.? ?p\.?( kuala lumpur)?|kuala lumpur|negeri sembilan( darul khusus)?|n\.? ?sembilan|melaka|malacca|johor( darul ta'?zim)?|pahang( darul makmur)?|terengganu( darul iman)?|kelantan( darul naim)?|sabah|sarawak|putrajaya|labuan|malaysia)\.?$/i;

const title = s => s.toLowerCase().replace(/\b([a-z])/g, m => m.toUpperCase()).replace(/\s+/g, ' ').trim();

function strip(t) {
  let prev;
  do { prev = t; const r = t.replace(TRAILING_STATE, '').trim(); if (r) t = r; } while (t !== prev);
  return t.replace(/\s+darul \w+$/i, '').replace(/[.,]+$/, '').trim();
}

function townOf(address) {
  const m = address.match(/\b(\d{5})\b\s*,?\s*([^,]*)/);
  if (!m) return '';
  let t = strip(m[2].trim());
  if (!t) {
    // "..., Alor Setar, 05000, Kedah": the town comes before the postcode
    const before = address.slice(0, m.index).split(',').map(x => x.trim()).filter(Boolean);
    t = strip(before[before.length - 1] || '');
  }
  if (!t || /\d/.test(t) || t.length > 30) return '';
  return title(t.replace(/^sg\.?\s+/i, 'Sungai ').replace(/^bt\.?\s+/i, 'Batu ').replace(/^kl$/i, 'Kuala Lumpur'));
}

const rows = [];
let state = '';
for (const line of fs.readFileSync(ROWS, 'utf8').split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const cells = line.split(' | ').map(c => { const i = c.indexOf(':'); return { x: +c.slice(0, i), s: c.slice(i + 1).trim() }; });
  if (cells.length === 1 && /^[A-Z .()&'-]+$/.test(cells[0].s) && !/GREAT JOURNEY/i.test(cells[0].s)) { state = STATE[cells[0].s] || cells[0].s; continue; }
  if (!/^\d+$/.test(cells[0].s) || cells.length < 4) continue;
  const tel = cells[cells.length - 1];
  if (tel.x < 400) continue;
  // An address split over two text boxes (e.g. "... Klang" + "Selangor") is joined back together.
  const address = cells.slice(2, -1).map(c => c.s).join(', ').replace(/(\d{5})(?=[A-Za-z])/, '$1 ').replace(/([a-z])(\d{5})/i, '$1 $2');
  rows.push({ no: +cells[0].s, name: cells[1].s, address, tel: tel.s, state });
}

// Spelling variants of the same town in the PDF, merged into one name.
const ALIAS = {
  'Georgetown': 'George Town', 'Spg Ampat': 'Simpang Ampat', 'Spg Empat Balik': 'Simpang Ampat', 'Tanjong Tokong': 'Tanjung Tokong',
  'Johor Bharu': 'Johor Bahru', 'Sg.bakap': 'Sungai Bakap', 'Kuala Lmpur': 'Kuala Lumpur', 'Wp Kuala Lumpur': 'Kuala Lumpur',
  'Bakar Arang Sungai Petani': 'Sungai Petani', 'Nusa Jaya': 'Iskandar Puteri', 'Melaka': 'Melaka',
};
// An "area" that is really a state or district name tells the client nothing; treat it as unclear.
const VAGUE = /^(kedah|perlis|pulau pinang|penang|perak|selangor|johor|pahang|terengganu|kelantan|sabah|sarawak|negeri sembilan|wilayah persekutuan|federal territory.*|kuala|seberang perai.*)$/i;
const postcodeOf = a => (a.match(/\b(\d{5})\b/) || [])[1] || '';

const towns = rows.map(r => {
  let t = townOf(r.address);
  t = ALIAS[t] || t;
  return VAGUE.test(t) ? '' : t;
});
// Fill unclear towns from other clinics with the same postcode.
const byPostcode = {};
rows.forEach((r, i) => { const pc = postcodeOf(r.address); if (pc && towns[i]) (byPostcode[pc] = byPostcode[pc] || {})[towns[i]] = (byPostcode[pc][towns[i]] || 0) + 1; });
rows.forEach((r, i) => {
  if (towns[i]) return;
  const c = byPostcode[postcodeOf(r.address)];
  if (c) towns[i] = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
  else if (r.state === 'KUALA LUMPUR' || r.state === 'PUTRAJAYA' || r.state === 'LABUAN') towns[i] = title(r.state);
});

const problems = [];
const clinics = rows.map((r, i) => {
  const area = towns[i];
  if (!/\b\d{5}\b/.test(r.address)) problems.push(`TGJ-${r.no} ${r.name}: no postcode in address`);
  if (!area) problems.push(`TGJ-${r.no} ${r.name}: town not clear, listed under "Other"`);
  return { code: 'TGJ-' + r.no, name: r.name, tel: r.tel, address: r.address, services: [], full: false, hours: '', doctors: '', state: r.state, area: area || 'Other' };
});

const nums = rows.map(r => r.no).sort((a, b) => a - b);
for (let i = 1; i <= nums[nums.length - 1]; i++) if (!nums.includes(i)) problems.push(`Row ${i} missing from the PDF text`);

fs.writeFileSync(OUT, JSON.stringify({ asOf: AS_OF, source: 'Great Eastern — The Great Journey (TGJ) panel clinics, 22 Sep 2025', clinics }, null, 1));
const by = {};
clinics.forEach(c => { by[c.state] = (by[c.state] || 0) + 1; });
console.log(`TGJ: ${clinics.length} clinics, ${new Set(clinics.map(c => c.area)).size} towns`, by);
console.log(problems.length ? 'Flagged:\n  ' + problems.join('\n  ') : 'No problems.');
