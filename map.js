/* ═══════════════════════════════════════════════════════════════════
   Уналага.мн — map.js
   Чиглэлийн схем (Төлөвлөгөө Фаз 1.4). Бодит газрын зураг БИШ —
   22 аймгийн төвийг ойролцоо байрлалаар, жолоочийн чиглэлийг зураасаар.
   Одоохондоо SVG схем; өгөгдлийн хэсгийг дараагийн зурагт ашиглана.
   db.js, app.js-ийн ДАРАА ачаална (AIMAGS, el).
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

/* Бодит заруудыг дугаар, хугацаагаар шүүнэ. Чиг ба үүрэг тусдаа түлхүүртэй. */
function collectRoutes(rows, now = Date.now()) {
  const routes = {};
  const ads = [], seen = new Set();
  const add = (from, to, ad) => {
    const a = toAimag(from), b = toAimag(to);
    if (!a || !b || a === b) return;
    const key = JSON.stringify([a, b, ad.role]);
    if (!routes[key]) routes[key] = { a, b, role: ad.role, ads: [] };
    routes[key].ads.push(ad);
  };
  for (const row of rows) {
    if (!row || !row.id || seen.has(row.id)) continue;
    seen.add(row.id);
    const departure = Date.parse(row.depart_date + 'T' + (row.depart_time || '23:59:59') + '+08:00');
    if (!Number.isFinite(departure) || departure < now || (row.status && row.status !== 'active')) continue;
    const ad = { row, id: row.id, from: row.from_loc || '', to: row.to_loc || '', role: row.role,
      a: toAimag(row.from_loc), b: toAimag(row.to_loc) };
    ads.push(ad);
    add(ad.from, ad.to, ad);
  }
  return { ads, routes };
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
    const count = r.ads.length;
    /* Эсрэг чиглэлийн нумууд хоёр талд гарна. Үүргүүд ч давхцахгүй. */
    const length = Math.hypot(x2 - x1, y2 - y1);
    const bend = r.role === 'driver' ? 16 : 32;
    const cx = (x1 + x2) / 2 - (y2 - y1) / length * bend;
    const cy = (y1 + y2) / 2 + (x2 - x1) / length * bend;
    const line = svgEl('path', {
      class: 'map-route' + (r.role === 'driver' ? '' : ' map-route-request'),
      d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, fill: 'none',
      'data-a': r.a, 'data-b': r.b,
      'stroke-width': Math.min(10, 3 + count * 2)
    });
    const title = svgEl('title', {});
    title.textContent = r.a + ' → ' + r.b + ': ' + (r.role === 'driver' ? 'Жолооч' : 'Тээвэр хайгч') + ', ' + count + ' зар';
    line.appendChild(title);
    line.setAttribute('tabindex', '0');
    line.setAttribute('role', 'button');
    line.setAttribute('aria-label', title.textContent);
    const choose = () => onPick(r.a, r.b);
    line.addEventListener('click', choose);
    line.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
    });
    lines.appendChild(line);
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

/* Сонгосон аймгийн бодит зарыг чиг, үүрэгтэй нь жагсаана. */
function renderPicked(name, data, quick, direction, onRoute) {
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
  document.getElementById('mapTo').value = direction ? toAimag(direction.to) || '' : '';

  const mine = data.ads.filter((ad) => direction
    ? routeMatches(ad, direction.from, direction.to)
    : quick
    ? ((ad.a === 'Улаанбаатар' && ad.b === 'Дархан-Уул') || (ad.b === 'Улаанбаатар' && ad.a === 'Дархан-Уул'))
    : (!name || ad.a === name || ad.b === name));
  document.getElementById('mapCount').textContent = 'Сүүлийн 100 зараас: ' + mine.length + ' зар';
  box.appendChild(el('h2', 'profile-h2', direction ? direction.from + ' → ' + direction.to : quick ? 'УБ ⇄ Дархан' : name || 'Бүх чиглэл'));

  const add = el('a', 'btn btn-primary', 'Энэ чиглэлд зар оруулах');
  add.href = orderRouteUrl(direction ? direction.from : name, direction ? direction.to : '');
  box.appendChild(add);

  if (!mine.length) {
    box.appendChild(el('p', 'profile-empty', 'Энэ чиглэлд одоогоор зар алга. Та зар оруулбал жолооч, зорчигч харах болно.'));
    return;
  }

  const ul = el('ul', 'map-list');
  for (const r of mine) {
    const li = el('li', 'map-item');
    li.dataset.adId = r.id;
    const choose = el('button', 'btn btn-ghost map-route-choice', r.from + ' → ' + r.to);
    choose.type = 'button';
    choose.addEventListener('click', () => onRoute(r.from, r.to));
    li.appendChild(choose);
    li.appendChild(el('span', r.role === 'driver' ? 'badge badge-passenger' : 'badge badge-request',
      r.role === 'driver' ? 'Жолооч' : 'Тээвэр хайгч'));
    if (!r.a || !r.b || r.a === r.b) li.appendChild(el('span', 'map-item-meta', 'Схемд байрлуулаагүй'));
    ul.appendChild(li);
  }
  box.appendChild(ul);
  const cards = el('div', 'map-cards');
  for (const ad of mine) cards.appendChild(createPost(dbRowToPost(ad.row)));
  box.appendChild(cards);
}

/* Мэдэгдэх аймгийн нэрийг нэгтгэнэ; бусад газрын бүтэн нэрийг хэвээр тааруулна. */
function routeMatches(ad, from, to) {
  return (ad.a || ad.from) === (toAimag(from) || from) &&
    (ad.b || ad.to) === (toAimag(to) || to);
}

function orderRouteUrl(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return 'index.html' + (params.size ? '?' + params : '') + '#order';
}

/* Өгөгдөл авах хэсэг SVG-ээс хамаарахгүй. */
async function loadMapData() {
  try {
    const rows = await dbListAds();
    const saved = writeAdsCache(rows);
    return { ...collectRoutes(rows), state: 'ready', saved };
  } catch (error) {
    const cache = readAdsCache();
    if (Number.isFinite(cache.savedAt) && cache.savedAt > 0) {
      return { ...collectRoutes(cache.ads), state: 'stale', savedAt: cache.savedAt };
    }
    return { ...collectRoutes([]), state: 'error', error };
  }
}

function initMap() {
  const svg = document.getElementById('mapSvg');
  if (!svg) return;

  const box = document.getElementById('mapPicked');
  const notice = document.getElementById('mapStatus');
  const count = document.getElementById('mapCount');
  let data, quick = false, direction = null;
  const pick = (name, to) => { quick = false; direction = to ? { from: name, to } : null; sel.value = name; render(); };
  const pickRoute = (from, to) => { direction = { from, to }; quick = false; render(); };

  /* Жижиг дэлгэцэнд цэгт хуруу тааруулахад хэцүү — жагсаалтаас ч сонгоно */
  const sel = document.getElementById('mapAimag');
  const destination = document.getElementById('mapTo');
  for (const name of AIMAGS) {
    const opt = el('option', null, name);
    opt.value = name;
    sel.appendChild(opt);
    const end = el('option', null, name);
    end.value = name;
    destination.appendChild(end);
  }
  sel.addEventListener('change', () => pick(sel.value));
  destination.addEventListener('change', () => {
    if (sel.value && destination.value) pickRoute(sel.value, destination.value);
    else pick(sel.value);
  });
  document.getElementById('mapQuick').addEventListener('click', () => { direction = null; quick = !quick; sel.value = ''; render(); });
  function render() {
    svg.textContent = '';
    drawMap(svg, data.routes, pick);
    document.getElementById('mapQuick').setAttribute('aria-pressed', String(quick));
    box.textContent = ''; notice.textContent = '';
    box.setAttribute('aria-busy', String(data.state === 'loading'));
    if (data.state === 'loading') {
      count.textContent = 'Зар ачаалж байна';
      const skeleton = el('div', 'driver-skeleton', '');
      skeleton.setAttribute('aria-hidden', 'true');
      skeleton.appendChild(el('div', 'skel skel-line', ''));
      box.appendChild(skeleton);
      return;
    }
    if (data.state === 'error' || data.state === 'stale') {
      notice.appendChild(el('p', null, data.state === 'stale'
        ? 'Хуучин хадгалсан хуулбар: ' + Math.max(0, Math.floor((Date.now() - data.savedAt) / 60000)) + ' минутын өмнөх мэдээлэл. Одоогийн зар өөрчлөгдсөн байж болно.'
        : dbErrorMessage(data.error, 'Зар татаж чадсангүй. Дахин оролдоно уу.')));
      const retry = el('button', 'btn btn-ghost', 'Дахин оролдох');
      retry.type = 'button'; retry.addEventListener('click', load);
      notice.appendChild(retry);
    } else if (!data.saved) notice.textContent = 'Энэ хөтөчид хуулбар хадгалж чадсангүй. Холболт тасарвал мэдээллийг дахин татах шаардлагатай.';
    if (data.state === 'error') { count.textContent = 'Зарын тоо тодорхойгүй'; return; }
    renderPicked(sel.value, data, quick, direction, pickRoute);
  }
  async function load() {
    data = { ...collectRoutes([]), state: 'loading' }; render();
    data = await loadMapData(); render();
  }
  load();
}

document.addEventListener('DOMContentLoaded', initMap);
