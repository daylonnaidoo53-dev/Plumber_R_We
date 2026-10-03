const form = document.getElementById('quote-form');
const button = document.getElementById('submit-btn');
const status = document.getElementById('form-status');
let database;
let sending = false;
async function connect() {
  const response = await fetch('/__/firebase/init.json');
  if (!response.ok) throw new Error('Firebase configuration unavailable');
  const config = await response.json();
  if (!config.apiKey || !config.projectId || !config.appId) throw new Error('Incomplete Firebase configuration');
  const [app, firestore] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
  ]);
  database = { db: firestore.getFirestore(app.initializeApp(config)), firestore };
  return database;
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending || form.elements.namedItem('website').value) return;
  status.textContent = '';
  form.querySelectorAll('.error').forEach(element => { element.textContent = ''; });
  let firstInvalid;
  for (const field of form.elements) {
    if (!field.willValidate) continue;
    if (typeof field.value === 'string' && field.type !== 'checkbox') field.value = field.value.trim();
    const invalid = !field.checkValidity();
    field.setAttribute('aria-invalid', String(invalid));
    field.classList.toggle('invalid', invalid);
    const error = form.querySelector(`.error[data-for="${field.name}"]`);
    if (error) error.textContent = invalid ? field.validationMessage : '';
    if (invalid && !firstInvalid) firstInvalid = field;
  }
  if (firstInvalid) {
    status.textContent = 'Please check the highlighted fields.';
    firstInvalid.focus();
    return;
  }
  const values = new FormData(form);
  const data = Object.fromEntries(['name', 'phone', 'email', 'suburb', 'service', 'urgency', 'message'].map(key => [key, values.get(key)]));
  sending = true;
  button.disabled = true;
  button.querySelector('.btn-text').textContent = 'Sending…';
  form.setAttribute('aria-busy', 'true');
  try {
    const { db, firestore } = database || await connect();
    await firestore.addDoc(firestore.collection(db, 'leads'), {
      ...data, consent: true, source: 'website', createdAt: firestore.serverTimestamp()
    });
    form.reset();
    status.textContent = 'Thank you — your request has been received. Our team will contact you during business hours.';
    status.focus();
  } catch (error) {
    console.error('Quote submission failed:', error);
    status.textContent = 'Your request could not be sent. Your details are still here. Please try again or use the contact details alongside the form.';
    status.focus();
  } finally {
    sending = false;
    button.disabled = false;
    button.querySelector('.btn-text').textContent = 'Send my request';
    form.removeAttribute('aria-busy');
  }
});
