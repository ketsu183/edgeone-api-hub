// EdgeOne Pages Cloud Function - Telegram Bot API Proxy
import https from 'node:https';
import http from 'node:http';

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/telegram/, '');
  const targetUrl = 'https://api.telegram.org' + targetPath + url.search;

  try {
    const resp = await fetchWithTimeout(targetUrl, {
      method: request.method,
      headers: Object.fromEntries(request.headers),
      body: ['GET', 'HEAD'].includes(request.method) ? null : await request.text(),
      timeout: 25000
    });

    const headers = new Headers(resp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, DELETE, PATCH');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('X-Proxy-By', 'EdgeOne Cloud Functions');

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: err.message,
      code: err.code
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

function fetchWithTimeout(url, options) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method,
      headers: options.headers,
      timeout: options.timeout || 25000
    };

    // 删除host头，避免冲突
    delete reqOptions.headers['host'];
    delete reqOptions.headers['Host'];

    const req = client.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}
