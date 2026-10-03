const EASE = 'cubic-bezier(.22, 1, .36, 1)';

export function initMotion() {
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const desktop = window.matchMedia('(min-width: 901px)');
  const control = document.getElementById('motion-toggle');
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress');
  const hero = document.querySelector('.hero');
  const photo = document.querySelector('.hero-photo img');
  const activeAnimations = new Set();
  const settleDisclosures = new Set();
  let preference = 'auto';
  let frame = 0;
  try {
    const saved = localStorage.getItem('plumber-motion');
    if (saved === 'on' || saved === 'off') preference = saved;
  } catch { /* Storage is optional. */ }
  const enabled = () => preference !== 'off' && (!reduced.matches || preference === 'on');

  function animate(element, keyframes, options = {}) {
    if (!enabled() || !element?.animate) return;
    const animation = element.animate(keyframes, { duration: 800, easing: EASE, ...options });
    activeAnimations.add(animation);
    animation.finished.then(() => activeAnimations.delete(animation), () => activeAnimations.delete(animation));
    return animation;
  }

  // Height is measured at each interaction, so rapid reversals start at the visible height.
  function disclosure(element, prepare, settle, initialOpen = false) {
    let open = initialOpen;
    let animation;
    const finish = () => {
      animation?.cancel();
      animation = undefined;
      element.style.height = '';
      element.style.overflow = '';
      settle(open);
    };
    settleDisclosures.add(finish);
    return next => {
      const from = element.getBoundingClientRect().height;
      open = next;
      animation?.cancel();
      element.style.height = '';
      prepare(open);
      const to = element.getBoundingClientRect().height;
      if (!enabled() || !element.animate || from === to) { finish(); return; }
      // Keep the content mounted during the closing animation.
      prepare(true);
      element.style.overflow = 'hidden';
      element.style.height = `${from}px`;
      const current = animate(element, [{ height: `${from}px` }, { height: `${to}px` }], {
        duration: open ? 460 : 340, fill: 'both'
      });
      animation = current;
      current.finished.then(() => {
        if (animation === current) finish();
      }, () => {});
    };
  }

  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  let menuOpen = false;
  const setMenuHeight = disclosure(nav,
    open => nav.classList.toggle('is-open', open),
    open => { nav.classList.toggle('is-open', open); nav.inert = !open && !desktop.matches; });
  function setMenu(open) {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    nav.inert = !open && !desktop.matches;
    setMenuHeight(open);
    if (open) nav.querySelectorAll('li').forEach((item, index) => {
      animate(item, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'translateY(0)' }], {
        duration: 380, delay: index * 35, fill: 'backwards'
      });
    });
  }
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); }
  });
  desktop.addEventListener('change', () => { setMenu(false); settleDisclosures.forEach(finish => finish()); });
  nav.inert = !desktop.matches;

  document.querySelectorAll('.faq-item').forEach(item => {
    const summary = item.querySelector('summary');
    let open = item.open;
    const setHeight = disclosure(item,
      next => { item.open = next; },
      next => { item.open = next; summary.setAttribute('aria-expanded', String(next)); }, open);
    summary.setAttribute('aria-expanded', String(open));
    summary.addEventListener('click', event => {
      event.preventDefault();
      open = !open;
      summary.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-expanded', open);
      setHeight(open);
    });
  });

  // Content has no hidden baseline: unsupported APIs or disabled motion leave it readable.
  const reveals = [
    ['.hero-eyebrow, .hero-line, .hero-sub, .hero-content .hero-ctas, .trust-badges', 45],
    ['.hero-image', 30],
    ['.section-heading > *, .process-section > .container > .eyebrow, .process-section h2, .areas-section .eyebrow, .areas-section h2, .areas-section .section-intro, .quote-copy > *, .faq-section .eyebrow, .faq-section h2, .final-cta .container > *, .footer-grid > *', 35],
    ['.service-card, .why-item, .process-list li, .areas-list li, .faq-item', 45],
    ['.quote-form', 35]
  ];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        const group = [...target.parentElement.children];
        const index = group.filter(item => item.dataset.motionDistance).indexOf(target);
        const distance = Number(target.dataset.motionDistance);
        animate(target, [
          { opacity: 0, transform: `translateY(${distance}px) scale(.98)` },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ], { duration: 900, delay: Math.max(0, Math.min(index, 5)) * 75, fill: 'backwards' });
        observer.unobserve(target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
    reveals.forEach(([selector, distance]) => document.querySelectorAll(selector).forEach(element => {
      element.dataset.motionDistance = distance;
      observer.observe(element);
    }));
  }

  // Pointer effects are restricted to precise pointers; touch scrolling stays native.
  document.querySelectorAll('.service-card').forEach(card => {
    let pointerFrame;
    let pointer;
    card.addEventListener('pointermove', event => {
      if (!enabled() || !finePointer.matches || event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        if (!enabled() || !finePointer.matches) return;
        const rect = card.getBoundingClientRect();
        const x = (pointer.x - rect.left) / rect.width;
        const y = (pointer.y - rect.top) / rect.height;
        card.style.setProperty('--tilt-x', `${(0.5 - y) * 5}deg`);
        card.style.setProperty('--tilt-y', `${(x - 0.5) * 5}deg`);
        card.style.setProperty('--glow-x', `${x * 100}%`);
        card.style.setProperty('--glow-y', `${y * 100}%`);
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  });
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', event => {
      if (!enabled() || button.disabled) return;
      const ripple = document.createElement('span');
      ripple.className = 'button-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      const bounds = button.getBoundingClientRect();
      const size = Math.max(bounds.width, bounds.height) * 2;
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${(event.detail ? event.clientX - bounds.left : bounds.width / 2) - size / 2}px`;
      ripple.style.top = `${(event.detail ? event.clientY - bounds.top : bounds.height / 2) - size / 2}px`;
      button.append(ripple);
      const animation = animate(ripple, [{ transform: 'scale(0)', opacity: .3 }, { transform: 'scale(1)', opacity: 0 }], { duration: 650 });
      animation.finished.then(() => ripple.remove(), () => ripple.remove());
    });
  });

  function updateScroll() {
    frame = 0;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0})`;
    header.classList.toggle('is-scrolled', window.scrollY > 30);
    if (enabled() && finePointer.matches) {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        photo.style.setProperty('--photo-y', `${Math.max(-24, Math.min(24, -rect.top * .055))}px`);
      }
    }
  }
  function queueScroll() {
    if (!frame) frame = requestAnimationFrame(updateScroll);
  }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll, { passive: true });
  finePointer.addEventListener('change', () => { photo.style.removeProperty('--photo-y'); queueScroll(); });

  function updatePreference() {
    body.classList.toggle('motion-enabled', enabled());
    body.classList.toggle('motion-paused', !enabled());
    control.textContent = enabled() ? 'Pause animations' : reduced.matches ? 'Enable animations' : 'Resume animations';
    control.setAttribute('aria-pressed', String(enabled()));
    if (!enabled()) {
      activeAnimations.forEach(animation => animation.cancel());
      settleDisclosures.forEach(finish => finish());
      photo.style.removeProperty('--photo-y');
    }
    queueScroll();
  }
  control.addEventListener('click', () => {
    preference = enabled() ? 'off' : 'on';
    try { localStorage.setItem('plumber-motion', preference); } catch { /* Storage is optional. */ }
    updatePreference();
  });
  reduced.addEventListener('change', updatePreference);
  updatePreference();
}
