// EdgeOne Pages Cloud Function - Telegram Bot API Proxy
// File: node-functions/telegram/[[default]].js
// Route: /telegram/* -> https://api.telegram.org/*

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const targetPath = url.pathname.replace(/^\/telegram/, '');
  const targetUrl = 'https://api.telegram.org' + targetPath + url.search;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: headers,
    body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    redirect: 'follow'
  });

  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT, DELETE, PATCH');
  newHeaders.set('Access-Control-Allow-Headers', '*');
  newHeaders.set('X-Proxy-By', 'EdgeOne Cloud Functions');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
