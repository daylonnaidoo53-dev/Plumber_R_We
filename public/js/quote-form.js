// Firebase configuration — REPLACE with your values from Firebase Console
// Get them from: Firebase Console → Project Settings → Your apps → Web app
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "plumber-r-we-87724.firebaseapp.com",
  projectId: "plumber-r-we-87724",
  storageBucket: "plumber-r-we-87724.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('quote-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn?.querySelector('.btn-text');
const loadedAt = Date.now();

function showError(fieldName, message) {
  const input = form.querySelector(`[name="${fieldName}"]`);
  const errEl = form.querySelector(`.error[data-for="${fieldName}"]`);
  if (input) input.classList.add('invalid');
  if (errEl) errEl.textContent = message;
}

function clearErrors() {
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  form.querySelectorAll('.error').forEach(el => el.textContent = '');
}

function validate(data) {
  clearErrors();
  let valid = true;

  if (!data.name.trim()) { showError('name', 'Please tell us your name.'); valid = false; }
  if (!data.phone.trim()) { showError('phone', 'We need a number to reach you.'); valid = false; }
  else if (!/^[\d\s+()-]{7,}$/.test(data.phone)) { showError('phone', 'Please enter a valid phone number.'); valid = false; }
  if (!data.suburb.trim()) { showError('suburb', 'Which suburb are you in?'); valid = false; }
  if (!data.service) { showError('service', 'Please pick a service.'); valid = false; }
  if (!data.urgency) { showError('urgency', 'How urgent is the job?'); valid = false; }
  if (!form.consent.checked) { showError('consent', 'Please tick the consent box.'); valid = false; }

  return valid;
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot check
    const honeypot = form.querySelector('[name="website"]').value;
    if (honeypot) return;

    // Minimum time on form (blocks bots)
    if (Date.now() - loadedAt < 3000) {
      alert('Please take a moment to fill in the form.');
      return;
    }

    const data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      suburb: form.suburb.value.trim(),
      service: form.service.value,
      urgency: form.urgency.value,
      message: form.message.value.trim(),
      source: 'website'
    };

    if (!validate(data)) return;

    submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Sending…';

    try {
      await addDoc(collection(db, 'leads'), {
        ...data,
        createdAt: serverTimestamp()
      });
      window.location.href = '/thank-you/';
    } catch (err) {
      console.error('Submission error:', err);
      alert('Sorry — something went wrong. Please call us instead on 000 000 0000.');
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = 'Send my request';
    }
  });
}