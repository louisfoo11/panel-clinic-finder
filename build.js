// Builds the Netlify site (site/) and the offline single file (dist/) from src/ templates + data/clinics.json.
// Usage: node build.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');
const DIST = path.join(ROOT, 'dist');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'clinics.json'), 'utf8'));

// ---- data checks: flag, never guess ----
const problems = [];
const seen = new Set();
data.clinics.forEach(c => {
  if (seen.has(c.code)) problems.push(`${c.code}: duplicate code`);
  seen.add(c.code);
  if (!c.name) problems.push(`${c.code}: no clinic name`);
  if (!c.address) problems.push(`${c.code} ${c.name}: no address`);
  if (!c.tel) problems.push(`${c.code} ${c.name}: no phone number`);
  if (!c.hours) problems.push(`${c.code} ${c.name}: no operating hours`);
  if (!c.services || !c.services.length) problems.push(`${c.code} ${c.name}: no tests listed`);
});
data.defaultState = 'PULAU PINANG';

// TGJ (The Great Journey) panel clinics, from parse-tgj.js.
const TGJ = path.join(ROOT, 'data', 'tgj.json');
if (fs.existsSync(TGJ)) {
  const t = JSON.parse(fs.readFileSync(TGJ, 'utf8'));
  data.tgj = { asOf: t.asOf, source: t.source, clinics: t.clinics };
}

// Approximate map location = centre of the clinic's postcode (from geocode.js).
const PC = path.join(ROOT, 'data', 'postcodes.json');
const pcs = fs.existsSync(PC) ? JSON.parse(fs.readFileSync(PC, 'utf8')) : {};
[['Medical exam', data.clinics], ['TGJ', data.tgj ? data.tgj.clinics : []]].forEach(([label, list]) => {
  let located = 0;
  list.forEach(c => {
    const pc = (c.address.match(/\b\d{5}\b/g) || []).pop(); // last 5-digit number; earlier ones can be lot numbers
    const g = pc && pcs[pc];
    if (g) { c.lat = g.lat; c.lon = g.lon; c.geo = 'area'; located++; }
  });
  console.log(`${label}: ${list.length} clinics, ${located} with a map location`);
});
const json = JSON.stringify(data).replace(/</g, '\\u003c');

const VERSION = data.asOf + '-' + Date.now().toString(36);

// "Install app" banner. Android/desktop Chrome: one-tap install via the browser's install prompt.
// iPhone/iPad: browsers there have no install prompt, so it shows the Share → Add to Home Screen steps.
// Hidden when already running as an installed app, or after the viewer closes it (remembered for 14 days).
const INSTALL_BANNER = `<style>
.ia{position:fixed;left:0;right:0;bottom:0;z-index:25;padding:12px max(16px,env(safe-area-inset-left,0px)) calc(12px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-right,0px));background:var(--ink,#13302C);color:var(--bg,#F3F6F5);display:flex;gap:12px;align-items:center;box-shadow:0 -4px 20px rgba(0,0,0,.18);font-family:var(--body,system-ui,sans-serif)}
.ia img{width:40px;height:40px;border-radius:10px;flex-shrink:0}
.ia .t{flex:1;min-width:0;font-size:13.5px;line-height:1.35}
.ia .t b{display:block;font-size:15px}
.ia button{border:0;border-radius:10px;font:600 14px var(--body,system-ui,sans-serif);padding:9px 14px;cursor:pointer}
.ia .go{background:var(--accent,#0F7C6E);color:#fff}
.ia .x{background:transparent;color:inherit;opacity:.75;padding:9px 6px;font-size:18px;line-height:1}
.ia-steps{position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;padding:16px;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}
.ia-steps .s{background:var(--surface,#fff);color:var(--ink,#13302C);border-radius:16px;max-width:420px;width:100%;padding:18px;display:flex;flex-direction:column;gap:12px;font-family:var(--body,system-ui,sans-serif)}
.ia-steps h4{margin:0;font-size:18px}
.ia-steps ol{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:10px;font-size:15px}
.ia-steps .ico{display:inline-flex;vertical-align:middle;border:1px solid var(--line,#D7E1DE);border-radius:6px;padding:2px 5px}
.ia-steps button{border:0;background:var(--accent,#0F7C6E);color:#fff;font:600 15px var(--body,system-ui,sans-serif);padding:12px;border-radius:12px;cursor:pointer}
</style>
<script>(function(){
  const S={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  if(standalone)return;
  const until=+S.get('ia-hide-until')||0;if(Date.now()<until)return;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const zh=()=>S.get('pcf-lang')==='zh';
  const L=()=>zh()?{h:'安装为手机应用',p:'一键打开，离线也能用',go:'安装',st:'添加到主屏幕',s1:'点击浏览器底部的 <span class="ico">分享 ⬆︎</span> 按钮',s2:'向下滑，选择 <b>「添加到主屏幕」</b>',s3:'点击右上角 <b>「添加」</b>',ok:'明白了'}
                      :{h:'Install as an app',p:'Open it in one tap, even offline',go:'Install',st:'Add to Home Screen',s1:'Tap the <span class="ico">Share ⬆︎</span> button in Safari',s2:'Scroll down and tap <b>Add to Home Screen</b>',s3:'Tap <b>Add</b> at the top right',ok:'Got it'};
  let deferred=null,bar=null;
  const icon=document.querySelector('link[rel=apple-touch-icon]').href;
  function show(){
    if(bar)return;const t=L();
    bar=document.createElement('div');bar.className='ia';bar.setAttribute('role','region');bar.setAttribute('aria-label',t.h);
    bar.innerHTML='<img src="'+icon+'" alt=""><div class="t"><b>'+t.h+'</b>'+t.p+'</div><button class="go" type="button">'+t.go+'</button><button class="x" type="button" aria-label="Close">✕</button>';
    bar.querySelector('.go').onclick=async()=>{
      if(deferred){deferred.prompt();const r=await deferred.userChoice.catch(()=>null);deferred=null;if(r&&r.outcome==='accepted')hide();}
      else steps();
    };
    bar.querySelector('.x').onclick=()=>{S.set('ia-hide-until',String(Date.now()+14*864e5));hide()};
    document.body.appendChild(bar);document.body.style.paddingBottom='76px';
  }
  function hide(){if(bar){bar.remove();bar=null;document.body.style.paddingBottom=''}}
  function steps(){
    const t=L(),m=document.createElement('div');m.className='ia-steps';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
    m.innerHTML='<div class="s"><h4>'+t.st+'</h4><ol><li>'+t.s1+'</li><li>'+t.s2+'</li><li>'+t.s3+'</li></ol><button type="button">'+t.ok+'</button></div>';
    m.onclick=e=>{if(e.target===m||e.target.tagName==='BUTTON')m.remove()};document.body.appendChild(m);
  }
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;show()});
  addEventListener('appinstalled',hide);
  if(ios)addEventListener('load',()=>setTimeout(show,1200));
  // Language switch in the page: refresh the banner text.
  document.addEventListener('click',e=>{if(bar&&e.target.closest('#lang-en,#lang-zh'))setTimeout(()=>{hide();show()},0)});
})();</script>`;

function page({ body, title, manifest, themeColor, sw, base = './' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="${themeColor}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${title}">
${manifest ? `<link rel="manifest" href="${manifest}">` : ''}
<link rel="icon" type="image/png" href="${base}icon-192.png">
<link rel="apple-touch-icon" href="${base}icon-192.png">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${body}
${sw ? INSTALL_BANNER : ''}
${sw ? `<script>if('serviceWorker' in navigator){
  // When a newer version takes over, reload once so the phone shows it straight away.
  let had=!!navigator.serviceWorker.controller,done=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!done){done=true;location.reload()}had=true});
  addEventListener('load',()=>navigator.serviceWorker.register('${base}sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{}));
}</script>` : ''}
</body>
</html>
`;
}

const finderSrc = fs.readFileSync(path.join(ROOT, 'src', 'finder.template.html'), 'utf8').replace('__DATA__', () => json);
const trackerSrc = fs.readFileSync(path.join(ROOT, 'src', 'tracker.template.html'), 'utf8').replace('__DATA__', () => json);

fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(path.join(SITE, 'advisor'), { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

fs.writeFileSync(path.join(SITE, 'index.html'), page({ body: finderSrc, title: 'Panel Clinics', manifest: 'manifest.webmanifest', themeColor: '#0F7C6E', sw: true }));
fs.writeFileSync(path.join(SITE, 'advisor', 'index.html'), page({ body: trackerSrc, title: 'Visit Tracker', manifest: 'manifest.webmanifest', themeColor: '#13302C', sw: true, base: '../' }));
fs.writeFileSync(path.join(DIST, `GE-Panel-Clinic-Finder-offline-${data.asOf}.html`), page({ body: finderSrc, title: 'Panel Clinics', themeColor: '#0F7C6E', sw: false }));

const icons = [
  { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];
fs.writeFileSync(path.join(SITE, 'manifest.webmanifest'), JSON.stringify({
  name: 'Panel Clinic Finder', short_name: 'Panel Clinics', id: './', start_url: './', scope: './',
  display: 'standalone', background_color: '#F3F6F5', theme_color: '#0F7C6E',
  description: 'Find a Great Eastern panel clinic for your medical exam.', icons,
}, null, 2));
fs.writeFileSync(path.join(SITE, 'advisor', 'manifest.webmanifest'), JSON.stringify({
  name: 'Clinic Visit Tracker', short_name: 'Visit Tracker', id: './', start_url: './', scope: './',
  display: 'standalone', background_color: '#F3F6F5', theme_color: '#13302C',
  description: 'Advisor tracker for client clinic visits and reminders.', icons: icons.map(i => ({ ...i, src: '../' + i.src })),
}, null, 2));

// Service worker: network first for pages (always fresh when online), cache fallback when offline.
// Same-site requests skip the browser's HTTP cache (GitHub Pages allows 10 minutes), so updates show at once.
fs.writeFileSync(path.join(SITE, 'sw.js'), `const C='pcf-${VERSION}';
const CORE=['./','./advisor/','./manifest.webmanifest','./advisor/manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
  const same=new URL(r.url).origin===location.origin;
  const req=!same?r:r.mode==='navigate'?new Request(r.url,{cache:'no-cache',credentials:'same-origin'}):new Request(r,{cache:'no-cache'});
  e.respondWith(fetch(req).then(res=>{if(res.ok&&(same||r.url.includes('fonts.g'))){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r,{ignoreSearch:true})))});
`);

fs.writeFileSync(path.join(SITE, '.nojekyll'), '');
fs.writeFileSync(path.join(SITE, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(SITE, '_headers'), `/*
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
/sw.js
  Cache-Control: no-cache
/*.webmanifest
  Content-Type: application/manifest+json
`);

// ---- icons: teal tile with a white medical cross, drawn pixel by pixel ----
function png(size, pad) {
  const crc = (buf) => { let c, t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    let x = 0xffffffff; for (const b of buf) x = t[(x ^ b) & 0xff] ^ (x >>> 8); return (x ^ 0xffffffff) >>> 0; };
  const chunk = (type, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(type), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cr]); };
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const r = size * 0.22, inner = size * (1 - 2 * pad);
  const arm = inner * 0.2, len = inner * 0.6, cx = size / 2, cy = size / 2;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const i = y * (size * 4 + 1) + 1 + x * 4;
      let inside = true;
      if (pad === 0) { const dx = Math.max(r - x, x - (size - 1 - r), 0), dy = Math.max(r - y, y - (size - 1 - r), 0); inside = dx * dx + dy * dy <= r * r; }
      const cross = (Math.abs(x - cx) <= arm / 2 && Math.abs(y - cy) <= len / 2) || (Math.abs(y - cy) <= arm / 2 && Math.abs(x - cx) <= len / 2);
      const [R, G, B, A] = !inside ? [0, 0, 0, 0] : cross ? [255, 255, 255, 255] : [15, 124, 110, 255];
      raw[i] = R; raw[i + 1] = G; raw[i + 2] = B; raw[i + 3] = A;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
fs.writeFileSync(path.join(SITE, 'icon-192.png'), png(192, 0));
fs.writeFileSync(path.join(SITE, 'icon-512.png'), png(512, 0));
fs.writeFileSync(path.join(SITE, 'icon-maskable-512.png'), png(512, 0.1));

// ---- report ----
const states = {};
data.clinics.forEach(c => { states[c.state] = (states[c.state] || 0) + 1; });
console.log(`Built ${data.clinics.length} clinics (data as of ${data.asOf}).`);
console.log('By state:', states);
console.log(problems.length ? 'Flagged for review:\n  ' + problems.join('\n  ') : 'No data problems found.');
