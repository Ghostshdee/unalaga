/* ═══════════════════════════════════════════════════════════════════
   Уналага.мн — profile.js
   Профайл хуудас (Төлөвлөгөө Фаз 1.1 + 1.2).
   Миний мэдээлэл · Миний машин · Миний зарууд (засах, устгах) · Хадгалсан жолооч.
   app.js, drivers.js-ийн ДАРАА ачаална (readProfile, readPosts, createPost,
   DRIVERS, CAR_TYPES, createDriverCard, el ашиглана).
   Нэвтрэх систем ирэх хүртэл бүгд энэ browser-ийн localStorage-д.
   ═══════════════════════════════════════════════════════════════════ */

const ROLE_LABEL = { driver: 'Жолооч', passenger: 'Захиалагч' };

/* «9911 2233», «9911-2233» → «99112233». Хоосон бол хоосон. */
function cleanPhone(v) {
  return String(v || '').replace(/\D/g, '');
}

/* «99112233» → «9911-2233» */
function formatPhone(v) {
  const d = cleanPhone(v);
  return d.length === 8 ? d.slice(0, 4) + '-' + d.slice(4) : d;
}

function profileSection(title, id) {
  const box = el('section', 'profile-section');
  box.id = id;
  box.appendChild(el('h2', 'profile-h2', title));
  return box;
}

/* ── Миний мэдээлэл: харах горим ── */
function renderInfoView(card, p) {
  card.textContent = '';

  const head = el('div', 'profile-head');
  const avatar = el('span', 'person-avatar profile-avatar',
    p.name ? p.name.charAt(0).toUpperCase() : '?');
  avatar.setAttribute('aria-hidden', 'true');
  const main = el('div', 'person-main');
  main.appendChild(el('h1', 'profile-name', p.name || 'Миний профайл'));
  main.appendChild(el('p', 'person-meta', p.role ? ROLE_LABEL[p.role] : 'Мэдээллээ бөглөөгүй байна'));
  head.appendChild(avatar);
  head.appendChild(main);
  card.appendChild(head);

  if (p.name || p.phone) {
    const list = el('ul', 'trust-list');
    if (p.phone) list.appendChild(el('li', 'trust-item trust-info', 'Утас: ' + formatPhone(p.phone)));
    card.appendChild(list);
  } else {
    card.appendChild(el('p', 'profile-empty',
      'Нэрээ бичвэл нийтэлсэн зар дээр «Таны зар»-ын оронд таны нэр гарна.'));
  }

  const edit = el('button', 'btn btn-ghost', p.name ? 'Мэдээлэл засах' : 'Мэдээлэл бөглөх');
  edit.type = 'button';
  edit.id = 'profileEdit';
  edit.addEventListener('click', () => renderInfoForm(card, readProfile()));
  card.appendChild(edit);
}

/* Нэг шошготой талбар */
function field(labelText, input, hint) {
  const cell = el('div', 'fld-cell');
  const label = el('label', 'fld-sub', labelText);
  label.htmlFor = input.id;
  cell.appendChild(label);
  cell.appendChild(input);
  if (hint) cell.appendChild(el('p', 'fld-err', hint));
  return cell;
}

function input(id, type, value, attrs) {
  const i = el('input', 'inp');
  i.id = id;
  i.type = type;
  i.value = value == null ? '' : value;
  for (const k in attrs || {}) i.setAttribute(k, attrs[k]);
  return i;
}

/* ── Миний мэдээлэл: засах горим (машин ч энд) ── */
function renderInfoForm(card, p) {
  card.textContent = '';
  const car = p.car || {};

  const form = el('form', 'me-form');
  form.id = 'profileForm';
  form.noValidate = true;
  form.appendChild(el('h1', 'profile-name', 'Миний мэдээлэл'));

  form.appendChild(field('Нэр', input('meName', 'text', p.name, { autocomplete: 'name', maxlength: '40' })));

  const phone = input('mePhone', 'tel', p.phone ? formatPhone(p.phone) : '', {
    autocomplete: 'tel', inputmode: 'numeric', placeholder: '9911-2233', maxlength: '9'
  });
  const phoneCell = field('Утас', phone);
  const phoneErr = el('p', 'fld-err', '8 оронтой дугаар оруулна уу');
  phoneErr.id = 'mePhoneErr';
  phoneErr.hidden = true;
  phoneCell.appendChild(phoneErr);
  form.appendChild(phoneCell);

  /* Жолооч / Захиалагч — нүүр хуудасны шүүлтүүрийн сегменттэй ижил */
  const roleBox = el('fieldset', 'fld');
  roleBox.appendChild(el('legend', 'fld-sub', 'Би'));
  const seg = el('div', 'seg me-seg');
  for (const r of ['driver', 'passenger']) {
    const item = el('label', 'seg-item');
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'meRole';
    radio.value = r;
    radio.checked = (p.role || 'driver') === r;
    item.appendChild(radio);
    item.appendChild(el('span', null, ROLE_LABEL[r]));
    seg.appendChild(item);
  }
  roleBox.appendChild(seg);
  form.appendChild(roleBox);

  /* Машин — зөвхөн жолоочид */
  const carBox = el('fieldset', 'fld me-car');
  carBox.appendChild(el('legend', 'fld-sub', 'Миний машин'));
  carBox.appendChild(field('Машины нэр', input('meCarName', 'text', car.name, { placeholder: 'Toyota Prius 2019', maxlength: '40' })));
  const type = el('select', 'inp');
  type.id = 'meCarType';
  for (const k in CAR_TYPES) {
    const opt = el('option', null, CAR_TYPES[k]);
    opt.value = k;
    opt.selected = (car.type || 'sedan') === k;
    type.appendChild(opt);
  }
  const row = el('div', 'fld-row');
  row.appendChild(field('Төрөл', type));
  row.appendChild(field('Суудал', input('meCarSeats', 'number', car.seats || 4, { min: '1', max: '50', inputmode: 'numeric' })));
  carBox.appendChild(row);
  const box = el('label', 'check');
  const cb = el('input');
  cb.type = 'checkbox';
  cb.id = 'meCarLivestock';
  cb.checked = !!car.livestockBox;
  box.appendChild(cb);
  box.appendChild(el('span', null, 'Малын хайрцагтай'));
  carBox.appendChild(box);
  form.appendChild(carBox);

  const syncCar = () => { carBox.hidden = form.querySelector('input[name="meRole"]:checked').value !== 'driver'; };
  for (const r of form.querySelectorAll('input[name="meRole"]')) r.addEventListener('change', syncCar);
  syncCar();

  const actions = el('div', 'me-actions');
  const cancel = el('button', 'btn btn-ghost', 'Болих');
  cancel.type = 'button';
  cancel.addEventListener('click', () => renderAll());
  const save = el('button', 'btn btn-primary', 'Хадгалах');
  save.type = 'submit';
  actions.appendChild(cancel);
  actions.appendChild(save);
  form.appendChild(actions);

  phone.addEventListener('input', () => { phone.classList.remove('is-bad'); phoneErr.hidden = true; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const digits = cleanPhone(phone.value);
    if (digits && digits.length !== 8) {
      phone.classList.add('is-bad');
      phone.setAttribute('aria-invalid', 'true');
      phoneErr.hidden = false;
      phone.focus();
      return;
    }
    const role = form.querySelector('input[name="meRole"]:checked').value;
    const next = {
      name: document.getElementById('meName').value.trim(),
      phone: digits,
      role: role,
      car: role === 'driver' ? {
        name: document.getElementById('meCarName').value.trim(),
        type: type.value,
        seats: Math.min(50, Math.max(1, Number(document.getElementById('meCarSeats').value) || 1)),
        livestockBox: cb.checked
      } : null
    };
    saveProfile(next);
    renderAll();
    showToast('Мэдээлэл хадгалагдлаа');
    const edit = document.getElementById('profileEdit');
    if (edit) edit.focus();
  });

  card.appendChild(form);
  document.getElementById('meName').focus();
}

/* ── Миний машин (харах) — жолооч л ── */
function renderCarSection(p) {
  if (p.role !== 'driver') return null;
  const box = profileSection('Миний машин', 'myCar');
  const car = p.car;
  if (!car || !car.name) {
    box.appendChild(el('p', 'profile-empty', 'Машинаа нэмбэл зар бүр дээр машины нэр автоматаар гарна.'));
    return box;
  }
  const row = el('div', 'driver-car');
  row.appendChild(el('p', 'driver-car-name', car.name));
  row.appendChild(el('p', 'driver-car-facts', (CAR_TYPES[car.type] || '') + ' · ' + car.seats + ' суудал'));
  if (car.livestockBox) row.appendChild(el('span', 'badge badge-livestock', 'Малын хайрцагтай'));
  box.appendChild(row);
  return box;
}

/* ── Миний зарууд: засах, устгах ── */
function renderMyPosts() {
  const posts = readPosts().filter((p) => p && p.from && p.to);
  const box = profileSection('Миний зарууд' + (posts.length ? ' (' + posts.length + ')' : ''), 'myPosts');

  if (!posts.length) {
    box.appendChild(el('p', 'profile-empty', 'Та одоогоор зар нийтлээгүй байна.'));
    const a = el('a', 'btn btn-primary', 'Захиалга үүсгэх');
    a.href = 'index.html#order';
    box.appendChild(a);
    return box;
  }

  const list = el('div', 'post-list profile-posts');
  for (const post of posts) {
    const card = createPost(Object.assign({}, post, { hidePerson: true }));
    const actions = el('div', 'post-actions');
    const edit = el('a', 'btn btn-ghost', 'Засах');
    edit.href = 'index.html#edit-' + post.id;
    const del = el('button', 'btn btn-ghost btn-danger', 'Устгах');
    del.type = 'button';
    del.addEventListener('click', () => {
      /* Буцаах боломжгүй тул нэг удаа асууна */
      if (!window.confirm(post.from + ' — ' + post.to + ' зарыг устгах уу?')) return;
      deletePost(post.id);
      renderAll();
      showToast('Зар устгагдлаа');
      const h = document.querySelector('#myPosts .profile-h2');
      if (h) { h.tabIndex = -1; h.focus(); }
    });
    actions.appendChild(edit);
    actions.appendChild(del);
    card.querySelector('.post-body').appendChild(actions);
    list.appendChild(card);
  }
  box.appendChild(list);
  return box;
}

/* ── Хадгалсан жолооч ── */
function renderSaved() {
  const ids = readSaved();
  const drivers = ids.map((id) => DRIVERS.find((d) => d.id === id)).filter(Boolean);
  const box = profileSection('Хадгалсан жолооч' + (drivers.length ? ' (' + drivers.length + ')' : ''), 'mySaved');

  if (!drivers.length) {
    box.appendChild(el('p', 'profile-empty', 'Жолоочийн хуудаснаас «Хадгалах» дарж дуртай жолоочоо энд цуглуулаарай.'));
    const a = el('a', 'btn btn-ghost', 'Жолооч хайх');
    a.href = 'drivers.html';
    box.appendChild(a);
    return box;
  }

  const list = el('div', 'saved-list');
  for (const d of drivers) {
    const card = createDriverCard(d);
    const remove = el('button', 'btn btn-ghost', 'Хасах');
    remove.type = 'button';
    remove.setAttribute('aria-label', d.name + '-ийг хадгалсан жагсаалтаас хасах');
    remove.addEventListener('click', () => {
      toggleSaved(d.id);
      renderAll();
      showToast('Хадгалсан жагсаалтаас хасагдлаа');
    });
    card.querySelector('.driver-foot').insertBefore(remove, card.querySelector('.driver-foot .btn-contact'));
    list.appendChild(card);
  }
  box.appendChild(list);
  return box;
}

function renderAll() {
  const root = document.getElementById('profileRoot');
  if (!root) return;
  const p = readProfile();
  root.textContent = '';

  const card = el('div', 'profile-card');
  card.id = 'profileInfo';
  root.appendChild(card);
  renderInfoView(card, p);

  const car = renderCarSection(p);
  if (car) root.appendChild(car);
  root.appendChild(renderMyPosts());
  root.appendChild(renderSaved());
}

document.addEventListener('DOMContentLoaded', renderAll);
