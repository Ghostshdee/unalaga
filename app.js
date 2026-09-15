/* ═══════════════════════════════════════════════════════════════════
   Уналага.мн — app.js
   Одоо: hero-гийн parallax (DESIGN §14).
   Дараа (BUILD.md §7, 2-3-р алхам): openModal, closeModal, fillAimagSelects,
   syncRoleUI, validateForm, createPost, savePost, loadPosts, showToast.
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
   3-р алхамд: постыг үнэхээр үүсгэх, localStorage, toast.
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    /* 3-р алхам: энд createPost() + savePost() + showToast() орно.
       Одоогоор шалгалт өнгөрөөд modal хаагдана. */
    const data = Object.fromEntries(new FormData(form).entries());
    console.log('Захиалга (3-р алхамд пост болно):', data);
    closeModal();
  });
}

document.addEventListener('DOMContentLoaded', initModal);
