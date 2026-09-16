/* ═══════════════════════════════════════════════════════════════════
   Уналага.мн — driver.js
   Жолоочийн дэлгэрэнгүй хуудас (CLAUDE.md §6 «Замын зураг» 5).
   driver.html?id=bold-dorj — app.js, drivers.js-ийн ДАРАА ачаална
   (DRIVERS, CAR_TYPES, driverMeta, callButton, createPost, el ашиглана).
   ═══════════════════════════════════════════════════════════════════ */

function findDriver() {
  const id = new URLSearchParams(location.search).get('id');
  return DRIVERS.find((d) => d.id === id) || null;
}

/* Хэсгийн гарчиг — h2 */
function section(title, cls) {
  const box = el('section', 'profile-section' + (cls ? ' ' + cls : ''));
  box.appendChild(el('h2', 'profile-h2', title));
  return box;
}

/* Дээд хэсэг: хэн, итгэл, залгах товч (DESIGN §6) */
function renderIntro(d) {
  const card = el('div', 'profile-card');

  const head = el('div', 'profile-head');
  const avatar = el('span', 'person-avatar profile-avatar', d.name.charAt(0));
  avatar.setAttribute('aria-hidden', 'true');
  const main = el('div', 'person-main');
  const h1 = el('h1', 'profile-name', d.name);
  if (d.verified) {
    /* NBSP — ✓ нэрийн сүүлийн үгээс салж дангаараа мөрөнд унахгүй */
    h1.appendChild(document.createTextNode('\u00A0'));
    const v = el('span', 'verified');
    v.title = 'Баталгаажсан';
    v.setAttribute('aria-label', 'Баталгаажсан');
    v.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';
    h1.appendChild(v);
  }
  main.appendChild(h1);
  main.appendChild(driverMeta(d));
  head.appendChild(avatar);
  head.appendChild(main);
  card.appendChild(head);

  /* Итгэлийн мэдээлэл — өнгө биш, текстээр (DESIGN §11) */
  const trust = el('ul', 'trust-list');
  const items = [
    [d.verified ? 'ok' : 'no', d.verified ? 'Жолооны үнэмлэх шалгасан' : 'Үнэмлэх хараахан шалгаагүй'],
    ['info', d.since + ' оноос гишүүн'],
    ['info', 'Ихэвчлэн ' + d.reply.charAt(0).toLowerCase() + d.reply.slice(1) + ' хариулдаг']
  ];
  for (const item of items) {
    const li = el('li', 'trust-item trust-' + item[0], item[1]);
    trust.appendChild(li);
  }
  card.appendChild(trust);

  /* Залгах — бүтэн өргөн, дугаар нь товчон дээр (хөдөөд хамгийн ойлгомжтой) */
  const call = callButton(d, 'Залгах · ' + d.phone);
  call.classList.add('profile-call');
  card.appendChild(call);
  card.appendChild(el('p', 'profile-note', 'Жишээ дугаар — бодит холболт биш.'));

  return card;
}

function renderCar(d) {
  const box = section('Машин');
  const car = el('div', 'driver-car');
  car.appendChild(el('p', 'driver-car-name', d.car));
  car.appendChild(el('p', 'driver-car-facts', CAR_TYPES[d.type] + ' · ' + d.seats + ' суудал'));
  if (d.livestockBox) car.appendChild(el('span', 'badge badge-livestock', 'Малын хайрцагтай'));
  box.appendChild(car);
  /* Улсын дугаарын үсэг л — бүтэн дугаар хувийн мэдээлэл */
  box.appendChild(el('p', 'profile-plate', 'Улсын дугаар: •••• ' + d.plate));

  box.appendChild(el('p', 'driver-label profile-label', 'Байнга явдаг чиглэл'));
  const ul = el('ul', 'driver-route-list');
  for (const to of d.routes) {
    const li = el('li', 'driver-route');
    li.appendChild(el('span', 'driver-route-city', d.home));
    li.appendChild(document.createTextNode(' — '));
    li.appendChild(el('span', 'driver-route-city', to));
    ul.appendChild(li);
  }
  box.appendChild(ul);
  return box;
}

/* Идэвхтэй зарууд — нүүр хуудасны картаар, нэрийг давтахгүй */
function renderPosts(d) {
  const box = section('Идэвхтэй зар' + (d.posts.length ? ' (' + d.posts.length + ')' : ''));
  if (!d.posts.length) {
    box.appendChild(el('p', 'profile-empty', 'Одоогоор идэвхтэй зар алга. Залгаад чиглэлээ тохирч болно.'));
    return box;
  }
  const list = el('div', 'post-list profile-posts');
  for (const p of d.posts) {
    const post = Object.assign({}, p, {
      id: d.id + '-' + p.to,
      role: 'driver',
      createdAt: Date.now() - p.ago * 60000,
      vehicle: { veh: d.veh, name: p.vehicleName || d.car },
      hidePerson: true
    });
    list.appendChild(createPost(post));
  }
  box.appendChild(list);
  return box;
}

/* «★★★★☆» — дэлгэц уншигчид «5-аас 4» гэж уншуулна */
function stars(n) {
  const span = el('span', 'review-stars', '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n));
  span.setAttribute('role', 'img');
  span.setAttribute('aria-label', '5-аас ' + n);
  return span;
}

function renderReviews(d) {
  const box = section('Сэтгэгдэл');
  if (!d.trips) {
    box.appendChild(el('p', 'profile-empty', 'Шинэ гишүүн — одоогоор сэтгэгдэл алга.'));
    return box;
  }

  const summary = el('div', 'review-summary');
  summary.appendChild(el('span', 'review-score', d.rating.toFixed(1)));
  const star = el('span', 'star review-score-star', '★');
  star.setAttribute('aria-hidden', 'true');
  summary.appendChild(star);
  summary.appendChild(el('span', 'review-total', d.trips + ' аялал · ' + d.reviews.length + ' сэтгэгдэл'));
  box.appendChild(summary);
  box.appendChild(el('p', 'profile-note', 'Сэтгэгдлүүд жишээ — бодит зорчигчийнх биш.'));

  const ul = el('ul', 'review-list');
  for (const r of d.reviews) {
    const li = el('li', 'review');
    const top = el('div', 'review-top');
    const av = el('span', 'person-avatar review-avatar', r.name.charAt(0));
    av.setAttribute('aria-hidden', 'true');
    top.appendChild(av);
    const who = el('div', 'person-main');
    who.appendChild(el('p', 'review-name', r.name));
    const meta = el('p', 'person-meta');
    meta.appendChild(stars(r.stars));
    meta.appendChild(document.createTextNode(' · ' + r.when));
    who.appendChild(meta);
    top.appendChild(who);
    li.appendChild(top);
    li.appendChild(el('p', 'review-text', r.text));
    ul.appendChild(li);
  }
  box.appendChild(ul);
  return box;
}

/* id буруу эсвэл хоосон — юу хийхийг заана (DESIGN §7) */
function renderMissing(root) {
  const empty = el('div', 'feed-empty');
  empty.appendChild(el('p', 'feed-empty-title', 'Ийм жолооч олдсонгүй.'));
  empty.appendChild(el('p', 'feed-empty-text', 'Холбоос хуучирсан байж магадгүй. Жагсаалтаас дахин хайна уу.'));
  const actions = el('div', 'feed-empty-actions');
  const a = el('a', 'btn btn-primary', 'Жолооч хайх');
  a.href = 'drivers.html';
  actions.appendChild(a);
  empty.appendChild(actions);
  root.appendChild(empty);
}

function initDriverPage() {
  const root = document.getElementById('driverProfile');
  if (!root) return;

  const d = findDriver();
  if (!d) {
    document.title = 'Жолооч олдсонгүй — Уналага.мн';
    renderMissing(root);
    return;
  }

  document.title = d.name + ' — Уналага.мн';
  root.appendChild(renderIntro(d));
  root.appendChild(renderCar(d));
  root.appendChild(renderPosts(d));
  root.appendChild(renderReviews(d));
}

document.addEventListener('DOMContentLoaded', initDriverPage);
