#!/usr/bin/env node
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
};

http.createServer((req, res) => {
  const file = path.join(ROOT, req.url === '/' ? 'accessorials-form.html' : req.url);
  const ext  = path.extname(file);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Demos server running at http://localhost:${PORT}`);
});
