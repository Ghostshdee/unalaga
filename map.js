/* ═══════════════════════════════════════════════════════════════════
   Уналага.мн — map.js
   Чиглэлийн схем (Төлөвлөгөө Фаз 1.4). Бодит газрын зураг БИШ —
   22 аймгийн төвийг ойролцоо байрлалаар, жолоочийн чиглэлийг зураасаар.
   Газрын зургийн сан (Leaflet) 2G/3G-д хүнд тул Фаз 6 хүртэл хэрэглэхгүй.
   app.js, drivers.js-ийн ДАРАА ачаална (AIMAGS, DRIVERS, readPosts, el).
   ═══════════════════════════════════════════════════════════════════ */

/* Аймгийн төвийн ойролцоо уртраг, өргөрөг (схемд хангалттай нарийвчлал) */
const AIMAG_LONLAT = {
  'Улаанбаатар': [106.92, 47.92], 'Архангай': [101.45, 47.47], 'Баян-Өлгий': [89.97, 48.97],
  'Баянхонгор': [100.72, 46.19], 'Булган': [103.53, 48.81], 'Говь-Алтай': [96.26, 46.37],
  'Говьсүмбэр': [108.36, 46.36], 'Дархан-Уул': [105.95, 49.49], 'Дорноговь': [110.14, 44.89],
  'Дорнод': [114.53, 48.07], 'Дундговь': [106.27, 45.76], 'Завхан': [96.85, 47.73],
  'Орхон': [104.06, 49.03], 'Өвөрхангай': [102.78, 46.26], 'Өмнөговь': [104.42, 43.57],
  'Сүхбаатар': [113.28, 46.68], 'Сэлэнгэ': [106.21, 50.23], 'Төв': [106.3, 47.2],
  'Увс': [92.07, 49.98], 'Ховд': [91.64, 48.01], 'Хөвсгөл': [100.16, 49.63], 'Хэнтий': [110.66, 47.32]
};

/* Монгол улсын хилийн маш ойролцоо тойм — зөвхөн чиглүүлэх дэвсгэр */
const OUTLINE = [
  [87.75, 49.17], [88.9, 49.5], [90.0, 50.05], [91.4, 50.5], [92.3, 50.8], [94.2, 50.6],
  [95.1, 49.95], [97.3, 49.75], [98.2, 50.4], [97.9, 51.0], [98.9, 52.1], [100.0, 51.7],
  [102.0, 51.4], [102.3, 50.5], [103.7, 50.1], [105.9, 50.4], [106.9, 50.3], [108.5, 49.3],
  [110.7, 49.2], [111.9, 49.4], [114.4, 50.3], [116.7, 49.9], [115.5, 48.1], [117.8, 48.0],
  [119.9, 46.7], [118.0, 46.6], [116.2, 45.7], [114.5, 44.9], [112.6, 44.9], [111.3, 44.4],
  [111.9, 43.7], [110.4, 42.8], [107.7, 42.4], [105.0, 41.6], [104.5, 41.9], [100.8, 42.6],
  [96.3, 42.7], [95.3, 44.2], [93.5, 44.9], [90.9, 45.3], [90.6, 46.0], [91.0, 46.9],
  [90.3, 47.7], [88.9, 48.1], [88.0, 48.6]
];

/* Төв хэсэгт аймгууд ойрхон — давхцахгүйн тулд нэрийн байрлал: [dx, dy, зэрэгцүүлэлт].
   Жагсаалтад байхгүй аймгийн нэр цэгийн дээр голлоод гарна. */
const LABEL_POS = {
  'Улаанбаатар': [14, -12, 'start'], 'Төв': [-14, 26, 'end'], 'Дундговь': [0, 34, 'middle'],
  'Говьсүмбэр': [14, 8, 'start'], 'Булган': [-14, 8, 'end'], 'Дархан-Уул': [14, 8, 'start'],
  'Өвөрхангай': [0, 36, 'middle'], 'Баянхонгор': [-14, 8, 'end'], 'Говь-Алтай': [0, 36, 'middle'],
  'Сүхбаатар': [0, 36, 'middle']
};

/* Хот, сумын нэрийг аймагт буулгана: «Эрдэнэт» → Орхон, «Сэлэнгэ, Сайхан сум» → Сэлэнгэ */
const PLACE_ALIAS = { 'Эрдэнэт': 'Орхон', 'Дархан': 'Дархан-Уул' };

const SVG_NS = 'http://www.w3.org/2000/svg';
const K = 30;   /* 1 градус = 30 нэгж */

/* Өргөрөг ~47°-т уртраг 0.68 дахин богино — босоо тэнхлэгийг сунгаж хэлбэр хадгална */
function project(lonlat) {
  return [(lonlat[0] - 87) * K, (52.5 - lonlat[1]) * K * 1.47];
}

function toAimag(place) {
  const p = String(place || '').trim();
  if (PLACE_ALIAS[p]) return PLACE_ALIAS[p];
  if (AIMAG_LONLAT[p]) return p;
  return AIMAGS.find((a) => p.indexOf(a) === 0) || null;
}

function svgEl(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) node.setAttribute(k, attrs[k]);
  return node;
}

/* Чиглэлүүд: жолоочийн байнгын чиглэл + жолоочийн зар + миний зарууд.
   Буцаах: { "А|Б": { a, b, drivers: Set, posts: n } } — А, Б үсгийн дарааллаар */
function collectRoutes() {
  const routes = {};
  const add = (from, to, driverId) => {
    const a = toAimag(from), b = toAimag(to);
    if (!a || !b || a === b) return;
    const pair = [a, b].sort((x, y) => x.localeCompare(y, 'mn'));
    const key = pair.join('|');
    if (!routes[key]) routes[key] = { a: pair[0], b: pair[1], drivers: new Set(), posts: 0 };
    if (driverId) routes[key].drivers.add(driverId);
    else routes[key].posts++;
  };
  for (const d of DRIVERS) {
    for (const to of d.routes) add(d.home, to, d.id);
    for (const p of d.posts) add(p.from, p.to, d.id);
  }
  for (const p of readPosts()) add(p.from, p.to, null);
  return routes;
}

/* Аймаг бүрт хэдэн чиглэл холбогдсон */
function aimagWeights(routes) {
  const w = {};
  for (const key in routes) {
    const r = routes[key];
    w[r.a] = (w[r.a] || 0) + 1;
    w[r.b] = (w[r.b] || 0) + 1;
  }
  return w;
}

function drawMap(svg, routes, onPick) {
  const weights = aimagWeights(routes);

  svg.appendChild(svgEl('polygon', {
    class: 'map-land',
    points: OUTLINE.map((ll) => project(ll).join(',')).join(' ')
  }));

  const lines = svgEl('g', { class: 'map-routes' });
  for (const key in routes) {
    const r = routes[key];
    const [x1, y1] = project(AIMAG_LONLAT[r.a]);
    const [x2, y2] = project(AIMAG_LONLAT[r.b]);
    const count = r.drivers.size + r.posts;
    lines.appendChild(svgEl('line', {
      class: 'map-route', x1, y1, x2, y2,
      'data-a': r.a, 'data-b': r.b,
      'stroke-width': Math.min(10, 3 + count * 2)
    }));
  }
  svg.appendChild(lines);

  const dots = svgEl('g', { class: 'map-dots' });
  for (const name of AIMAGS) {
    const [x, y] = project(AIMAG_LONLAT[name]);
    const g = svgEl('g', {
      class: 'map-aimag' + (weights[name] ? ' has-routes' : ''),
      'data-aimag': name,
      tabindex: '0',
      role: 'button',
      'aria-label': name + (weights[name] ? ', ' + weights[name] + ' чиглэл' : ', чиглэл алга')
    });
    g.appendChild(svgEl('circle', { class: 'map-hit', cx: x, cy: y, r: 30 }));   /* хуруунд том талбай */
    g.appendChild(svgEl('circle', { class: 'map-dot', cx: x, cy: y, r: weights[name] ? 11 : 7 }));
    const pos = LABEL_POS[name] || [0, -18, 'middle'];
    const label = svgEl('text', { class: 'map-label', x: x + pos[0], y: y + pos[1], 'text-anchor': pos[2] });
    label.textContent = name;
    g.appendChild(label);
    g.addEventListener('click', () => onPick(name));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(name); }
    });
    dots.appendChild(g);
  }
  svg.appendChild(dots);
}

/* Сонгосон аймгийн жолооч, чиглэлийг схемийн доор харуулна */
function renderPicked(name, routes) {
  const box = document.getElementById('mapPicked');
  box.textContent = '';

  for (const g of document.querySelectorAll('.map-aimag')) {
    g.classList.toggle('is-picked', g.dataset.aimag === name);
  }
  for (const line of document.querySelectorAll('.map-route')) {
    line.classList.toggle('is-picked', line.dataset.a === name || line.dataset.b === name);
  }

  const sel = document.getElementById('mapAimag');
  if (sel.value !== name) sel.value = name;

  const mine = Object.values(routes).filter((r) => r.a === name || r.b === name);
  box.appendChild(el('h2', 'profile-h2', name));

  if (!mine.length) {
    box.appendChild(el('p', 'profile-empty', 'Энэ аймаг руу явдаг жолооч одоогоор алга.'));
    const a = el('a', 'btn btn-primary', 'Захиалга үүсгэх');
    a.href = 'index.html#order';
    box.appendChild(a);
    return;
  }

  const ul = el('ul', 'map-list');
  for (const r of mine) {
    const other = r.a === name ? r.b : r.a;
    const li = el('li', 'map-item');
    li.appendChild(el('span', 'driver-route-city', name + ' — ' + other));
    const parts = [];
    if (r.drivers.size) parts.push(r.drivers.size + ' жолооч');
    if (r.posts) parts.push(r.posts + ' миний зар');
    li.appendChild(el('span', 'map-item-meta', parts.join(' · ')));
    ul.appendChild(li);
  }
  box.appendChild(ul);

  const drivers = new Set();
  for (const r of mine) r.drivers.forEach((id) => drivers.add(id));
  if (drivers.size) {
    const a = el('a', 'btn btn-primary', name + ' руу явдаг ' + drivers.size + ' жолооч');
    a.href = 'drivers.html?aimag=' + encodeURIComponent(name);
    box.appendChild(a);
  }
}

function initMap() {
  const svg = document.getElementById('mapSvg');
  if (!svg) return;

  const routes = collectRoutes();
  const pick = (name) => renderPicked(name, routes);
  drawMap(svg, routes, pick);

  /* Жижиг дэлгэцэнд цэгт хуруу тааруулахад хэцүү — жагсаалтаас ч сонгоно */
  const sel = document.getElementById('mapAimag');
  const weights = aimagWeights(routes);
  for (const name of AIMAGS) {
    const opt = el('option', null, name + (weights[name] ? ' (' + weights[name] + ')' : ''));
    opt.value = name;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => { if (sel.value) pick(sel.value); });

  document.getElementById('mapCount').textContent =
    Object.keys(routes).length + ' чиглэл · ' + Object.keys(weights).length + ' аймаг';

  pick('Улаанбаатар');
}

document.addEventListener('DOMContentLoaded', initMap);
