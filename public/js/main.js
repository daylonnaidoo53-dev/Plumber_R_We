// Auto-update footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Smooth-close mobile nav on link click (future-proof)
document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', () => {
    // placeholder for mobile menu close
  });
});