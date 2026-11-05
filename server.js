const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
http.createServer((req,res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index' : pathname));
  if (!file.startsWith(root + path.sep) || pathname.includes('/.')) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err,data) => {
    if(err) {res.writeHead(404); return res.end('Not found');}
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(data);
  });
}).listen(process.env.PORT || 3000, '0.0.0.0');
