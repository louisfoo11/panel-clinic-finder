// Extracts text from a PDF as rows (items grouped by their y position), page by page.
// Usage: node pdf2rows.mjs <file.pdf> > out.txt
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';

const file = process.argv[2];
const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 }).promise;
console.log(`#PAGES ${doc.numPages}`);
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const { items } = await page.getTextContent();
  const rows = new Map();
  for (const it of items) {
    if (!it.str.trim()) continue;
    const y = Math.round(it.transform[5]);
    const key = [...rows.keys()].find(k => Math.abs(k - y) <= 2) ?? y;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push({ x: Math.round(it.transform[4]), s: it.str.trim() });
  }
  console.log(`#PAGE ${p}`);
  [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([y, cells]) => {
    console.log(cells.sort((a, b) => a.x - b.x).map(c => `${c.x}:${c.s}`).join(' | '));
  });
}
