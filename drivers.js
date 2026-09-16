/* ═══════════════════════════════════════════════════════════════════
   Уналага.мн — drivers.js
   «Жолооч хайх» хуудас (CLAUDE.md §6 «Замын зураг» 4).
   drivers.html, driver.html ачаална. app.js-ийн AIMAGS, el(), normalize()-ийг
   ашиглана — тиймээс app.js-ийн ДАРАА холбогдоно.
   ═══════════════════════════════════════════════════════════════════ */

/* Жишээ жолооч нар. Эхний 5 нь нүүр хуудасны зартай ижил хүмүүс —
   үнэлгээ, аялал, машин, зар нь тэнцүү байх ёстой. Сервер ирэхэд
   CLAUDE.md §5-ийн drivers + vehicles + reviews хүснэгтээс ирнэ.

   phone — «0000-…» гэж санаатай хуурамч: залгасан ч хэнд ч очихгүй.
   Хуудсан дээр «Жишээ дугаар» гэж бичигдэнэ. Бодит дугаар ХЭЗЭЭ Ч бүү оруул.
   plate — зөвхөн үсэг хэсэг (итгэлд хангалттай, хувийн мэдээлэл биш).
   posts — идэвхтэй зар, app.js createPost()-ийн хэлбэрээр. ago = хэдэн минутын өмнө. */
const DRIVERS = [
  {
    id: 'bold-dorj', name: 'Болд Дорж', verified: true, rating: 4.8, trips: 124,
    car: 'Toyota Prius 2019', type: 'sedan', veh: 'veh-sedan', seats: 4, livestockBox: false, plate: 'УБА',
    home: 'Улаанбаатар', routes: ['Хөвсгөл', 'Булган', 'Орхон'],
    phone: '0000-0001', since: 2021, reply: '1 цагийн дотор',
    posts: [{ kind: 'passenger', from: 'Улаанбаатар', to: 'Хөвсгөл', gap: '≈ 670 км · 10 цаг',
      date: '2026-04-27', time: '08:00', seats: 3, price: 45000, ago: 2 }],
    reviews: [
      { name: 'Оюунчимэг', stars: 5, when: '2026 оны 8-р сар', text: 'Цагтаа хөдөлсөн, замдаа 2 удаа амрав. Машин цэвэрхэн.' },
      { name: 'Ганхуяг', stars: 5, when: '2026 оны 7-р сар', text: 'Ачааг гэрийн үүдэнд хүргэж өгсөн. Дахин явна.' },
      { name: 'Номин', stars: 4, when: '2026 оны 6-р сар', text: 'Сайн жолоодсон. 30 минут хоцорч хөдөлсөн.' }
    ]
  },
  {
    id: 'bat-erdene', name: 'Бат-Эрдэнэ Энхбат', verified: true, rating: 4.9, trips: 45,
    car: 'Hyundai Porter 2018', type: 'pickup', veh: 'veh-pickup', seats: 2, livestockBox: true, plate: 'АРА',
    home: 'Улаанбаатар', routes: ['Архангай', 'Өвөрхангай'],
    phone: '0000-0002', since: 2023, reply: '3 цагийн дотор',
    posts: [{ kind: 'livestock', from: 'Улаанбаатар', to: 'Архангай', gap: '≈ 455 км · 7 цаг',
      date: '2026-04-28', time: '06:00', capacityText: '5 хонь, 2 ямаа эсвэл 1 үхэр', price: 80000,
      vehicleName: 'Hyundai Porter 2018 · малын хайрцагтай', ago: 180 }],
    reviews: [
      { name: 'Цогтбаатар', stars: 5, when: '2026 оны 8-р сар', text: 'Хонинуудыг зөөлөн ачиж буулгасан. Хайрцаг нь бат бөх.' },
      { name: 'Энхтуяа', stars: 5, when: '2026 оны 5-р сар', text: 'Үнээ сайн хүргэсэн, замдаа ус өгсөн.' }
    ]
  },
  {
    id: 'ganbaatar', name: 'Ганбаатар Мөнх', verified: true, rating: 4.7, trips: 89,
    car: 'Mitsubishi Delica 2020', type: 'van', veh: 'veh-van', seats: 7, livestockBox: false, plate: 'УНА',
    home: 'Улаанбаатар', routes: ['Дархан-Уул', 'Сэлэнгэ'],
    phone: '0000-0003', since: 2022, reply: '1 цагийн дотор',
    posts: [{ kind: 'cargo', from: 'Улаанбаатар', to: 'Дархан', gap: '≈ 220 км · 3 цаг',
      date: '2026-04-27', time: '06:30', capacityText: '500 кг ачаа, 5 суудал үлдсэн',
      priceLines: ['Хүн 25 000 ₮', 'Бараа 30 000 ₮'], ago: 60 }],
    reviews: [
      { name: 'Мөнхзул', stars: 5, when: '2026 оны 8-р сар', text: 'Дэлгүүрийн бараагаа бүгдийг нь бүтэн хүргэсэн.' },
      { name: 'Батбаяр', stars: 4, when: '2026 оны 7-р сар', text: 'Машин дүүрэн байсан ч эвтэйхэн суусан.' }
    ]
  },
  {
    id: 'enkhbayar', name: 'Энхбаяр Ууганбаяр', verified: false, rating: 4.6, trips: 31,
    car: 'Hyundai Starex 2017', type: 'van', veh: 'veh-van', seats: 11, livestockBox: false, plate: 'БӨА',
    home: 'Улаанбаатар', routes: ['Баян-Өлгий', 'Ховд', 'Увс'],
    phone: '0000-0004', since: 2024, reply: 'Өдөртөө',
    posts: [{ kind: 'passenger', from: 'Улаанбаатар', to: 'Баян-Өлгий', gap: '≈ 1640 км · 26 цаг',
      date: '2026-04-30', time: '07:00', seats: 6, price: 120000, ago: 480 }],
    reviews: [
      { name: 'Айдос', stars: 5, when: '2026 оны 8-р сар', text: 'Урт замд тайван, найдвартай явсан.' },
      { name: 'Сэрээтэр', stars: 4, when: '2026 оны 6-р сар', text: 'Сайн. Хөдлөх цагаа урьдчилж мэдэгдвэл илүү дээр.' }
    ]
  },
  {
    id: 'erdenebat', name: 'Эрдэнэбат Сайнбаяр', verified: false, rating: 0, trips: 0,
    car: 'Kia Bongo 2019', type: 'pickup', veh: 'veh-pickup', seats: 2, livestockBox: false, plate: 'ӨВА',
    home: 'Улаанбаатар', routes: ['Өвөрхангай'],
    phone: '0000-0005', since: 2026, reply: 'Өдөртөө',
    posts: [{ kind: 'cargo', from: 'Улаанбаатар', to: 'Өвөрхангай', gap: '≈ 430 км · 6 цаг',
      date: '2026-04-29', time: '07:00', capacityText: '1 тонн бараа, 2 суудал хоосон',
      priceLines: ['Бараа 60 000 ₮', 'Хүн 35 000 ₮'], ago: 720 }],
    reviews: []
  },
  {
    id: 'munkh-ochir', name: 'Мөнх-Очир Батсүх', verified: true, rating: 4.9, trips: 212,
    car: 'УАЗ 452 2012', type: 'van', veh: 'veh-van', seats: 8, livestockBox: false, plate: 'ДУА',
    home: 'Дундговь', routes: ['Улаанбаатар', 'Өмнөговь', 'Дорноговь'],
    phone: '0000-0006', since: 2019, reply: '1 цагийн дотор',
    posts: [],
    reviews: [
      { name: 'Туяа', stars: 5, when: '2026 оны 8-р сар', text: 'Шороон замд ч найдвартай. Говийн замыг сайн мэднэ.' },
      { name: 'Даваасүрэн', stars: 5, when: '2026 оны 8-р сар', text: 'Сумын төвөөс гэрт хүртэл хүргэсэн.' }
    ]
  },
  {
    id: 'lkhagvasuren', name: 'Лхагвасүрэн Дамдин', verified: true, rating: 4.5, trips: 67,
    car: 'Howo 2016 · 10 тонн', type: 'truck', veh: 'veh-pickup', seats: 2, livestockBox: true, plate: 'ЗАА',
    home: 'Завхан', routes: ['Улаанбаатар', 'Говь-Алтай'],
    phone: '0000-0007', since: 2020, reply: 'Өдөртөө',
    posts: [],
    reviews: [
      { name: 'Бямбадорж', stars: 5, when: '2026 оны 7-р сар', text: '5 ханатай гэрийг бүтнээр нь нүүлгэсэн.' },
      { name: 'Алтанцэцэг', stars: 4, when: '2026 оны 5-р сар', text: 'Сайн ч утсаа заримдаа авдаггүй.' }
    ]
  },
  {
    id: 'sarangerel', name: 'Сарангэрэл Түвшин', verified: false, rating: 4.8, trips: 12,
    car: 'Toyota Land Cruiser 2008', type: 'sedan', veh: 'veh-sedan', seats: 6, livestockBox: false, plate: 'ХЭА',
    home: 'Хэнтий', routes: ['Улаанбаатар', 'Дорнод', 'Сүхбаатар'],
    phone: '0000-0008', since: 2025, reply: '3 цагийн дотор',
    posts: [],
    reviews: [
      { name: 'Золзаяа', stars: 5, when: '2026 оны 8-р сар', text: 'Хүүхэдтэй явахад их тохь тухтай байсан.' }
    ]
  }
];

const CAR_TYPES = {
  sedan: 'Суудлын',
  van: 'Микро',
  pickup: 'Портер, Бонго',
  truck: 'Ачааны машин'
};

function driverUrl(d) {
  return 'driver.html?id=' + encodeURIComponent(d.id);
}

/* «Холбогдох» — утсаар шууд залгана (tel:). Хөдөөд хамгийн ойлгомжтой. */
function callButton(d, label) {
  const a = el('a', 'btn btn-contact', label);
  a.href = 'tel:' + d.phone.replace(/\D/g, '');
  a.setAttribute('aria-label', label + ': ' + d.name + ', ' + d.phone + ' (жишээ дугаар)');
  return a;
}

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
  const name = el('p', 'person-name');
  const link = el('a', 'person-link', d.name);
  link.href = driverUrl(d);
  name.appendChild(link);
  name.appendChild(document.createTextNode(' '));
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
    d.posts.length ? d.posts.length + ' идэвхтэй зар' : 'Одоогоор зар алга'));
  foot.appendChild(callButton(d, 'Холбогдох'));
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

  const q = new URLSearchParams(location.search).get('q');
  const input = document.getElementById('searchInput');
  if (q && input) input.value = q;

  renderDrivers();
}

document.addEventListener('DOMContentLoaded', initDrivers);
