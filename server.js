const http = require('http');
const fs = require('fs');
const path = require('path');

const submissionsFile = path.join(__dirname, 'contact_submissions.json');

function readSubmissions() {
  try {
    const text = fs.readFileSync(submissionsFile, 'utf8');
    return text.trim() ? JSON.parse(text) : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    console.error('Read error:', error);
    return [];
  }
}

function writeSubmissions(data) {
  fs.writeFileSync(submissionsFile, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.url === '/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const submission = {
          id: `id-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
          name: String(payload.name || '').trim(),
          email: String(payload.email || '').trim(),
          service: String(payload.service || '').trim(),
          message: String(payload.message || '').trim(),
          timestamp: new Date().toISOString()
        };
        const submissions = readSubmissions();
        submissions.push(submission);
        writeSubmissions(submissions);
        sendJson(res, 200, { success: true, submission });
      } catch (error) {
        console.error('Submit error:', error);
        sendJson(res, 400, { success: false, error: error.message });
      }
    });
    return;
  }

  sendJson(res, 404, { success: false, error: 'Not found' });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
