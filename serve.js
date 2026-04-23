const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3456;
const BASE_DIR = path.join(__dirname, 'out');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
};

function resolvePath(urlPath) {
  let filePath = path.join(BASE_DIR, urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath));

  // If it's a directory, try index.html inside it first
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexFile = path.join(filePath, 'index.html');
    if (fs.existsSync(indexFile)) {
      return indexFile;
    }
    // Next.js static export creates .html files alongside directories
    const htmlFile = filePath + '.html';
    if (fs.existsSync(htmlFile)) {
      return htmlFile;
    }
    return filePath;
  }

  // If no extension, try .html (Next.js trailingSlash: false behavior)
  if (!path.extname(filePath)) {
    const htmlFile = filePath + '.html';
    if (fs.existsSync(htmlFile)) {
      return htmlFile;
    }
    // Also try as directory with index.html
    const indexFile = path.join(filePath, 'index.html');
    if (fs.existsSync(indexFile)) {
      return indexFile;
    }
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url);

  // Security: prevent directory traversal
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error: ' + err.message);
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving: ${BASE_DIR}`);
});
