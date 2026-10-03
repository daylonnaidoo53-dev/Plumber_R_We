const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../public');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    // Reserved Firebase configuration is supplied by Hosting, not this preview.
    if (pathname.startsWith('/__/')) { response.writeHead(404).end(); return; }
    let target = file;
    try {
      if (!(await fs.stat(target)).isFile()) target = path.join(root, 'index.html');
    } catch {
      if (path.extname(pathname)) { response.writeHead(404).end(); return; }
      target = path.join(root, 'index.html');
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(await fs.readFile(target));
  } catch { response.writeHead(400).end(); }
});
let port = Number(process.env.PORT || 5000);
const firstPort = port;
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && !process.env.PORT && port < Math.min(firstPort + 10, 65535)) {
    console.log(`Port ${port} is in use; trying ${port + 1}.`);
    server.listen(++port, '127.0.0.1');
    return;
  }
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Stop the existing preview or choose another PORT.`
    : `Could not start preview: ${error.message}`);
  process.exitCode = 1;
});
server.on('listening', () => console.log(`Local preview: http://127.0.0.1:${port}`));
server.listen(port, '127.0.0.1');
