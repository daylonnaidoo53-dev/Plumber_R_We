import { initMotion } from './motion.js';

document.body.classList.add('js-enabled');
document.getElementById('year').textContent = new Date().getFullYear();
initMotion();

// Service-card actions carry the chosen service into the enquiry form.
document.querySelectorAll('.service-link').forEach(link => {
  link.addEventListener('click', () => {
    const title = link.closest('.service-card').querySelector('h3').textContent;
    const service = document.getElementById('service');
    const option = [...service.options].find(item => item.textContent === title
      || (title === 'Leak Detection & Repair' && item.textContent === 'Leak Detection'));
    if (option) service.value = option.value;
  });
});
