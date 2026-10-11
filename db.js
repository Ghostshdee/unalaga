/* ═══════════════════════════════════════════════════════════════════
   Уналага.мн — db.js
   Мэдээллийн сантай (Supabase) харьцах БҮХ код энд. Фаз 3-хөнгөн, 3H.2.
   • Ердийн fetch — supabase-js, CDN байхгүй (2G/3G, CLAUDE.md §8).
   • Хаяг, түлхүүр ганцхан газар: DB_CONFIG. Datacom руу нүүх бол зөвхөн энэ
     тохиргоо ба dbRequest/RPC хэсэг солигдоно.
   • Түлхүүр нь publishable — нийтэд ил байх зориулалттай. Хамгаалалт санд (RLS).
     service_role / secret түлхүүрийг ЭНД ХЭЗЭЭ Ч бүү бич.
   • select-д баганыг заавал нэрлэнэ: select=* нь 401 өгдөг. phone баганыг
     хэзээ ч select хийхгүй — утсыг зөвхөн get_phone RPC буцаана.
   • Ачаалах дараалал: db.js → app.js (index, profile, map, privacy).
   ═══════════════════════════════════════════════════════════════════ */

const DB_CONFIG = {
  url: 'https://ulbuiqvqosppaptqizmd.supabase.co',
  key: 'sb_publishable_gm6FPubWqPSuzAUhKy0Leg_4J-9vJM_'
};

const DB_TIMEOUT_MS = 20000;   /* 2G/3G-д удаан — 20 секунд хүлээнэ */

/* anon-д SELECT эрх олгосон баганууд (001_ads.sql). phone, edit_token_hash, consent_at ОРООГҮЙ */
const DB_AD_COLUMNS = 'id,created_at,role,kind,from_loc,to_loc,depart_date,depart_time,seats,' +
  'livestock,cargo_kg,cargo_what,gher_furniture,gher_help,price,note,author_name,car_name,car_type';

const MY_ADS_KEY = 'unalaga_my_ads';          /* [{ id, token }] — өөрийн зарын засах эрх */
const ADS_CACHE_KEY = 'unalaga_ads_cache';    /* { savedAt, ads: [мөр] } — интернэт тасрахад */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ── Утас ── */

/* «9911 2233», «9911-2233» → «99112233» */
function cleanPhone(v) {
  return String(v || '').replace(/\D/g, '');
}

/* «99112233» → «9911-2233» */
function formatPhone(v) {
  const d = cleanPhone(v);
  return d.length === 8 ? d.slice(0, 4) + '-' + d.slice(4) : d;
}

/* ── Сүлжээ ── */

/* kind: 'network' (интернэт, хугацаа) | 'server' (Supabase алдаа буцаасан).
   reason: SQL-ийн raise exception текст (too_many_ads, busy, consent_required, bad_date) */
function dbError(kind, reason, status) {
  const e = new Error(reason || kind);
  e.dbKind = kind;
  e.reason = String(reason || '');
  e.status = status || 0;
  return e;
}

async function dbRequest(method, path, body) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), DB_TIMEOUT_MS) : 0;
  try {
    const res = await fetch(DB_CONFIG.url + '/rest/v1' + path, {
      method: method,
      headers: {
        apikey: DB_CONFIG.key,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = null; }
    }
    if (!res.ok) throw dbError('server', data && data.message, res.status);
    return data;
  } catch (err) {
    if (err && err.dbKind) throw err;
    throw dbError('network', '', 0);   /* fetch унасан, хугацаа дууссан */
  } finally {
    clearTimeout(timer);
  }
}

/* Идэвхтэй зарууд (RLS: status='active', явах өдөр өчигдрөөс хойш). ids өгвөл зөвхөн тэдгээр */
async function dbListAds(ids) {
  let path = '/ads?select=' + DB_AD_COLUMNS + '&order=created_at.desc';
  if (ids) {
    const clean = ids.filter((id) => UUID_RE.test(id));   /* URL-д орох тул хэлбэрийг шалгана */
    if (!clean.length) return [];
    path += '&id=in.(' + clean.join(',') + ')';
  } else {
    path += '&limit=100';
  }
  const rows = await dbRequest('GET', path);
  return Array.isArray(rows) ? rows : [];
}

/* → { id, token }. Токен нэг л удаа буцна — хөтөч хадгалах ёстой */
function dbCreateAd(p, honeypot) {
  return dbRequest('POST', '/rpc/create_ad', { p: p, honeypot: honeypot || '' });
}

/* → true | false (токен буруу, зар хаагдсан) */
function dbUpdateAd(id, token, p) {
  return dbRequest('POST', '/rpc/update_ad', { p_id: id, p_token: token, p: p });
}

/* → true | false. Зарыг устгахгүй, status='closed' болгоно (модерацийн түүх үлдэнэ) */
function dbCloseAd(id, token) {
  return dbRequest('POST', '/rpc/close_ad', { p_id: id, p_token: token });
}

/* → '99112233' | null (зар хаагдсан). «Дугаар харах» тоологдоно */
function dbGetPhone(id) {
  return dbRequest('POST', '/rpc/get_phone', { p_id: id });
}

/* Алдааг хэрэглэгчид ойлгомжтой болгоно (DESIGN §7: уучлалтгүй, юу хийхийг хэл) */
function dbErrorMessage(err, fallback) {
  if (err && err.dbKind === 'network') {
    return 'Холболт тасарлаа. Интернэтээ шалгаад дахин оролдоно уу.';
  }
  const known = {
    too_many_ads: 'Нэг утаснаас 24 цагт 3 зар нийтэлнэ. Маргааш дахин оролдоно уу.',
    busy: 'Одоо олон зар орж байна. Хэдэн минутын дараа дахин оролдоно уу.',
    consent_required: 'Нэр, утсаа харуулахыг зөвшөөрсөн тэмдэглэгээг хийнэ үү.',
    bad_date: 'Явах огноо буруу байна. Өнөөдрөөс 60 хоногийн дотор сонгоно уу.'
  };
  return (err && known[err.reason]) || fallback;
}

/* ── localStorage (db.js өөрөө бие даасан) ── */

function lsRead(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    return v == null ? fallback : v;
  } catch (err) {
    return fallback;
  }
}

function lsWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

/* ── Миний зарууд: засах эрх (токен) ── */

function readMyAds() {
  const list = lsRead(MY_ADS_KEY, []);
  return Array.isArray(list)
    ? list.filter((a) => a && UUID_RE.test(a.id) && typeof a.token === 'string' && a.token)
    : [];
}

/* false бол хөтөч бичих эрхгүй (incognito) — дуудагч хэрэглэгчид хэлнэ */
function rememberMyAd(id, token) {
  const list = readMyAds().filter((a) => a.id !== id);
  list.unshift({ id: id, token: token });
  return lsWrite(MY_ADS_KEY, list);
}

function forgetMyAd(id) {
  return lsWrite(MY_ADS_KEY, readMyAds().filter((a) => a.id !== id));
}

function myAdToken(id) {
  const a = readMyAds().find((x) => x.id === id);
  return a ? a.token : '';
}

function isMyAd(id) {
  return !!myAdToken(id);
}

/* ── Cache: интернэт тасрахад сүүлийн жагсаалт (DESIGN §7) ── */

function readAdsCache() {
  const c = lsRead(ADS_CACHE_KEY, null);
  return c && Array.isArray(c.ads) ? c : { savedAt: 0, ads: [] };
}

function writeAdsCache(ads) {
  return lsWrite(ADS_CACHE_KEY, { savedAt: Date.now(), ads: ads });
}

/* Нэг зарыг cache-д нэмнэ/солино. Жагсаалтыг «шинэ» гэж тооцохгүй — savedAt хэвээр */
function cacheUpsertAd(row) {
  const c = readAdsCache();
  const ads = c.ads.filter((a) => a.id !== row.id);
  ads.unshift(row);
  lsWrite(ADS_CACHE_KEY, { savedAt: c.savedAt, ads: ads.slice(0, 100) });
}

function cacheRemoveAd(id) {
  const c = readAdsCache();
  lsWrite(ADS_CACHE_KEY, { savedAt: c.savedAt, ads: c.ads.filter((a) => a.id !== id) });
}

/* ── Мөр → app.js-ийн пост объект (createPost-ийн хэлбэр) ── */

function dbRowToPost(row) {
  return {
    id: row.id,
    remote: true,
    mine: isMyAd(row.id),
    createdAt: Date.parse(row.created_at) || Date.now(),
    role: row.role,
    kind: row.kind || 'passenger',
    from: row.from_loc,
    to: row.to_loc,
    date: row.depart_date,
    time: row.depart_time ? String(row.depart_time).slice(0, 5) : '',
    seats: row.seats == null ? 1 : row.seats,
    livestock: row.livestock || '',
    cargoKg: row.cargo_kg || 0,
    cargoWhat: row.cargo_what || '',
    gherFurniture: !!row.gher_furniture,
    gherHelp: !!row.gher_help,
    price: row.price || 0,
    note: row.note || '',
    photo: '',
    author: row.author_name || '',
    car: row.car_name ? { name: row.car_name, type: row.car_type || '' } : null
  };
}

/* Миний зарууд (cache-ээс) — map.js чиглэл зурахад */
function dbMyAdPosts() {
  const mine = new Set(readMyAds().map((a) => a.id));
  return readAdsCache().ads.filter((r) => mine.has(r.id)).map(dbRowToPost);
}
