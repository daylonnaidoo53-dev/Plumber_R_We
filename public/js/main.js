import { initMotion } from './motion.js';

document.body.classList.add('js-enabled');
document.getElementById('year').textContent = new Date().getFullYear();
const motion = initMotion();
const navLinks = [...document.querySelectorAll('.main-nav a')];
const header = document.querySelector('.site-header');
const dialog = document.getElementById('contact-dialog');
let contactOpener;
let contactAnimation;
let contactVersion = 0;
let navigationVersion = 0;

function setActive(id) {
  navLinks.forEach(link => {
    const active = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function chooseService(link) {
  const title = link.dataset.service || link.closest('.service-card')?.querySelector('h3').textContent;
  if (!title) return;
  const service = document.getElementById('service');
  const option = [...service.options].find(item => item.textContent === title
    || (title === 'Leak Detection & Repair' && item.textContent === 'Leak Detection'));
  if (!option) return;
  service.value = option.value;
  service.dispatchEvent(new Event('change', { bubbles: true }));
}
const service = document.getElementById('service');
service.addEventListener('change', () => {
  const caption = document.querySelector('.form-heading p');
  caption.textContent = service.value ? `Selected: ${service.value}. Add your details below.` : 'A few details and we’ll take it from here.';
  motion.animate(service, [{ boxShadow: '0 0 0 5px #a4ba5c60' }, { boxShadow: '0 0 0 0px #a4ba5c00' }], { duration: 850 });
});
document.getElementById('quote-form').addEventListener('reset', () => {
  document.querySelector('.form-heading p').textContent = 'A few details and we’ll take it from here.';
});
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.target.closest('a')) return;
    card.querySelector('.service-link').click();
  });
});
document.querySelectorAll('[data-area]').forEach(button => {
  button.addEventListener('click', () => {
    document.getElementById('suburb').value = button.dataset.area;
    document.querySelector('.form-heading p').textContent = `You're enquiring from ${button.dataset.area}. Add your details below.`;
    navigate(document.getElementById('quote'));
  });
});

async function closeContact(restoreFocus = true) {
  const version = ++contactVersion;
  contactAnimation?.cancel();
  contactAnimation = motion.animate(dialog, [
    { opacity: 1, transform: 'translateY(0) scale(1)' },
    { opacity: 0, transform: 'translateY(12px) scale(.98)' }
  ], { duration: 180, fill: 'both' });
  if (contactAnimation) await contactAnimation.finished.catch(() => {});
  if (version !== contactVersion) return;
  dialog.close();
  contactAnimation?.cancel();
  if (restoreFocus) contactOpener?.focus({ preventScroll: true });
}
function openContact(link) {
  ++contactVersion;
  contactAnimation?.cancel();
  contactOpener = link;
  const href = link.getAttribute('href');
  const channel = href.startsWith('tel:') ? 'phone number' : href.startsWith('mailto:') ? 'email address' : 'WhatsApp number';
  document.getElementById('contact-title').textContent = 'Contact details coming soon.';
  document.getElementById('contact-description').textContent = `Our business ${channel} is being finalised. Use the quote form to tell us about your plumbing needs.`;
  if (!dialog.open) dialog.showModal();
  contactAnimation = motion.animate(dialog, [
    { opacity: 0, transform: 'translateY(24px) scale(.96)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' }
  ], { duration: 420 });
}
dialog.querySelectorAll('.dialog-close, .dialog-dismiss').forEach(button => button.addEventListener('click', () => closeContact()));
dialog.addEventListener('cancel', event => { event.preventDefault(); closeContact(); });
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closeContact();
});

async function navigate(target, updateHistory = true) {
  const version = ++navigationVersion;
  if (dialog.open) await closeContact(false);
  await motion.closeMenu();
  if (version !== navigationVersion) return;
  const destination = target.id === 'quote' ? document.getElementById('quote-form') : target;
  const focusTarget = target.id === 'quote' ? document.getElementById('name') : target.querySelector('h2') || target;
  if (!focusTarget.hasAttribute('tabindex') && focusTarget.tagName !== 'INPUT') focusTarget.tabIndex = -1;
  // Focus is explicit, so keyboard users arrive at the same destination as pointer users.
  focusTarget.focus({ preventScroll: true });
  const top = target.id === 'main' ? 0 : destination.getBoundingClientRect().top + window.scrollY - header.getBoundingClientRect().height - 20;
  window.scrollTo({ top: Math.max(0, top), behavior: motion.enabled() ? 'smooth' : 'instant' });
  if (updateHistory && location.hash !== `#${target.id}`) history.pushState(null, '', `#${target.id}`);
  setActive(target.id);
}
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href') || '';
  if (href === 'tel:+27000000000' || href.includes('wa.me/27000000000') || link.hasAttribute('data-contact-placeholder')) {
    event.preventDefault();
    openContact(link);
    return;
  }
  if (!href.startsWith('#')) return;
  const target = document.getElementById(href.slice(1));
  if (!target) return;
  event.preventDefault();
  chooseService(link);
  navigate(target);
});
window.addEventListener('popstate', () => {
  const target = document.getElementById(location.hash.slice(1) || 'main');
  if (target) navigate(target, false);
});
// Track the section at the reading line as the visitor scrolls through the page.
let spyFrame;
function updateActive() {
  spyFrame = 0;
  const readingLine = header.getBoundingClientRect().bottom + 120;
  const sections = navLinks.map(link => document.getElementById(link.hash.slice(1)));
  let nearest;
  let nearestTop = -Infinity;
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= readingLine && rect.top > nearestTop) { nearest = section; nearestTop = rect.top; }
  });
  setActive(nearest?.id || 'main');
}
window.addEventListener('scroll', () => {
  if (!spyFrame) spyFrame = requestAnimationFrame(updateActive);
}, { passive: true });
updateActive();
