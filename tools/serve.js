// Kleiner lokaler Server zum Testen am PC: node tools/serve.js  →  http://localhost:8080
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
};

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  // Entwicklerwerkzeuge (tools/vo-align.html) speichern Ergebnisse nur nach audio/_raw/ und nur von diesem PC aus
  if (req.method === 'PUT') {
    const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
    if (!local || !file.startsWith(path.join(ROOT, 'audio', '_raw') + path.sep)) { res.writeHead(403); return res.end(); }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => fs.writeFile(file, Buffer.concat(chunks), err => { res.writeHead(err ? 500 : 204); res.end(); }));
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Fitnessplaner läuft auf http://localhost:${PORT}`));
