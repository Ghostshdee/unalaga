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
