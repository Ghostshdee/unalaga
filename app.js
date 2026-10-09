/* ═══════════════════════════════════════════════════════════════════
   Уналага.мн — app.js
   1. Hero-гийн parallax (DESIGN §14)
   2. Modal: openModal, closeModal, fillAimagSelects, syncRoleUI, validateForm
   3. Пост: createPost, savePost, loadPosts, showToast (localStorage)
   4. Хайлт, шүүлтүүр: applyFilters, openSearch (мобайлд дэлгэц дүүрэн)
   5. Профайл: readProfile, readSaved, зар засах (#edit-<id>), устгах
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

/* Жолооч / захиалагч, тээврийн төрлөөр формыг тааруулна:
   - [data-driver-only] (үнэ, машины зураг) — жолоочид л
   - [data-kind="…"] — сонгосон төрөлд л (хүн: суудал, мал: бичвэр, бараа: кг, гэр: 2 чагт)
   - [data-driver-text] / [data-passenger-text] — асуултын үг үүргээр солигдоно */
function syncRoleUI() {
  const role = document.querySelector('input[name="role"]:checked');
  const isDriver = role && role.value === 'driver';
  for (const block of document.querySelectorAll('[data-driver-only]')) {
    block.hidden = !isDriver;
  }
  const kind = document.querySelector('input[name="kind"]:checked');
  const k = kind ? kind.value : 'passenger';
  for (const block of document.querySelectorAll('#orderForm [data-kind]')) {
    block.hidden = block.dataset.kind !== k;
  }
  for (const node of document.querySelectorAll('#orderForm [data-driver-text]')) {
    node.textContent = isDriver ? node.dataset.driverText : node.dataset.passengerText;
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
  const livestock = document.getElementById('fLivestock');
  const cargoKg = document.getElementById('fCargoKg');
  const cargoWhat = document.getElementById('fCargoWhat');
  const kindInput = document.querySelector('input[name="kind"]:checked');
  const kind = kindInput ? kindInput.value : 'passenger';
  const roleInput = document.querySelector('input[name="role"]:checked');
  const isDriver = !roleInput || roleInput.value === 'driver';

  /* Өмнөх тэмдэглэгээг цэвэрлэнэ */
  for (const el of [from, to, date, time, seats, livestock, cargoKg, cargoWhat]) {
    if (el) el.classList.remove('is-bad');
  }
  for (const key of ['route', 'date', 'time', 'seats', 'livestock', 'cargoKg', 'cargoWhat']) {
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

  /* Огноо, цаг + сонгосон төрлийн заавал талбар. Нуугдсан талбарыг шалгахгүй. */
  const simple = [[date, 'date'], [time, 'time']];
  if (kind === 'passenger') simple.push([seats, 'seats']);
  if (kind === 'livestock') simple.push([livestock, 'livestock']);
  if (kind === 'cargo') {
    simple.push([cargoKg, 'cargoKg']);
    if (!isDriver) simple.push([cargoWhat, 'cargoWhat']);   /* жолоочид заавал биш */
  }
  for (const pair of simple) {
    if (!String(pair[0].value).trim() || (pair[0].type === 'number' && Number(pair[0].value) <= 0)) {
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

  const keys = { fFrom: 'route', fTo: 'route', fDate: 'date', fTime: 'time', fSeats: 'seats',
    fLivestock: 'livestock', fCargoKg: 'cargoKg', fCargoWhat: 'cargoWhat' };
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

  /* Шинэ зар бол профайлд хадгалсан «Жолооч / Захиалагч»-ийг сонгоно */
  const form = document.getElementById('orderForm');
  const profile = readProfile();
  if (!form.dataset.editId && profile.role) {
    const radio = form.querySelector('input[name="role"][value="' + profile.role + '"]');
    if (radio) radio.checked = true;
  }

  syncRoleUI();
  document.querySelector('#orderModal .modal-x').focus();
}

function closeModal() {
  const modal = document.getElementById('orderModal');
  if (!modal || modal.hidden) return;

  modal.hidden = true;
  document.body.classList.remove('is-locked');
  document.removeEventListener('keydown', onModalKeydown);

  /* Засаж байгаад «Болих» дарвал дараагийн шинэ зар хуучин утгаар эхлэхгүй */
  const form = document.getElementById('orderForm');
  if (form && form.dataset.editId) resetForm(form);

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
    delete input.form.dataset.keepPhoto;   /* засах үед шинэ зураг сонгосон */
    if (img.src && img.src.indexOf('blob:') === 0) URL.revokeObjectURL(img.src);
    img.src = URL.createObjectURL(file);
    box.hidden = false;
  });

  clear.addEventListener('click', () => {
    delete input.form.dataset.keepPhoto;   /* хуучин зургийг ч хасна */
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

  /* Тээврийн төрөл солигдоход тохирох талбарууд */
  for (const radio of form.querySelectorAll('input[name="kind"]')) {
    radio.addEventListener('change', syncRoleUI);
  }

  form.addEventListener('input', clearErrorOnInput);
  form.addEventListener('change', clearErrorOnInput);

  /* drivers.html-ийн «Захиалга» → index.html#order — энд ирээд нээгдэнэ */
  if (location.hash === '#order') {
    history.replaceState(null, '', location.pathname + location.search);
    openModal();
  }

  /* profile.html-ийн «Засах» → index.html#edit-<id> — бөглөсөн формтой нээнэ */
  const editMatch = /^#edit-(\d+)$/.exec(location.hash);
  if (editMatch) {
    history.replaceState(null, '', location.pathname + location.search);
    const post = readPosts().find((p) => String(p.id) === editMatch[1]);
    if (post) {
      fillForm(form, post);
      openModal();
    } else {
      showToast('Зар олдсонгүй — устгагдсан байж магадгүй');
    }
  }

  /* Mobile доод цэсийн «Захиалга» гэх мэт нэмэлт нээгчид */
  for (const el of document.querySelectorAll('[data-open-order]')) {
    el.addEventListener('click', (e) => {
      e.preventDefault();   /* sidebar-ын <a href="index.html#order"> — хуудас дахин ачаалахгүй */
      openModal();
    });
  }

  let busy = false;   /* зураг шахаж байх хооронд давхар дарахаас хамгаална */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !validateForm()) return;
    busy = true;

    const post = await readForm(form);
    const myPosts = { href: 'profile.html', label: 'Миний зарууд' };

    if (form.dataset.editId) {
      /* Засах — id, нийтэлсэн цаг хэвээр, хуучин зураг хадгалагдана */
      const old = readPosts().find((p) => String(p.id) === form.dataset.editId);
      if (old) {
        post.id = old.id;
        post.createdAt = old.createdAt;
        if (!post.photo && form.dataset.keepPhoto) post.photo = old.photo;
      }
      const saved = updatePost(post);
      if (saved === 'failed') {
        /* Хадгалагдаагүй — modal нээлттэй, оруулсан утга хэвээр, карт өөрчлөгдөхгүй */
        showStorageWriteError();
        busy = false;
        return;
      }
      if (saved === 'no-photo') post.photo = '';
      replacePostCard(post);
      closeModal();
      resetForm(form);
      showToast(saved === 'ok' ? 'Зар шинэчлэгдлээ' : 'Зар шинэчлэгдлээ. Зураг хэт том тул хадгалагдсангүй',
        myPosts, saved !== 'ok');
      busy = false;
      return;
    }

    const saved = savePost(post);
    if (saved === 'failed') {
      /* Хадгалагдаагүй — карт нэмэхгүй, modal нээлттэй, оруулсан утга хэвээр */
      showStorageWriteError();
      busy = false;
      return;
    }
    if (saved === 'no-photo') post.photo = '';
    clearFilters();   /* шүүлтүүр идэвхтэй байсан ч шинэ зар заавал харагдана */
    const card = prependPost(post);

    closeModal();
    resetForm(form);
    /* Мобайлд hero-гийн доор үлдэхгүй — хүн шинэ тасалбараа хэвлэгдэж байхад нь харна */
    if (card) card.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
    /* Сервер байхгүй — зар зөвхөн энэ төхөөрөмжид хадгалагдана, жолооч нарт хүрэхгүй */
    showToast(saved === 'ok'
      ? 'Захиалга энэ төхөөрөмжид хадгалагдлаа (туршилт)'
      : 'Захиалга энэ төхөөрөмжид хадгалагдлаа (туршилт). Зураг хэт том тул хадгалагдсангүй',
      myPosts, saved !== 'ok');
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

function kindOf(fd) {
  const k = fd.get('kind');
  return KIND_BADGE[k] ? k : 'passenger';
}

/* Карт дээрх «хэр их» мөр — төрлөөр.
   Мал: «5 хонь, 2 ямаа» · Бараа: «500 кг хүртэл · Хүнс» · Гэр: «Гэр, тавилгатай · туслах хүнтэй» */
function kindCapacity(post) {
  const isDriver = post.role === 'driver';
  if (post.kind === 'livestock' && post.livestock) return post.livestock;
  if (post.kind === 'cargo' && post.cargoKg) {
    const kg = formatPrice(post.cargoKg).replace(' ₮', '') + ' кг' + (isDriver ? ' хүртэл' : '');
    return post.cargoWhat ? kg + ' · ' + post.cargoWhat : kg;
  }
  if (post.kind === 'moving') {
    const parts = [post.gherFurniture ? 'Гэр, тавилгатай' : 'Гэр'];
    if (post.gherHelp) parts.push(isDriver ? 'туслах хүнтэй' : 'туслах хүн хэрэгтэй');
    return parts.join(' · ');
  }
  return '';
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
    /* Төрөл бүрийн мэдээлэл — сонгоогүй төрлийнх хоосон */
    livestock: kindOf(fd) === 'livestock' ? String(fd.get('livestock') || '').trim() : '',
    cargoKg: kindOf(fd) === 'cargo' ? Number(fd.get('cargoKg')) || 0 : 0,
    cargoWhat: kindOf(fd) === 'cargo' ? String(fd.get('cargoWhat') || '').trim() : '',
    gherFurniture: kindOf(fd) === 'moving' && fd.get('gherFurniture') === 'on',
    gherHelp: kindOf(fd) === 'moving' && fd.get('gherHelp') === 'on',
    price: isDriver && fd.get('price') ? Number(fd.get('price')) : 0,
    note: String(fd.get('note') || '').trim(),
    photo: isDriver ? await shrinkPhoto(photoInput.files && photoInput.files[0]) : '',
    /* Нийтэлсэн үеийн профайл — дараа нь профайл өөрчлөгдсөн ч зар хэвээр */
    author: readProfile().name || '',
    car: isDriver ? profileCar() : null
  };
}

/* ── ПРОФАЙЛ (profile.html) — нэвтрэх систем ирэх хүртэл энэ browser-т ── */

const PROFILE_KEY = 'unalaga_profile';
const SAVED_KEY = 'unalaga_saved_drivers';

/* localStorage хаалттай (incognito, хөтчийн тохиргоо) үед getItem алдаа шидэнэ.
   Үүнийг эвдэрсэн JSON-оос ялгаж, «зар алга» гэж худал хэлэхгүйн тулд тэмдэглэнэ.
   Дуудагч тал уншихын өмнө false болгож, дараа нь шалгана. */
let storageBroken = false;

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    storageBroken = true;
    return null;
  }
}

function readJSON(key, fallback) {
  try {
    const v = JSON.parse(safeGet(key) || 'null');
    return v == null ? fallback : v;
  } catch (err) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

/* { name, phone, role: 'driver'|'passenger', car: { name, type, seats, livestockBox } } */
function readProfile() {
  const p = readJSON(PROFILE_KEY, {});
  return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
}

function saveProfile(p) {
  return writeJSON(PROFILE_KEY, p);
}

/* Жолоочийн профайлд машин бөглөсөн бол түүнийг, үгүй бол null */
function profileCar() {
  const p = readProfile();
  return p.role === 'driver' && p.car && p.car.name ? p.car : null;
}

/* Хадгалсан жолоочийн id-ууд (drivers.js DRIVERS) */
function readSaved() {
  const list = readJSON(SAVED_KEY, []);
  return Array.isArray(list) ? list : [];
}

function isSaved(id) {
  return readSaved().indexOf(id) !== -1;
}

/* Хадгалах ↔ хасах. Буцаах утга: одоо хадгалагдсан эсэх (true/false),
   бичиж чадаагүй бол null — дуудагч алдааг мэдээлнэ. */
function toggleSaved(id) {
  const list = readSaved();
  const at = list.indexOf(id);
  if (at === -1) list.unshift(id);
  else list.splice(at, 1);
  if (!writeJSON(SAVED_KEY, list)) return null;
  return at === -1;
}

/* Засах гэж буй зарын утгаар формыг бөглөнө */
function fillForm(form, post) {
  resetForm(form);
  form.dataset.editId = String(post.id);
  const role = form.querySelector('input[name="role"][value="' + post.role + '"]');
  if (role) role.checked = true;
  const kind = form.querySelector('input[name="kind"][value="' + (post.kind || 'passenger') + '"]');
  if (kind) kind.checked = true;
  document.getElementById('fGherFurniture').checked = !!post.gherFurniture;
  document.getElementById('fGherHelp').checked = !!post.gherHelp;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v == null ? '' : v; };
  set('fFrom', post.from);
  set('fTo', post.to);
  set('fDate', post.date);
  set('fTime', post.time);
  set('fSeats', post.seats);
  set('fPrice', post.price || '');
  set('fNote', post.note);
  set('fLivestock', post.livestock);
  set('fCargoKg', post.cargoKg || '');
  set('fCargoWhat', post.cargoWhat);
  if (post.photo) {
    const box = document.getElementById('photoPreview');
    box.querySelector('img').src = post.photo;
    box.hidden = false;
    form.dataset.keepPhoto = '1';
  }
  document.getElementById('orderTitle').textContent = 'Зар засах';
  const submit = document.querySelector('#orderModal [type="submit"]');
  if (submit) submit.textContent = 'Хадгалах';
  syncRoleUI();
}

/* localStorage доторх зарыг солино (байрлал нь хэвээр).
   Буцаах утга: 'ok' — бүрэн, 'no-photo' — зураггүй хадгалагдсан, 'failed' — огт хадгалагдаагүй */
function updatePost(post) {
  const list = readPosts().map((p) => (String(p.id) === String(post.id) ? post : p));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return 'ok';
  } catch (err) {
    if (!post.photo) return 'failed';
    const bare = Object.assign({}, post, { photo: '' });
    const ok = writeJSON(STORAGE_KEY, list.map((p) => (String(p.id) === String(post.id) ? bare : p)));
    return ok ? 'no-photo' : 'failed';
  }
}

function deletePost(id) {
  return writeJSON(STORAGE_KEY, readPosts().filter((p) => String(p.id) !== String(id)));
}

/* Нүүр хуудсан дээрх картыг шинэ утгаар солино */
function replacePostCard(post) {
  const old = document.querySelector('.post-card[data-post-id="' + post.id + '"]');
  if (old) old.replaceWith(createPost(post));
}

function readPosts() {
  try {
    const list = JSON.parse(safeGet(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];   /* эвдэрсэн өгөгдөл — хоосон гэж үзнэ. Хаалттай storage-ийг storageBroken ялгана */
  }
}

/* localStorage-д хамгийн эхэнд нэмнэ. Зай хүрэлцэхгүй бол зураггүйгээр
   дахин оролдоно. Буцаах утга: 'ok' — бүрэн хадгалагдсан,
   'no-photo' — зураггүйгээр хадгалагдсан, 'failed' — огт хадгалагдаагүй. */
function savePost(post) {
  const list = readPosts();
  list.unshift(post);
  list.length = Math.min(list.length, MAX_POSTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return 'ok';
  } catch (err) {
    if (!post.photo) return 'failed';
    list[0] = Object.assign({}, post, { photo: '' });
    return writeJSON(STORAGE_KEY, list) ? 'no-photo' : 'failed';
  }
}

/* Явах өдөр — «Өнөөдөр», «Маргааш», бусад нь «10-р сарын 14, Мягмар» (тасалбарын дээд мөр) */
function whenParts(date, time) {
  const parts = String(date || '').split('-').map(Number);
  let day = '';
  if (parts.length === 3 && parts.every(n => n > 0)) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    day = diff === 0 ? 'Өнөөдөр' : diff === 1 ? 'Маргааш'
      : parts[1] + '-р сарын ' + parts[2] + ', ' + WEEKDAYS[d.getDay()];
  }
  return { time: time || '', day: day };
}

/* <p class="post-when"><b class="when-time">18:00</b> <span class="when-day">Өнөөдөр</span></p> */
function whenNode(date, time) {
  const w = whenParts(date, time);
  const p = el('p', 'post-when');
  p.appendChild(el('b', w.time ? 'when-time' : 'when-time is-open', w.time || 'Цаг тохирно'));
  p.appendChild(document.createTextNode(' '));
  p.appendChild(el('span', 'when-day', w.day));
  return p;
}

/* Жишээ зарын огноо — өнөөдрөөс day хоногийн дараа. Өнөөдрийн цаг өнгөрсөн бол
   маргааш — орой «Өнөөдөр 18:00» гэж хуучирсан харагдахгүй. Жишээ гэдэг нь «Жишээ зар» чипээр ил. */
function sampleDate(day, time) {
  const d = new Date();
  let add = Number(day) || 0;
  if (add === 0 && time) {
    const hm = time.split(':').map(Number);
    if (d.getHours() * 60 + d.getMinutes() > hm[0] * 60 + hm[1]) add = 1;
  }
  d.setDate(d.getDate() + add);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/* index.html-ийн 8 жишээ карт — data-day/data-time-аар өдрийг бөглөнө */
function initSampleDates() {
  for (const card of document.querySelectorAll('.post-card[data-day]')) {
    const time = card.dataset.time || '';
    const day = card.querySelector('.when-day');
    if (day) day.textContent = whenParts(sampleDate(card.dataset.day, time), time).day;
  }
}
document.addEventListener('DOMContentLoaded', initSampleDates);

function reduceMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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

/* Тээврийн төрөл → badge (DESIGN §5) */
const KIND_BADGE = {
  passenger: ['badge-passenger', 'Хүн тээвэр'],
  livestock: ['badge-livestock', 'Мал тээвэр'],
  cargo: ['badge-cargo', 'Бараа тээвэр'],
  moving: ['badge-moving', 'Гэр нүүлгэх']
};

/* Машины жижиг дүрс — тогтмол SVG (хэрэглэгчийн өгөгдөл биш) */
const CAR_ICON = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 16.5h15M6.5 16.5l1.4-4.6A2 2 0 0 1 9.8 10.5h4.4a2 2 0 0 1 1.9 1.4l1.4 4.6M4.5 16.5v2.5M19.5 16.5v2.5"/><circle cx="8.5" cy="16.5" r="1.3"/><circle cx="15.5" cy="16.5" r="1.3"/></svg>';

/* Пост объектоос ТАСАЛБАР хэлбэрийн картын DOM үүсгэнэ (DESIGN §1, хаан 2026-10-09):
   зүүн — цаг, чиглэл, суудал, хэн; баруун stub — үнэ, Холбогдох.
   Хэрэглэгчийн текстийг innerHTML биш textContent-оор — HTML орсон ч код болж ажиллахгүй.
   Жолоочийн хуудасны зарыг ч зурна: post.vehicle (машины нэр), post.gap (зай/хугацаа),
   post.capacityText, post.day (жишээ — өнөөдрөөс хэд хоног), post.hidePerson (нэрийг давтахгүй). */
function createPost(post) {
  const isDriver = post.role === 'driver';
  const card = el('article', post.hidePerson ? 'post-card' : 'post-card is-mine');
  card.dataset.postId = post.id;

  /* Жолоочийн БОДИТ зураг байвал л дээд тууз — хоосон панел зурахгүй */
  if (isDriver && post.photo) {
    card.classList.add('has-photo');
    const photo = el('div', 'post-photo');
    const img = el('img');
    img.src = post.photo;
    img.alt = 'Жолоочийн машины зураг';
    img.width = 600;
    img.height = 140;
    img.onerror = () => photo.classList.add('no-image');
    photo.appendChild(img);
    card.appendChild(photo);
  }

  const body = el('div', 'post-body');

  /* Дээд мөр — явах цаг том + өдөр, баруун талд badge */
  const head = el('div', 'post-head');
  head.appendChild(whenNode(post.day != null ? sampleDate(post.day, post.time) : post.date, post.time));
  const badges = el('div', 'post-badges');
  const kind = KIND_BADGE[post.kind] || KIND_BADGE.passenger;
  badges.appendChild(el('span', 'badge ' + kind[0], kind[1]));
  if (!isDriver) badges.appendChild(el('span', 'badge badge-request', 'Унаа хэрэгтэй'));
  /* Жишээ зар — хуурамч «N минутын өмнө» биш, нүдэнд тод дээд мөрөнд (kharuul 2026-10-09).
     data-ts өгөхгүй тул 60 секундын шинэчлэл хөндөхгүй */
  if (post.sample) badges.appendChild(el('span', 'post-time chip-sample', 'Жишээ зар'));
  head.appendChild(badges);
  body.appendChild(head);

  /* Чиглэл — ХААНААС ——●—— ХААШАА, картын хамгийн тод элемент */
  const route = el('div', 'post-route');
  route.appendChild(el('p', 'route-city route-from', post.from));
  const line = el('span', 'route-line');
  line.setAttribute('aria-hidden', 'true');
  line.appendChild(el('i', 'route-dot'));
  route.appendChild(line);
  route.appendChild(el('p', 'route-city route-to', post.to));
  body.appendChild(route);
  if (post.gap) body.appendChild(el('p', 'route-gap', post.gap));

  /* Суудал / багтаамж — жолоочийн хүн тээвэрт сул суудал бүрд дөрвөлжин */
  const facts = el('div', 'post-facts');
  const capText = post.capacityText || kindCapacity(post);
  if (capText) {
    facts.appendChild(el('span', 'post-capacity', capText));
  } else if (isDriver) {
    const n = Number(post.seats) || 0;
    const seats = el('span', 'post-seats');
    seats.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < Math.min(n, 8); i++) seats.appendChild(el('i'));
    facts.appendChild(seats);
    facts.appendChild(el('span', 'post-capacity', n + ' сул суудал'));
  } else {
    facts.appendChild(el('span', 'post-capacity', post.seats + ' хүн'));
  }
  body.appendChild(facts);

  /* Машины нэр — зураггүй ч нэг мөр болж үлдэнэ */
  const carName = (post.vehicle && post.vehicle.name) || (post.car && post.car.name);
  if (isDriver && carName) {
    const car = el('p', 'post-car');
    car.innerHTML = CAR_ICON;
    car.appendChild(document.createTextNode(' ' + carName));
    body.appendChild(car);
  }

  if (post.note) body.appendChild(el('p', 'post-note', post.note));

  /* Доод мөр — хэн + «5 минутын өмнө» (өөрийн зар) */
  const foot = el('div', 'post-foot');
  if (!post.hidePerson) foot.appendChild(personNode(post, isDriver));
  if (!post.sample) {
    const time = el('span', 'post-time', formatAgo(post.createdAt));
    time.dataset.ts = post.createdAt;
    foot.appendChild(time);
  }
  if (foot.childNodes.length) body.appendChild(foot);
  card.appendChild(body);

  card.appendChild(stubNode(post, isDriver));
  return card;
}

/* Хэн — профайлд нэрээ бичсэн бол тэр нэр, үгүй бол «Таны зар».
   Шинэ жолооч «0 үнэлгээ» биш «Шинэ гишүүн» (DESIGN §6). */
function personNode(post, isDriver) {
  const person = el('div', 'post-person');
  const headerAvatar = document.querySelector('.header .avatar');
  const initial = post.author ? post.author.charAt(0).toUpperCase()
    : (headerAvatar ? headerAvatar.textContent.trim() : 'Т');
  const avatar = el('span', 'person-avatar', initial);
  avatar.setAttribute('aria-hidden', 'true');
  const main = el('div', 'person-main');
  main.appendChild(el('p', 'person-name', post.author || 'Таны зар'));
  const meta = el('p', 'person-meta');
  if (isDriver) meta.appendChild(el('span', 'chip-new', 'Шинэ гишүүн'));
  else meta.textContent = 'Захиалагч';
  main.appendChild(meta);
  person.appendChild(avatar);
  person.appendChild(main);
  return person;
}

/* Тасалбарын stub — үнэ (эсвэл «Үнэ тохирно») ба «Холбогдох».
   «Холбогдох» нь жишээ зарт л: өөрийн зартайгаа холбогдох утгагүй. Дарахад app.js-ийн .btn-contact click. */
function stubNode(post, isDriver) {
  const stub = el('div', 'post-stub');
  if (isDriver && post.priceLines) {
    /* «Хүн 25 000 ₮» → шошго + дүн, хоёр мөр (stub-д нэг мөрөнд багтахгүй) */
    const split = el('span', 'post-price post-price-split');
    for (const text of post.priceLines) {
      const cut = text.indexOf(' ');
      const row = el('span', 'price-line');
      row.appendChild(el('span', 'price-label', text.slice(0, cut)));
      row.appendChild(el('span', 'price-amount', text.slice(cut + 1)));
      split.appendChild(row);
    }
    stub.appendChild(split);
  } else if (isDriver && post.price > 0) {
    stub.appendChild(el('span', 'post-price', formatPrice(post.price)));
    if ((post.kind || 'passenger') === 'passenger') stub.appendChild(el('span', 'stub-unit', 'нэг хүн'));
  } else {
    stub.appendChild(el('span', 'stub-unit', 'Үнэ тохирно'));
  }
  if (post.sample) {
    const btn = el('button', 'btn btn-contact', 'Холбогдох');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Холбогдох: ' + (post.author || 'жолооч') + ' (жишээ зар)');
    stub.appendChild(btn);
  }
  return stub;
}

/* Шинэ картыг жагсаалтын хамгийн дээр нэмнэ */
function prependPost(post) {
  const list = document.querySelector('.post-list:not(.profile-posts)');
  if (!list) return null;
  const card = createPost(post);
  list.insertBefore(card, list.firstElementChild);
  /* «Тасалбар хэвлэгдэх» — зөвхөн нийтлэх үйлдлийн хариу (DESIGN §10), засахад биш */
  if (!reduceMotion()) {
    card.classList.add('is-printing');
    const done = () => card.classList.remove('is-printing');
    card.addEventListener('animationend', e => { if (e.animationName === 'ticket-tear') done(); });
    setTimeout(done, 1200);
  }
  return card;
}

/* Ачаалж байх skeleton — жагсаалтыг aria-busy болгож, картын хэлбэртэй блок харуулна */
function showFeedSkeleton(list) {
  const skel = document.getElementById('feedSkeleton');
  list.setAttribute('aria-busy', 'true');
  if (skel) skel.hidden = false;
}

function hideFeedSkeleton(list) {
  const skel = document.getElementById('feedSkeleton');
  list.removeAttribute('aria-busy');
  if (skel) skel.hidden = true;
}

/* HTML дотор бэлэн тавьсан skeleton-ийг JS зурж дуусахад арилгана.
   aria-busy-г авснаар дэлгэц уншигчид агуулга бэлэн боллоо гэж мэднэ. */
function endBusy(node) {
  if (!node) return;
  node.removeAttribute('aria-busy');
  for (const s of node.querySelectorAll('.driver-skeleton')) s.remove();
}

/* Хоёр төрлийн алдааны үг — DESIGN §7 «юу болсныг хэл, юу хийхийг заа».
   Сүлжээний үг зөвхөн сүлжээ тасарсан үед, storage-ийнх нь хөтчийн хориг үед. */
const NETWORK_ERROR = {
  title: 'Холболт тасарлаа.',
  text: 'Интернэтээ шалгаад дахин оролдоно уу.'
};
const STORAGE_ERROR = {
  title: 'Хадгалсан мэдээлэл уншигдсангүй.',
  text: 'Хөтчийн хувийн (incognito) горимыг унтрааж дахин оролдоно уу.'
};
/* Бичих алдаа — STORAGE_ERROR-ийн гарчиг «уншигдсангүй» тул энд тохирохгүй */
const STORAGE_WRITE_ERROR = {
  text: 'Хадгалж чадсангүй. Хөтчийн хувийн (incognito) горимыг унтрааж, эсвэл хуучин зараа устгаад дахин оролдоно уу.'
};

/* Хадгалалт бүтэлгүйтэхэд — амжилттай гэж худлаа хэлэхгүй */
function showStorageWriteError() {
  showToast(STORAGE_WRITE_ERROR.text, null, true);
}

/* Дахин ашиглагдах алдааны төлөв. .feed-empty загвартай (улаан биш — DESIGN §2).
   opts: { title, text, onRetry } — title/text өгөөгүй бол сүлжээний үг. */
function renderErrorState(container, opts) {
  const o = opts || {};
  const box = el('div', 'feed-empty feed-error');
  box.setAttribute('role', 'alert');
  box.appendChild(el('p', 'feed-empty-title', o.title || NETWORK_ERROR.title));
  box.appendChild(el('p', 'feed-empty-text', o.text || NETWORK_ERROR.text));
  if (typeof o.onRetry === 'function') {
    const actions = el('div', 'feed-empty-actions');
    const retry = el('button', 'btn btn-primary', 'Дахин оролдох');
    retry.type = 'button';
    retry.addEventListener('click', o.onRetry);
    actions.appendChild(retry);
    box.appendChild(actions);
  }
  container.appendChild(box);
  return box;
}

/* Интернэт тасрахад доод талд мэдэгдэл. Сайт өөрөө сүлжээ хэрэглэдэггүй тул
   ачаалсан хуудсыг эвдэхгүй — зөвхөн мэдээлнэ. Бүх хуудас app.js ачаалдаг. */
function initOfflineNotice() {
  const bar = el('div', 'offline-bar');
  bar.setAttribute('role', 'status');
  bar.hidden = true;
  const text = el('span', 'offline-text', NETWORK_ERROR.title + ' ' + NETWORK_ERROR.text);
  const retry = el('button', 'btn', 'Дахин оролдох');
  retry.type = 'button';
  bar.appendChild(text);
  bar.appendChild(retry);
  document.body.appendChild(bar);

  function show() {
    text.textContent = NETWORK_ERROR.title + ' ' + NETWORK_ERROR.text;
    bar.hidden = false;
    document.body.classList.add('is-offline');
  }
  function hide() {
    bar.hidden = true;
    document.body.classList.remove('is-offline');
  }

  retry.addEventListener('click', () => {
    if (navigator.onLine) hide();
    else text.textContent = 'Интернэт холбогдоогүй хэвээр байна.';
  });
  window.addEventListener('offline', show);
  window.addEventListener('online', hide);
  if (!navigator.onLine) show();
}

document.addEventListener('DOMContentLoaded', initOfflineNotice);

/* Хадгалсан зарыг жагсаалтын эхэнд зурна. storage хаалттай бол «зар алга» гэж
   худал хэлэхгүй — жагсаалтын дээр алдааны төлөв гаргана (доорх жишээ зар статик). */
function renderSavedPosts(list) {
  let slot = document.getElementById('feedError');
  if (!slot) {
    slot = el('div');
    slot.id = 'feedError';
    list.parentNode.insertBefore(slot, list);
  }
  slot.textContent = '';
  storageBroken = false;

  showFeedSkeleton(list);
  try {
    const posts = readPosts();
    if (storageBroken) {
      renderErrorState(slot, {
        title: STORAGE_ERROR.title,
        text: STORAGE_ERROR.text,
        onRetry: () => renderSavedPosts(list)
      });
      return;
    }
    const frag = document.createDocumentFragment();
    for (const post of posts) {
      if (post && post.from && post.to) frag.appendChild(createPost(post));
    }
    list.insertBefore(frag, list.firstElementChild);
  } finally {
    hideFeedSkeleton(list);
  }
}

/* Хуудас ачаалахад хадгалсан постууд эхэнд, дараа нь 8 жишээ пост */
function loadPosts() {
  const list = document.querySelector('.post-list:not(.profile-posts)');
  if (!list) return;
  renderSavedPosts(list);

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
  delete form.dataset.editId;
  delete form.dataset.keepPhoto;
  const title = document.getElementById('orderTitle');
  if (title) title.textContent = 'Шинэ захиалга';
  const submit = document.querySelector('#orderModal [type="submit"]');
  if (submit) submit.textContent = 'Захиалга үүсгэх';
  syncRoleUI();
}

/* Дээд талын мэдэгдэл — 3 секундын дараа арилна (BUILD §4). Ногоон нь амжилт.
   link = { href, label } өгвөл дарах хугацаа хэрэгтэй тул 6 секунд.
   notice = true бол бараан хөх (алдаа, сануулга — ногоон «амжилт» шиг харагдахгүй), 6 секунд. */
let toastTimer = 0;
function showToast(text, link, notice) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = el('div', 'toast');
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  if (link) {
    toast.appendChild(document.createTextNode(' '));
    const a = el('a', 'toast-link', link.label);
    a.href = link.href;
    toast.appendChild(a);
  }
  toast.classList.toggle('is-notice', !!notice);
  toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-on'), link || notice ? 6000 : 3000);
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
  const list = document.querySelector('.post-list:not(.profile-posts)');
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
  for (const city of document.querySelectorAll('.post-list:not(.profile-posts) .route-city, .driver-list .driver-route-city, .driver-route-city')) {
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
    if (!document.querySelector('.post-list:not(.profile-posts), .driver-list')) {
      location.href = 'drivers.html' + (input.value.trim() ? '?q=' + encodeURIComponent(input.value.trim()) : '');
      return;
    }
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

/* ═══════════════════════════════════════════════════════════════════
   МЭДЭГДЭЛ — header-ийн хонх (Фаз 1.4)
   Мэдэгдлийн систем сервертэй хамт ирнэ. Хуурамч «3» тоог хассан —
   байхгүй мэдэгдэл харуулах нь итгэл алдагдуулна.
   ═══════════════════════════════════════════════════════════════════ */
function initNotif() {
  const btn = document.querySelector('[data-notif]');
  if (!btn) return;

  const panel = el('div', 'notif-panel');
  panel.id = 'notifPanel';
  panel.hidden = true;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Мэдэгдэл');
  panel.appendChild(el('p', 'notif-title', 'Одоогоор мэдэгдэл алга'));
  panel.appendChild(el('p', 'notif-text', 'Мэдэгдэл туршилтын хувилбарт ажиллахгүй.'));
  btn.parentNode.appendChild(panel);

  const close = () => {
    if (panel.hidden) return;
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.hidden = !panel.hidden;
    btn.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
  });
  document.addEventListener('click', (e) => { if (!panel.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); }
  });
}

document.addEventListener('DOMContentLoaded', initNotif);

/* ── Өнгөний горим: Авто → Өдөр → Шөнө (DESIGN §2) ──
   Горимыг <head> дахь inline script (window.unalagaTheme) тавьдаг; энд зөвхөн товч. */
function initThemeToggle() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  const theme = window.unalagaTheme;
  if (!theme) { btn.hidden = true; return; }

  const NEXT = { auto: 'day', day: 'night', night: 'auto' };
  const LABEL = { auto: 'Өнгө: автомат', day: 'Өнгө: өдөр', night: 'Өнгө: шөнө' };
  const TOAST = {
    auto: 'Автомат — нар жаргахад шөнийн горим',
    day: 'Өдрийн горим',
    night: 'Шөнийн горим',
  };
  btn.setAttribute('aria-label', LABEL[theme.pref()]);

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer;
  btn.addEventListener('click', () => {
    const next = NEXT[theme.pref()];
    /* Шилжилт зөвхөн товч дарахад — ачаалахад анивчихгүй */
    if (!reduce) {
      document.documentElement.classList.add('theme-switching');
      clearTimeout(timer);
      timer = setTimeout(() => document.documentElement.classList.remove('theme-switching'), 300);
    }
    theme.set(next);
    btn.setAttribute('aria-label', LABEL[next]);
    showToast(TOAST[next]);
  });
}
document.addEventListener('DOMContentLoaded', initThemeToggle);

/* loadPosts-ийн дараа — хадгалсан постууд ч шүүгдэнэ */
document.addEventListener('DOMContentLoaded', initFilters);

/* «Холбогдох» / «Залгах» — жишээ өгөгдөлд бодит дугаар алга, товч юу ч хийхгүй байж
   болохгүй. Нэг delegation нь бүх хуудас, динамикаар үүссэн картыг хамарна. */
document.addEventListener('click', (e) => {
  if (e.target.closest('.btn-contact')) {
    showToast('Жишээ зар — холбогдох боломжгүй', null, true);
  }
});
