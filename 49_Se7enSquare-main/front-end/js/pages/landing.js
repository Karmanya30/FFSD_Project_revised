/* ─────────────────────────────────────────
   Gameunity Landing — JavaScript
   ───────────────────────────────────────── */

/* ── NAV: add glass background on scroll ── */
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
});

/* Scroll-activated section overlay */
(function() {
  const overlay = document.getElementById('section-overlay');
  const hero    = document.querySelector('.hero');
  const links   = document.querySelectorAll('.overlay-link');
  const sections = [
    { id: 'features', link: links[0] },
    { id: 'how', link: links[1] },
    { id: 'community', link: links[2] }
  ];

  if (!overlay || !hero || links.length === 0) return;

  window.addEventListener('scroll', () => {
    overlay.classList.toggle('show', window.scrollY > hero.offsetHeight * 0.45);

    const sectionInView = sections.find(s => {
      const el = document.getElementById(s.id);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.top <= window.innerHeight * 0.35 && rect.bottom >= window.innerHeight * 0.2;
    });

    links.forEach(link => link.classList.remove('active'));
    if (sectionInView) sectionInView.link.classList.add('active');
  });

  links.forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      window.scrollTo({ top: target.offsetTop - 64, behavior: 'smooth' });
    });
  });
})();


/* ── COUNT-UP ANIMATION ── */
function countUp(id, target, suffix = '', duration = 2000) {
  const el = document.getElementById(id);
  if (!el) return;

  const start = performance.now();

  (function step(now) {
    const p   = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 4);          /* ease-out-quart */
    const val  = Math.floor(ease * target);

    el.textContent = val >= 1000
      ? (val / 1000).toFixed(val < 10000 ? 1 : 0) + 'K' + suffix
      : val + suffix;

    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target >= 1000
        ? (target / 1000).toFixed(target < 10000 ? 1 : 0) + 'K' + suffix
        : target + suffix;
    }
  })(start);
}

/* Kick off counters after 800 ms so the hero has rendered */
setTimeout(() => {
  countUp('c-users', 148000, '+');
  countUp('c-comms',   3200, '+');
  countUp('c-msgs',    2400, 'K+');
}, 800);


/* ── SCROLL REVEAL ── */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


/* ── HOW-IT-WORKS STEPS ── */

/** Activate a step manually (called via onclick in the HTML) */
function setStep(el) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('on'));
  el.classList.add('on');
}

/* Auto-cycle through steps every 3 seconds */
let stepIdx = 0;

setInterval(() => {
  const steps = document.querySelectorAll('.step');
  steps.forEach(s => s.classList.remove('on'));
  steps[stepIdx % steps.length].classList.add('on');
  stepIdx++;
}, 3000);


/* ── HERO MOCKUP — 3D TILT ON MOUSE MOVE ── */
const mockup  = document.querySelector('.mockup');
const heroR   = document.querySelector('.hero-r');

if (mockup && heroR) {
  heroR.addEventListener('mousemove', e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x    = (e.clientX - rect.left)  / rect.width  - 0.5;
    const y    = (e.clientY - rect.top)   / rect.height - 0.5;
    mockup.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 8}deg)`;
  });

  heroR.addEventListener('mouseleave', () => {
    mockup.style.transform = 'rotateY(-6deg) rotateX(3deg)';
  });
}