/* ═══════════════════════════════════════════════════════════════════
   Уналага.мн — drivers.js
   «Жолооч хайх» хуудас (CLAUDE.md §6 «Замын зураг» 4).
   Зөвхөн drivers.html ачаална. app.js-ийн AIMAGS, el(), normalize()-ийг
   ашиглана — тиймээс app.js-ийн ДАРАА холбогдоно.
   ═══════════════════════════════════════════════════════════════════ */

/* Жишээ жолооч нар. Эхний 5 нь нүүр хуудасны зартай ижил хүмүүс —
   үнэлгээ, аялал, машин нь тэнцүү байх ёстой. Сервер ирэхэд
   CLAUDE.md §5-ийн drivers + vehicles хүснэгтээс ирнэ. */
const DRIVERS = [
  {
    name: 'Болд Дорж', verified: true, rating: 4.8, trips: 124,
    car: 'Toyota Prius 2019', type: 'sedan', seats: 4, livestockBox: false,
    home: 'Улаанбаатар', routes: ['Хөвсгөл', 'Булган', 'Орхон'], offers: 1
  },
  {
    name: 'Бат-Эрдэнэ Энхбат', verified: true, rating: 4.9, trips: 45,
    car: 'Hyundai Porter 2018', type: 'pickup', seats: 2, livestockBox: true,
    home: 'Улаанбаатар', routes: ['Архангай', 'Өвөрхангай'], offers: 1
  },
  {
    name: 'Ганбаатар Мөнх', verified: true, rating: 4.7, trips: 89,
    car: 'Mitsubishi Delica 2020', type: 'van', seats: 7, livestockBox: false,
    home: 'Улаанбаатар', routes: ['Дархан-Уул', 'Сэлэнгэ'], offers: 1
  },
  {
    name: 'Энхбаяр Ууганбаяр', verified: false, rating: 4.6, trips: 31,
    car: 'Hyundai Starex 2017', type: 'van', seats: 11, livestockBox: false,
    home: 'Улаанбаатар', routes: ['Баян-Өлгий', 'Ховд', 'Увс'], offers: 1
  },
  {
    name: 'Эрдэнэбат Сайнбаяр', verified: false, rating: 0, trips: 0,
    car: 'Kia Bongo 2019', type: 'pickup', seats: 2, livestockBox: false,
    home: 'Улаанбаатар', routes: ['Өвөрхангай'], offers: 1
  },
  {
    name: 'Мөнх-Очир Батсүх', verified: true, rating: 4.9, trips: 212,
    car: 'УАЗ 452 2012', type: 'van', seats: 8, livestockBox: false,
    home: 'Дундговь', routes: ['Улаанбаатар', 'Өмнөговь', 'Дорноговь'], offers: 0
  },
  {
    name: 'Лхагвасүрэн Дамдин', verified: true, rating: 4.5, trips: 67,
    car: 'Howo 2016 · 10 тонн', type: 'truck', seats: 2, livestockBox: true,
    home: 'Завхан', routes: ['Улаанбаатар', 'Говь-Алтай'], offers: 0
  },
  {
    name: 'Сарангэрэл Түвшин', verified: false, rating: 4.8, trips: 12,
    car: 'Toyota Land Cruiser 2008', type: 'sedan', seats: 6, livestockBox: false,
    home: 'Хэнтий', routes: ['Улаанбаатар', 'Дорнод', 'Сүхбаатар'], offers: 0
  }
];

const CAR_TYPES = {
  sedan: 'Суудлын',
  van: 'Микро',
  pickup: 'Портер, Бонго',
  truck: 'Ачааны машин'
};

/* «4.8 ★ · 124 аялал» эсвэл «Шинэ гишүүн» чип (DESIGN §6) */
function driverMeta(d) {
  const meta = el('p', 'person-meta');
  if (!d.trips) {
    meta.appendChild(el('span', 'chip-new', 'Шинэ гишүүн'));
    return meta;
  }
  meta.appendChild(el('span', 'rating', d.rating.toFixed(1)));
  meta.appendChild(document.createTextNode(' '));
  const star = el('span', 'star', '★');
  star.setAttribute('aria-hidden', 'true');
  meta.appendChild(star);
  meta.appendChild(document.createTextNode(' · ' + d.trips + ' аялал'));
  return meta;
}

/* Жолоочийн карт — «хэн» гол, чиглэл нь дэд (зарын картаас эсрэг) */
function createDriverCard(d) {
  const card = el('article', 'driver-card');

  const head = el('div', 'post-person driver-head');
  const avatar = el('span', 'person-avatar', d.name.charAt(0));
  avatar.setAttribute('aria-hidden', 'true');
  const main = el('div', 'person-main');
  const name = el('p', 'person-name', d.name + ' ');
  if (d.verified) {
    const v = el('span', 'verified');
    v.title = 'Баталгаажсан';
    v.setAttribute('aria-label', 'Баталгаажсан');
    v.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';
    name.appendChild(v);
  }
  main.appendChild(name);
  main.appendChild(driverMeta(d));
  head.appendChild(avatar);
  head.appendChild(main);
  card.appendChild(head);

  /* Машин */
  const car = el('div', 'driver-car');
  car.appendChild(el('p', 'driver-car-name', d.car));
  const facts = el('p', 'driver-car-facts',
    CAR_TYPES[d.type] + ' · ' + d.seats + ' суудал');
  car.appendChild(facts);
  if (d.livestockBox) car.appendChild(el('span', 'badge badge-livestock', 'Малын хайрцагтай'));
  card.appendChild(car);

  /* Байнга явдаг чиглэл — чиглэлийн шугам зөвхөн зарын картад (DESIGN §1) */
  const routes = el('div', 'driver-routes');
  routes.appendChild(el('p', 'driver-label', 'Байнга явдаг чиглэл'));
  const ul = el('ul', 'driver-route-list');
  for (const to of d.routes) {
    const li = el('li', 'driver-route');
    li.appendChild(el('span', 'driver-route-city', d.home));
    li.appendChild(document.createTextNode(' — '));
    li.appendChild(el('span', 'driver-route-city', to));
    ul.appendChild(li);
  }
  routes.appendChild(ul);
  card.appendChild(routes);

  const foot = el('div', 'driver-foot');
  foot.appendChild(el('span', 'driver-offers',
    d.offers ? d.offers + ' идэвхтэй зар' : 'Одоогоор зар алга'));
  const btn = el('button', 'btn btn-contact', 'Холбогдох');
  btn.type = 'button';
  foot.appendChild(btn);
  card.appendChild(foot);

  return card;
}

/* Шүүлтүүрийн утга → тохирох жолооч, эрэмбэлсэн */
function filterDrivers() {
  const aimag = document.getElementById('dAimag').value;
  const type = document.getElementById('dType').value;
  const onlyVerified = document.getElementById('dVerified').checked;
  const sort = document.getElementById('dSort').value;
  const input = document.getElementById('searchInput');
  const words = input ? normalize(input.value).split(' ').filter(Boolean) : [];

  const list = DRIVERS.filter((d) => {
    const places = [d.home].concat(d.routes);
    const text = normalize([d.name, d.car, CAR_TYPES[d.type]].concat(places).join(' '));
    return (aimag === 'all' || places.indexOf(aimag) !== -1) &&
           (type === 'all' || d.type === type) &&
           (!onlyVerified || d.verified) &&
           words.every((w) => text.indexOf(w) !== -1);
  });

  /* Шинэ гишүүн (үнэлгээгүй) үргэлж төгсгөлд — «0 үнэлгээ» доогуур биш,
     зүгээр л харьцуулах өгөгдөл алга (DESIGN §6) */
  list.sort((a, b) => {
    if (!a.trips !== !b.trips) return a.trips ? -1 : 1;
    if (sort === 'trips') return b.trips - a.trips;
    return b.rating - a.rating || b.trips - a.trips;
  });
  return list;
}

function renderDrivers() {
  const box = document.querySelector('.driver-list');
  if (!box) return;

  const list = filterDrivers();
  box.textContent = '';
  const frag = document.createDocumentFragment();
  for (const d of list) frag.appendChild(createDriverCard(d));
  box.appendChild(frag);

  const countText = list.length + ' жолооч олдлоо';
  document.getElementById('driverCount').textContent = countText;
  document.getElementById('driverEmpty').hidden = list.length > 0;

  const searchCount = document.getElementById('searchCount');
  const input = document.getElementById('searchInput');
  if (searchCount) searchCount.textContent = input && input.value.trim() ? countText : '';
}

function clearDriverFilters() {
  document.getElementById('dAimag').value = 'all';
  document.getElementById('dType').value = 'all';
  document.getElementById('dVerified').checked = false;
  document.getElementById('dSort').value = 'rating';
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  renderDrivers();
}

function initDrivers() {
  if (!document.querySelector('.driver-list')) return;

  /* Аймгийн жагсаалт — modal-той нэг эх сурвалж (app.js AIMAGS) */
  const aimag = document.getElementById('dAimag');
  for (const name of AIMAGS) {
    const opt = el('option', null, name);
    opt.value = name;
    aimag.appendChild(opt);
  }

  for (const id of ['dAimag', 'dType', 'dVerified', 'dSort']) {
    document.getElementById(id).addEventListener('change', renderDrivers);
  }
  document.getElementById('driverClear').addEventListener('click', clearDriverFilters);

  /* Header-ийн хайлт — app.js нь .post-list байхгүй үед энэ event-ийг илгээнэ */
  document.addEventListener('unalaga:search', renderDrivers);

  renderDrivers();
}

document.addEventListener('DOMContentLoaded', initDrivers);
