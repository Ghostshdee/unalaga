/* ═══════════════════════════════════════════════════════════════════
   Уналага.мн — app.js
   1. Hero-гийн parallax (DESIGN §14)
   2. Modal: openModal, closeModal, fillAimagSelects, syncRoleUI, validateForm
   3. Пост: createPost, savePost, loadPosts, showToast (localStorage)
   4. Хайлт, шүүлтүүр: applyFilters, openSearch (мобайлд дэлгэц дүүрэн)
   index.html, drivers.html хоёулаа ачаална — элемент байхгүй бол функц бүр чимээгүй буцна.
   Гадны сан ашиглахгүй (CLAUDE.md §8).
   ═══════════════════════════════════════════════════════════════════ */

/* Hero-гийн давхаргуудыг хулганы хөдөлгөөн ба скроллоор шилжүүлнэ.
   `data-depth` их байх тусам хурдан хөдөлнө — ойрын зүйл шиг мэдрэгдэнэ. */
function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const layers = Array.from(hero.querySelectorAll('.hl'));
  const dashes = hero.querySelector('.road-dashes');
  if (!layers.length) return;

  /* Хөдөлгөөн багасгах тохиргоотой хүнд огт хөдөлгөхгүй (DESIGN §10).
     Дүр зураг хөдөлгөөнгүйгээр бүрэн харагдана. */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;

  /* Хүрэлцэх төхөөрөмж дээр хулганы parallax байхгүй — зөвхөн скролл.
     Хуучин утсанд илүү хөнгөн. */
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let targetX = 0, targetY = 0;   /* хулганы зорилтот утга (-0.5 .. 0.5) */
  let curX = 0, curY = 0;         /* одоогийн, зөөлрүүлсэн утга */
  let scrolled = 0;               /* hero хэр гүйлгэгдсэн (0 .. 1) */
  let running = false;            /* hero дэлгэц дээр байгаа эсэх */

  if (fine) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      targetX = (e.clientX - r.left) / r.width - 0.5;
      targetY = (e.clientY - r.top) / r.height - 0.5;
    }, { passive: true });

    /* Хулгана гармагц дүр зураг аажим төв рүүгээ буцна */
    hero.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
  }

  function readScroll() {
    const r = hero.getBoundingClientRect();
    scrolled = Math.min(Math.max(-r.top / r.height, 0), 1);
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', readScroll, { passive: true });
  readScroll();

  function frame() {
    /* Зөөлрүүлэлт — хулганы араас шууд биш, аажим гүйцнэ */
    curX += (targetX - curX) * 0.07;
    curY += (targetY - curY) * 0.07;

    for (const el of layers) {
      const d = Number(el.dataset.depth) || 0;
      const x = -curX * d * 1.6;
      const y = -curY * d * 1.1 - scrolled * d * 1.4;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    }

    /* Замын зураас скроллоор доошоо урсана — урагшаа явж байгаа мэдрэмж */
    if (dashes) {
      hero.style.setProperty('--road-shift', (scrolled * 46).toFixed(1) + 'px');
    }

    if (running) requestAnimationFrame(frame);
  }

  /* Hero харагдахгүй бол тооцоог зогсоож, батарей хэмнэнэ */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      const wasRunning = running;
      running = entries[0].isIntersecting;
      if (running && !wasRunning) requestAnimationFrame(frame);
    }, { rootMargin: '80px' }).observe(hero);
  } else {
    running = true;
    requestAnimationFrame(frame);
  }
}

document.addEventListener('DOMContentLoaded', initParallax);

/* ═══════════════════════════════════════════════════════════════════
   MODAL — «Шинэ захиалга үүсгэх» (BUILD.md §4, 2-р алхам)
   Нээх/хаах · аймаг дүүргэх · жолооч↔захиалагч · форм шалгах.
   ═══════════════════════════════════════════════════════════════════ */

/* Монгол улсын 21 аймаг + нийслэл (BUILD.md §4) */
const AIMAGS = [
  'Улаанбаатар', 'Архангай', 'Баян-Өлгий', 'Баянхонгор', 'Булган',
  'Говь-Алтай', 'Говьсүмбэр', 'Дархан-Уул', 'Дорноговь', 'Дорнод',
  'Дундговь', 'Завхан', 'Орхон', 'Өвөрхангай', 'Өмнөговь', 'Сүхбаатар',
  'Сэлэнгэ', 'Төв', 'Увс', 'Ховд', 'Хөвсгөл', 'Хэнтий'
];

const ERR_EMPTY = 'Энэ талбарыг бөглөнө үү';
const ERR_SAME = 'Хаанаас, хаашаа хоёр ижил байж болохгүй';

/* Modal нээгдэхээс өмнө фокус хаана байсныг санаж, хаагдахад буцаана */
let lastFocused = null;

/* Хоёр select-д 22 аймгийг нэмнэ. HTML-д гараар бичихгүй — нэг жагсаалтаас
   үүсгэвэл алдаа гарахгүй, дараа нь сум нэмэхэд амар. */
function fillAimagSelects() {
  const selects = document.querySelectorAll('#fFrom, #fTo');
  for (const sel of selects) {
    const frag = document.createDocumentFragment();
    for (const name of AIMAGS) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      frag.appendChild(opt);
    }
    sel.appendChild(frag);
  }
}

/* Жолооч сонговол үнэ, машины зураг харагдана. Захиалагч сонговол нуугдана. */
function syncRoleUI() {
  const role = document.querySelector('input[name="role"]:checked');
  const isDriver = role && role.value === 'driver';
  for (const block of document.querySelectorAll('[data-driver-only]')) {
    block.hidden = !isDriver;
  }
}

/* Нэг талбарын алдааг харуулах / арилгах */
function setFieldError(input, key, message) {
  const box = key ? document.querySelector('[data-err-for="' + key + '"]') : null;
  if (message) {
    input.classList.add('is-bad');
    input.setAttribute('aria-invalid', 'true');
    if (box) {
      box.textContent = message;
      box.hidden = false;
    }
  } else {
    input.classList.remove('is-bad');
    input.removeAttribute('aria-invalid');
    if (box) box.hidden = true;
  }
}

/* Бүх талбарыг шалгана. Алдаатай бол эхний алдаатай талбар руу фокус аваачна.
   Буцаах утга: алдаагүй бол true. */
function validateForm() {
  const from = document.getElementById('fFrom');
  const to = document.getElementById('fTo');
  const date = document.getElementById('fDate');
  const time = document.getElementById('fTime');
  const seats = document.getElementById('fSeats');

  /* Өмнөх тэмдэглэгээг цэвэрлэнэ */
  for (const el of [from, to, date, time, seats]) el.classList.remove('is-bad');
  for (const key of ['route', 'date', 'time', 'seats']) {
    const box = document.querySelector('[data-err-for="' + key + '"]');
    if (box) box.hidden = true;
  }

  let firstBad = null;

  /* Хаанаас / хаашаа — эхлээд хоосон эсэх, дараа нь ижил эсэх */
  if (!from.value || !to.value) {
    const empty = !from.value ? from : to;
    if (!from.value) from.classList.add('is-bad');
    if (!to.value) to.classList.add('is-bad');
    setFieldError(empty, 'route', ERR_EMPTY);
    firstBad = empty;
  } else if (from.value === to.value) {
    from.classList.add('is-bad');
    setFieldError(to, 'route', ERR_SAME);
    firstBad = to;
  }

  /* Огноо, цаг, хүний тоо — хоосон байж болохгүй */
  const simple = [[date, 'date'], [time, 'time'], [seats, 'seats']];
  for (const pair of simple) {
    if (!pair[0].value) {
      setFieldError(pair[0], pair[1], ERR_EMPTY);
      if (!firstBad) firstBad = pair[0];
    }
  }

  if (firstBad) firstBad.focus();
  return !firstBad;
}

/* Талбар дээр ажиллаж эхлэхэд тухайн алдааны тэмдэглэгээ арилна (BUILD §4) */
function clearErrorOnInput(e) {
  const el = e.target;
  if (!el.classList || !el.classList.contains('is-bad')) return;

  const keys = { fFrom: 'route', fTo: 'route', fDate: 'date', fTime: 'time', fSeats: 'seats' };
  const key = keys[el.id];
  if (!key) return;

  setFieldError(el, key, '');
  /* Чиглэлийн хоёр select нэг алдааны мөр хуваалцдаг */
  if (key === 'route') {
    document.getElementById('fFrom').classList.remove('is-bad');
    document.getElementById('fTo').classList.remove('is-bad');
  }
}

/* Modal дотор Tab дарахад фокус гадагш гарахгүй (DESIGN §11) */
function trapFocus(e) {
  if (e.key !== 'Tab') return;

  const sheet = document.querySelector('#orderModal .modal-sheet');
  const sel = 'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const able = Array.from(sheet.querySelectorAll(sel)).filter((el) => el.offsetParent !== null);
  if (!able.length) return;

  const first = able[0];
  const last = able[able.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function onModalKeydown(e) {
  if (e.key === 'Escape') {
    closeModal();
    return;
  }
  trapFocus(e);
}

function openModal() {
  const modal = document.getElementById('orderModal');
  if (!modal) return;

  lastFocused = document.activeElement;
  modal.hidden = false;
  document.body.classList.add('is-locked');
  document.addEventListener('keydown', onModalKeydown);

  /* Өнгөрсөн өдрийг сонгуулахгүй (BUILD §4) */
  const date = document.getElementById('fDate');
  date.min = new Date().toISOString().slice(0, 10);

  syncRoleUI();
  document.querySelector('#orderModal .modal-x').focus();
}

function closeModal() {
  const modal = document.getElementById('orderModal');
  if (!modal || modal.hidden) return;

  modal.hidden = true;
  document.body.classList.remove('is-locked');
  document.removeEventListener('keydown', onModalKeydown);

  /* Фокусыг нээсэн товч руу нь буцаана — товчлуураар явж буй хүнд чухал */
  if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
}

/* Сонгосон машины зургийг шууд харуулна (хаа ч явуулахгүй, зөвхөн preview) */
function initPhotoPreview() {
  const input = document.getElementById('fPhoto');
  const box = document.getElementById('photoPreview');
  const clear = document.getElementById('photoClear');
  if (!input || !box) return;

  const img = box.querySelector('img');

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (img.src && img.src.indexOf('blob:') === 0) URL.revokeObjectURL(img.src);
    img.src = URL.createObjectURL(file);
    box.hidden = false;
  });

  clear.addEventListener('click', () => {
    if (img.src && img.src.indexOf('blob:') === 0) URL.revokeObjectURL(img.src);
    input.value = '';
    img.removeAttribute('src');
    box.hidden = true;
    input.focus();
  });
}

function initModal() {
  const modal = document.getElementById('orderModal');
  const form = document.getElementById('orderForm');
  if (!modal || !form) return;

  fillAimagSelects();
  initPhotoPreview();

  /* Нээх — hero доторх товч */
  const opener = document.querySelector('.hero-cta');
  if (opener) opener.addEventListener('click', openModal);

  /* Хаах — ✕, Болих, overlay. Escape нь onModalKeydown дотор. */
  for (const el of modal.querySelectorAll('[data-close]')) {
    el.addEventListener('click', closeModal);
  }

  /* Жолооч ↔ захиалагч */
  for (const radio of form.querySelectorAll('input[name="role"]')) {
    radio.addEventListener('change', syncRoleUI);
  }

  /* Хараахан бэлэн болоогүй тээврийн төрөл */
  const note = document.getElementById('soonNote');
  let noteTimer = 0;
  for (const btn of form.querySelectorAll('[data-soon]')) {
    btn.addEventListener('click', () => {
      note.hidden = false;
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => { note.hidden = true; }, 4000);
    });
  }

  form.addEventListener('input', clearErrorOnInput);
  form.addEventListener('change', clearErrorOnInput);

  /* drivers.html-ийн «Захиалга» → index.html#order — энд ирээд нээгдэнэ */
  if (location.hash === '#order') {
    history.replaceState(null, '', location.pathname + location.search);
    openModal();
  }

  /* Mobile доод цэсийн «Захиалга» гэх мэт нэмэлт нээгчид */
  for (const el of document.querySelectorAll('[data-open-order]')) {
    el.addEventListener('click', openModal);
  }

  let busy = false;   /* зураг шахаж байх хооронд давхар дарахаас хамгаална */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !validateForm()) return;
    busy = true;

    const post = await readForm(form);
    const saved = savePost(post);
    clearFilters();   /* шүүлтүүр идэвхтэй байсан ч шинэ зар заавал харагдана */
    prependPost(post);

    closeModal();
    resetForm(form);
    showToast(saved ? 'Захиалга нийтлэгдлээ' : 'Захиалга нийтлэгдлээ. Зураг хэт том тул хадгалагдсангүй');
    busy = false;
  });
}

document.addEventListener('DOMContentLoaded', initModal);

/* ═══════════════════════════════════════════════════════════════════
   ПОСТ ҮҮСГЭХ — BUILD.md §4 «Илгээсний дараа», 3-р алхам
   Формоос пост объект → localStorage → жагсаалтын хамгийн дээр карт.
   Сервер одоохондоо байхгүй тул зөвхөн энэ browser-т хадгалагдана.
   ═══════════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'unalaga_posts';
const MAX_POSTS = 30;          /* localStorage ~5MB — хуучныг нь хасна */
const PHOTO_MAX_W = 640;       /* зургийг шахаж хадгална — 2G/3G, хадгалах зай */

const WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

/* Машины зургийг жижигрүүлж JPEG data URL болгоно. blob: хаяг хуудас
   дахин ачаалахад үхдэг тул localStorage-д шууд текстээр хадгална. */
function shrinkPhoto(file) {
  return new Promise((resolve) => {
    if (!file || !file.type || file.type.indexOf('image/') !== 0) return resolve('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, PHOTO_MAX_W / img.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
    img.src = url;
  });
}

/* Формын утгуудаас хадгалах пост объект үүсгэнэ */
async function readForm(form) {
  const fd = new FormData(form);
  const role = fd.get('role') === 'passenger' ? 'passenger' : 'driver';
  const isDriver = role === 'driver';
  const photoInput = document.getElementById('fPhoto');

  return {
    id: Date.now(),
    createdAt: Date.now(),
    role: role,
    kind: fd.get('kind') || 'passenger',
    from: fd.get('from'),
    to: fd.get('to'),
    date: fd.get('date'),
    time: fd.get('time'),
    seats: Number(fd.get('seats')) || 1,
    price: isDriver && fd.get('price') ? Number(fd.get('price')) : 0,
    note: String(fd.get('note') || '').trim(),
    photo: isDriver ? await shrinkPhoto(photoInput.files && photoInput.files[0]) : ''
  };
}

function readPosts() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];   /* эвдэрсэн өгөгдөл эсвэл хаалттай storage — хоосон гэж үзнэ */
  }
}

/* localStorage-д хамгийн эхэнд нэмнэ. Зай хүрэлцэхгүй бол зураггүйгээр
   дахин оролдоно. Буцаах утга: зурагтай нь бүрэн хадгалагдсан эсэх. */
function savePost(post) {
  const list = readPosts();
  list.unshift(post);
  list.length = Math.min(list.length, MAX_POSTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (err) {
    if (!post.photo) return false;
    list[0] = Object.assign({}, post, { photo: '' });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (err2) { /* storage хаалттай */ }
    return false;
  }
}

/* «4-р сарын 27, Даваа · 08:00» — жишээ картуудтай ижил хэлбэр */
function formatWhen(date, time) {
  const parts = String(date).split('-').map(Number);
  if (parts.length !== 3) return '';
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const text = parts[1] + '-р сарын ' + parts[2] + ', ' + WEEKDAYS[d.getDay()];
  return time ? text + ' · ' + time : text;
}

/* «Дөнгөж сая», «5 минутын өмнө», «3 цагийн өмнө», «2 өдрийн өмнө» */
function formatAgo(ts) {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return 'Дөнгөж сая';
  if (min < 60) return min + ' минутын өмнө';
  const h = Math.floor(min / 60);
  if (h < 24) return h + ' цагийн өмнө';
  return Math.floor(h / 24) + ' өдрийн өмнө';
}

/* 45000 → «45 000 ₮» */
function formatPrice(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₮';
}

/* Жижиг туслах — элемент үүсгээд класс, текст онооно */
function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

/* Пост объектоос картын DOM үүсгэнэ. innerHTML биш textContent —
   хэрэглэгчийн бичсэн тэмдэглэлд HTML орсон ч код болж ажиллахгүй. */
function createPost(post) {
  const isDriver = post.role === 'driver';
  const card = el('article', 'post-card is-mine');
  card.dataset.postId = post.id;

  /* Машины зураг — жолооч зураг оруулсан үед л (BUILD §2) */
  if (isDriver && post.photo) {
    const photo = el('div', 'post-photo veh-sedan');
    const img = el('img');
    img.src = post.photo;
    img.alt = 'Жолоочийн машины зураг';
    img.width = 600;
    img.height = 338;
    img.onerror = () => photo.classList.add('no-image');
    photo.appendChild(img);
    card.appendChild(photo);
  }

  const body = el('div', 'post-body');

  /* Badge + хугацаа */
  const head = el('div', 'post-head');
  const badges = el('div', 'post-badges');
  badges.appendChild(el('span', 'badge badge-passenger', 'Хүн тээвэр'));
  if (!isDriver) badges.appendChild(el('span', 'badge badge-request', 'Унаа хэрэгтэй'));
  head.appendChild(badges);
  const time = el('span', 'post-time', formatAgo(post.createdAt));
  time.dataset.ts = post.createdAt;
  head.appendChild(time);
  body.appendChild(head);

  /* Чиглэл — картын хамгийн том элемент (DESIGN §1). Зай тооцоолох
     өгөгдөл одоохондоо байхгүй тул route-gap-гүй. */
  const route = el('div', 'post-route');
  const rail = el('span', 'route-rail');
  rail.setAttribute('aria-hidden', 'true');
  rail.appendChild(el('i', 'route-dot route-dot-start'));
  rail.appendChild(el('i', 'route-dot route-dot-end'));
  const cities = el('div', 'route-cities route-cities-tight');
  cities.appendChild(el('p', 'route-city route-from', post.from));
  cities.appendChild(el('p', 'route-city route-to', post.to));
  route.appendChild(rail);
  route.appendChild(cities);
  body.appendChild(route);

  body.appendChild(el('p', 'post-when', formatWhen(post.date, post.time)));

  const facts = el('div', 'post-facts');
  facts.appendChild(el('span', 'post-capacity',
    isDriver ? post.seats + ' суудал үлдсэн' : post.seats + ' хүн'));
  if (isDriver && post.price > 0) facts.appendChild(el('span', 'post-price', formatPrice(post.price)));
  body.appendChild(facts);

  if (post.note) body.appendChild(el('p', 'post-note', post.note));

  /* Хэн — нэвтрэх систем байхгүй тул header-ийн avatar-ын үсгийг авна.
     Шинэ жолооч «0 үнэлгээ» биш «Шинэ гишүүн» (DESIGN §6). */
  const person = el('div', 'post-person');
  const headerAvatar = document.querySelector('.header .avatar');
  const avatar = el('span', 'person-avatar', headerAvatar ? headerAvatar.textContent.trim() : 'Т');
  avatar.setAttribute('aria-hidden', 'true');
  const main = el('div', 'person-main');
  main.appendChild(el('p', 'person-name', 'Таны зар'));
  const meta = el('p', 'person-meta');
  if (isDriver) meta.appendChild(el('span', 'chip-new', 'Шинэ гишүүн'));
  else meta.textContent = 'Захиалагч';
  main.appendChild(meta);
  person.appendChild(avatar);
  person.appendChild(main);
  body.appendChild(person);

  card.appendChild(body);
  return card;
}

/* Шинэ картыг жагсаалтын хамгийн дээр нэмнэ */
function prependPost(post) {
  const list = document.querySelector('.post-list');
  if (!list) return;
  list.insertBefore(createPost(post), list.firstElementChild);
}

/* Хуудас ачаалахад хадгалсан постууд эхэнд, дараа нь 8 жишээ пост */
function loadPosts() {
  const list = document.querySelector('.post-list');
  if (!list) return;
  const frag = document.createDocumentFragment();
  for (const post of readPosts()) {
    if (post && post.from && post.to) frag.appendChild(createPost(post));
  }
  list.insertBefore(frag, list.firstElementChild);

  /* «Дөнгөж сая» минут тутамд «1 минутын өмнө» болж шинэчлэгдэнэ */
  setInterval(() => {
    for (const t of list.querySelectorAll('.post-time[data-ts]')) {
      t.textContent = formatAgo(Number(t.dataset.ts));
    }
  }, 60000);
}

/* Формыг анхны байдалд нь буцаана — дараагийн захиалга цэвэрхэн эхэлнэ */
function resetForm(form) {
  form.reset();
  const box = document.getElementById('photoPreview');
  if (box && !box.hidden) {
    const img = box.querySelector('img');
    if (img.src && img.src.indexOf('blob:') === 0) URL.revokeObjectURL(img.src);
    img.removeAttribute('src');
    box.hidden = true;
  }
  for (const bad of form.querySelectorAll('.is-bad')) bad.classList.remove('is-bad');
  for (const box2 of form.querySelectorAll('.fld-err')) box2.hidden = true;
  syncRoleUI();
}

/* Дээд талын ногоон мэдэгдэл — 3 секундын дараа арилна (BUILD §4) */
let toastTimer = 0;
function showToast(text) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = el('div', 'toast');
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3000);
}

document.addEventListener('DOMContentLoaded', loadPosts);

/* ═══════════════════════════════════════════════════════════════════
   ХАЙЛТ, ШҮҮЛТҮҮР — CLAUDE.md §6 «Замын зураг» 3
   Картуудыг DOM-оос шууд шүүнэ: жишээ пост, хэрэглэгчийн пост ялгаагүй.
   Мобайлд хайлт дэлгэц дүүрэн нээгдэнэ (DESIGN §8).
   ═══════════════════════════════════════════════════════════════════ */

const KIND_BY_BADGE = {
  'badge-livestock': 'livestock',
  'badge-cargo': 'cargo',
  'badge-moving': 'moving',
  'badge-passenger': 'passenger'
};

const mobileQuery = window.matchMedia('(max-width: 640px)');
let searchOpener = null;

/* Том жижиг үсэг, илүү зай хамаарахгүй */
function normalize(text) {
  return String(text).toLowerCase().replace(/\s+/g, ' ').trim();
}

/* Картын badge-аас хэн, ямар тээвэр гэдгийг уншина */
function cardInfo(card) {
  let kind = 'passenger';
  for (const cls in KIND_BY_BADGE) {
    if (card.querySelector('.' + cls)) { kind = KIND_BY_BADGE[cls]; break; }
  }
  return {
    who: card.querySelector('.badge-request') ? 'passenger' : 'driver',
    kind: kind,
    text: normalize(card.textContent)
  };
}

function readFilters() {
  const who = document.querySelector('input[name="who"]:checked');
  const kind = document.getElementById('kindFilter');
  const input = document.getElementById('searchInput');
  return {
    who: who ? who.value : 'all',
    kind: kind ? kind.value : 'all',
    words: input ? normalize(input.value).split(' ').filter(Boolean) : []
  };
}

/* Бүх картыг шүүж, тоо болон хоосон төлөвийг шинэчилнэ.
   Хайлтын үг бүр картад байх ёстой: «улаанбаатар хөвсгөл» → хоёулаа. */
function applyFilters() {
  const list = document.querySelector('.post-list');
  if (!list) {
    /* Зарын жагсаалтгүй хуудас (drivers.html) — өөрөө шүүнэ */
    document.dispatchEvent(new Event('unalaga:search'));
    return;
  }

  const f = readFilters();
  const active = f.who !== 'all' || f.kind !== 'all' || f.words.length > 0;
  let shown = 0;

  for (const card of list.querySelectorAll('.post-card')) {
    const info = cardInfo(card);
    const ok = (f.who === 'all' || info.who === f.who) &&
               (f.kind === 'all' || info.kind === f.kind) &&
               f.words.every((w) => info.text.indexOf(w) !== -1);
    card.hidden = !ok;
    if (ok) shown++;
  }

  const countText = shown + ' зар олдлоо';
  const count = document.getElementById('feedCount');
  if (count) {
    count.hidden = !active || shown === 0;
    count.textContent = countText;
  }
  const searchCount = document.getElementById('searchCount');
  if (searchCount) searchCount.textContent = f.words.length ? countText : '';

  const empty = document.getElementById('feedEmpty');
  if (empty) empty.hidden = shown > 0;
}

function clearFilters() {
  const all = document.querySelector('input[name="who"][value="all"]');
  if (all) all.checked = true;
  const kind = document.getElementById('kindFilter');
  if (kind) kind.value = 'all';
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  applyFilters();
}

/* Картуудад хамгийн олон гарсан газрын нэр — хуруугаар дарж хайна.
   Хөдөө утсаар кирилл бичих удаан тул товч илүү хялбар. */
function fillSearchPlaces() {
  const box = document.getElementById('searchPlaces');
  if (!box) return;
  const counts = {};
  for (const city of document.querySelectorAll('.post-list .route-city, .driver-list .driver-route-city')) {
    const name = city.textContent.trim();
    counts[name] = (counts[name] || 0) + 1;
  }
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 8);
  box.textContent = '';
  for (const name of top) {
    const chip = el('button', 'place-chip', name);
    chip.type = 'button';
    chip.addEventListener('click', () => {
      const input = document.getElementById('searchInput');
      input.value = name;
      applyFilters();
      input.focus();
    });
    box.appendChild(chip);
  }
}

function onSearchKeydown(e) {
  if (e.key === 'Escape') closeSearch();
}

/* Мобайлд дэлгэц дүүрэн нээнэ, компьютерт header-ийн талбар руу фокус */
function openSearch(e) {
  const input = document.getElementById('searchInput');
  if (!input) return;
  if (!mobileQuery.matches) {
    input.focus();
    return;
  }
  searchOpener = e && e.currentTarget ? e.currentTarget : document.activeElement;
  fillSearchPlaces();
  applyFilters();
  document.body.classList.add('is-search-open', 'is-locked');
  document.addEventListener('keydown', onSearchKeydown);
  input.focus();
}

function closeSearch() {
  if (!document.body.classList.contains('is-search-open')) return;
  document.body.classList.remove('is-search-open', 'is-locked');
  document.removeEventListener('keydown', onSearchKeydown);
  if (searchOpener && document.contains(searchOpener)) searchOpener.focus();
}

function initFilters() {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');
  if (!form || !input) return;

  let timer = 0;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(applyFilters, 120);   /* үсэг бүрд биш, бичиж дуусахад */
  });

  /* Enter эсвэл «Зар харах» — мобайлд хайлтыг хааж, жагсаалт руу гүйлгэнэ */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    applyFilters();
    if (document.body.classList.contains('is-search-open')) {
      closeSearch();
      const title = document.querySelector('.section-title');
      if (title) title.scrollIntoView({ block: 'start' });
    }
  });

  for (const radio of document.querySelectorAll('input[name="who"]')) {
    radio.addEventListener('change', applyFilters);
  }
  const kind = document.getElementById('kindFilter');
  if (kind) kind.addEventListener('change', applyFilters);

  for (const btn of document.querySelectorAll('[data-open-search]')) {
    btn.addEventListener('click', openSearch);
  }
  for (const btn of document.querySelectorAll('[data-close-search]')) {
    btn.addEventListener('click', closeSearch);
  }
  for (const btn of document.querySelectorAll('[data-clear-filters]')) {
    btn.addEventListener('click', clearFilters);
  }

  /* Утсаа хэвтүүлж өргөн болбол дэлгэц дүүрэн хайлтыг хаана */
  mobileQuery.addEventListener('change', () => { if (!mobileQuery.matches) closeSearch(); });
}

/* loadPosts-ийн дараа — хадгалсан постууд ч шүүгдэнэ */
document.addEventListener('DOMContentLoaded', initFilters);
