import { mountRays } from './rays.js';

/* ---------------- THEME ---------------- */
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const stored = localStorage.getItem('theme');
const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
const initial = stored || (prefersLight ? 'light' : 'dark');
root.setAttribute('data-theme', initial);

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

/* ---------------- RESUME MODAL ---------------- */
const resumeModal = document.getElementById('resume-modal');
if (resumeModal) {
  const openTriggers = [
    document.getElementById('resume-trigger'),
    document.getElementById('resume-trigger-hero')
  ].filter(Boolean);
  const closeTriggers = resumeModal.querySelectorAll('[data-resume-close]');
  let lastFocused = null;

  const openResumeModal = () => {
    lastFocused = document.activeElement;
    resumeModal.hidden = false;
    document.body.style.overflow = 'hidden';
    const closeBtn = resumeModal.querySelector('.resume-modal-close');
    if (closeBtn) closeBtn.focus();
  };

  const closeResumeModal = () => {
    resumeModal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  };

  openTriggers.forEach(btn => btn.addEventListener('click', openResumeModal));
  closeTriggers.forEach(el => el.addEventListener('click', closeResumeModal));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !resumeModal.hidden) closeResumeModal();
  });
}

/* ---------------- FLOATING DOCK: magnification ---------------- */
const dockItems = Array.from(document.querySelectorAll('.dock-item'));

dockItems.forEach((item, index) => {
  item.addEventListener('mouseenter', () => {
    dockItems.forEach((el, i) => {
      el.classList.remove('dock-hovered', 'dock-near');
      const dist = Math.abs(i - index);
      if (dist === 0) el.classList.add('dock-hovered');
      else if (dist === 1) el.classList.add('dock-near');
    });
  });
});

document.getElementById('dock-items').addEventListener('mouseleave', () => {
  dockItems.forEach(el => el.classList.remove('dock-hovered', 'dock-near'));
});

/* ---------------- FLOATING DOCK: active section highlight ---------------- */
const navSections = ['top', 'about', 'skills', 'projects', 'contact']
  .map(id => document.getElementById(id))
  .filter(Boolean);

function updateActiveDockItem() {
  const probeY = window.innerHeight * 0.5;
  // Walk top-to-bottom and keep the last section whose top has scrolled
  // past the probe line — that's the one currently "in view".
  let current = navSections[0];
  for (const section of navSections) {
    if (section.getBoundingClientRect().top <= probeY) {
      current = section;
    }
  }
  dockItems.forEach(a => a.classList.remove('active'));
  const match = dockItems.find(a => a.getAttribute('href') === `#${current.id}`);
  if (match) match.classList.add('active');
}

let navTicking = false;
function onScrollForNav() {
  if (navTicking) return;
  navTicking = true;
  requestAnimationFrame(() => {
    updateActiveDockItem();
    navTicking = false;
  });
}
window.addEventListener('scroll', onScrollForNav, { passive: true });
window.addEventListener('resize', onScrollForNav);
updateActiveDockItem();

/* ---------------- SCROLL REVEAL ---------------- */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('is-visible'), i * 60);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);
revealEls.forEach(el => revealObserver.observe(el));

/* ---------------- HERO RAYS BACKGROUND ---------------- */
const raysContainer = document.getElementById('hero-rays');
if (raysContainer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  try {
    mountRays(raysContainer, {
      rayColor1: '#EAB308',
      rayColor2: '#6fb3ff',
      speed: 1.2,
      intensity: 1.5,
      spread: 2,
      origin: 'top-right',
      saturation: 1.3,
      blend: 0.6,
      falloff: 1.7,
      opacity: 1
    });
  } catch (e) {
    console.warn('Rays background skipped:', e);
  }
}

/* ---------------- BORDER GLOW — project cards ---------------- */
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.project-card').forEach(card => {
    // inject the edge-light span
    const edgeLight = document.createElement('span');
    edgeLight.className = 'card-edge-light';
    card.prepend(edgeLight);

    const getCenter = el => {
      const { width, height } = el.getBoundingClientRect();
      return [width / 2, height / 2];
    };

    const getEdgeProximity = (el, x, y) => {
      const [cx, cy] = getCenter(el);
      const dx = x - cx;
      const dy = y - cy;
      let kx = Infinity, ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);
      return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1) * 100;
    };

    const getCursorAngle = (el, x, y) => {
      const [cx, cy] = getCenter(el);
      const dx = x - cx;
      const dy = y - cy;
      if (!dx && !dy) return 0;
      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      return deg < 0 ? deg + 360 : deg;
    };

    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const proximity = getEdgeProximity(card, x, y);
      const angle    = getCursorAngle(card, x, y);

      card.style.setProperty('--cursor-angle', `${angle.toFixed(2)}deg`);
      card.style.setProperty('--edge-proximity', proximity.toFixed(2));

      const colorSens = 50;
      const edgeSens  = 30;

      const colorOp = Math.max((proximity - colorSens) / (100 - colorSens), 0);
      const edgeOp  = Math.max((proximity - edgeSens)  / (100 - edgeSens),  0);

      card.style.setProperty('--glow-before-opacity', colorOp.toFixed(3));
      card.style.setProperty('--glow-after-opacity', (colorOp * 0.45).toFixed(3));
      edgeLight.style.opacity = edgeOp.toFixed(3);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--glow-before-opacity', '0');
      card.style.setProperty('--glow-after-opacity', '0');
      edgeLight.style.opacity = '0';
    });
  });
}
