const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('public/js/quote-form.js', 'utf8');
function setup({ invalid = false, fail = false } = {}) {
  let handler;
  let writes = 0;
  let resets = 0;
  let focused = false;
  const field = { name: 'name', value: '  Alice  ', type: 'text', willValidate: true,
    checkValidity: () => !invalid, validationMessage: 'Required',
    setAttribute() {}, classList: { toggle() {} }, focus() { focused = true; } };
  const message = { textContent: '' };
  const status = { textContent: '', focus() {} };
  const label = { textContent: '' };
  const button = { disabled: false, querySelector: () => label };
  const form = { elements: Object.assign([field], { namedItem: () => ({ value: '' }) }),
    querySelectorAll: () => [message], querySelector: () => message,
    addEventListener: (_, callback) => { handler = callback; },
    setAttribute() {}, removeAttribute() {}, reset() { resets++; } };
  const context = vm.createContext({ document: { getElementById: id => ({ 'quote-form': form, 'submit-btn': button, 'form-status': status })[id] },
    FormData: class { get(key) { return key === 'name' ? field.value : 'test'; } }, console: { error() {} } });
  vm.runInContext(source, context);
  context.testDatabase = { db: {}, firestore: {
    collection: () => ({}), serverTimestamp: () => 'timestamp',
    addDoc: async (_, data) => { writes++; assert.equal(data.name, 'Alice'); assert.equal(data.consent, true); if (fail) throw new Error('offline'); }
  } };
  vm.runInContext('database = testDatabase', context);
  return { context, status, button, field, handler, get writes() { return writes; }, get resets() { return resets; }, get focused() { return focused; } };
}

test('invalid fields prevent a database write and receive focus', async () => {
  const app = setup({ invalid: true });
  await app.handler({ preventDefault() {} });
  assert.equal(app.writes, 0);
  assert.equal(app.focused, true);
});
test('successful requests are confirmed inline and reset the form', async () => {
  const app = setup();
  await app.handler({ preventDefault() {} });
  assert.equal(app.writes, 1);
  assert.equal(app.resets, 1);
  assert.match(app.status.textContent, /received/);
  assert.equal(app.button.disabled, false);
});
test('failed requests preserve details and allow retry', async () => {
  const app = setup({ fail: true });
  await app.handler({ preventDefault() {} });
  assert.equal(app.resets, 0);
  assert.match(app.status.textContent, /could not be sent/);
  assert.equal(app.button.disabled, false);
});
test('concurrent submissions produce one database write', async () => {
  const app = setup();
  await Promise.all([app.handler({ preventDefault() {} }), app.handler({ preventDefault() {} })]);
  assert.equal(app.writes, 1);
});
test('Hosting serves the single page and redirects the old confirmation route', () => {
  const config = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
  assert.equal(config.hosting.public, 'public');
  assert.equal(config.hosting.rewrites[0].destination, '/index.html');
  assert.equal(config.hosting.redirects[0].destination, '/#quote');
  assert.equal(fs.existsSync('public/thank-you/index.html'), false);
  const html = fs.readFileSync('public/index.html', 'utf8');
  for (const match of html.matchAll(/(?:href|src)="(\/(?:css|js|images)\/[^"#]+)"/g)) {
    assert.ok(fs.existsSync('public' + match[1]), match[1]);
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(html.includes('id="' + match[1] + '"'), match[1]);
  }
});
