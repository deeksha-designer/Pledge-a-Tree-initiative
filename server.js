const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 4173;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'data', 'pledges.json');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

function readData() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return { count: Number(parsed.count) || 0, pledges: Array.isArray(parsed.pledges) ? parsed.pledges : [] };
  } catch {
    return { count: 0, pledges: [] };
  }
}

function writeData(data) {
  const temporary = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(data, null, 2));
  fs.renameSync(temporary, DATA_FILE);
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(body));
}

function bodyFrom(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 16_384) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function validName(value) {
  return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 80;
}

function validPhone(value) {
  return typeof value === 'string' && /^[+()\d\s-]{8,18}$/.test(value.trim());
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/pledges' && req.method === 'GET') {
    return json(res, 200, { count: readData().count });
  }

  if (url.pathname === '/api/pledges' && req.method === 'POST') {
    try {
      const input = await bodyFrom(req);
      if (!validName(input.name) || !validPhone(input.phone) || typeof input.city !== 'string' || !input.consent) {
        return json(res, 400, { message: 'Please complete all required fields correctly.' });
      }
      const data = readData();
      data.count += 1;
      data.pledges.push({
        id: crypto.randomUUID(),
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: typeof input.email === 'string' ? input.email.trim().slice(0, 120) : '',
        city: input.city.trim().slice(0, 80),
        createdAt: new Date().toISOString()
      });
      writeData(data);
      return json(res, 201, { count: data.count, message: 'Your pledge is now part of the growing canopy.' });
    } catch {
      return json(res, 400, { message: 'We could not save your pledge. Please try again.' });
    }
  }

  if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { message: 'Method not allowed' });
  const requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
  const file = path.resolve(PUBLIC_DIR, requested);
  if (!file.startsWith(`${path.resolve(PUBLIC_DIR)}${path.sep}`) && file !== path.join(PUBLIC_DIR, 'index.html')) {
    return json(res, 403, { message: 'Forbidden' });
  }
  fs.readFile(file, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (fallbackError, fallback) => {
          if (fallbackError) return json(res, 404, { message: 'Not found' });
          res.writeHead(200, { 'Content-Type': MIME['.html'] });
          res.end(req.method === 'HEAD' ? undefined : fallback);
        });
        return;
      }
      return json(res, 500, { message: 'Server error' });
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  });
});

server.listen(PORT, () => console.log(`JK Maxx Pledge page running at http://localhost:${PORT}`));
