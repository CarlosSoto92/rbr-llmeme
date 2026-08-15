// server.js
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { planMemeResponse } from './src/planner.js';
import { MEME_TEMPLATES, DEFAULT_FALLBACK_EMOJI } from './src/templates.js';

// Auto-load .env if present
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {
  // Ignore missing .env
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end();
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // API: GET /api/templates
  if (req.method === 'GET' && req.url === '/api/templates') {
    return sendJson(res, 200, { templates: Object.values(MEME_TEMPLATES) });
  }

  // API: POST /chat
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy(); // 1MB limit
    });

    req.on('end', async () => {
      try {
        let userMessage = '';
        try {
          const parsed = JSON.parse(body || '{}');
          userMessage = parsed.message || '';
        } catch {
          userMessage = '';
        }

        const botResponse = await planMemeResponse(userMessage);
        return sendJson(res, 200, botResponse);
      } catch (err) {
        console.error('[server] Error handling /chat:', err.message);
        // Absolute fail-safe: NEVER return text error, return emoji or fallback
        return sendJson(res, 200, {
          type: 'emoji',
          emoji: DEFAULT_FALLBACK_EMOJI
        });
      }
    });
    return;
  }

  // Static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`🚀 LLMeme server running at http://localhost:${PORT}`);
});
