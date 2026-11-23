export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function bodyOf(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) || {}; } catch { return {}; }
  }
  return req.body && typeof req.body === 'object' ? req.body : {};
}

export function sameOrigin(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) return false;
  const origin = req.headers.origin;
  if (!origin) return req.headers['sec-fetch-site'] !== 'cross-site';
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return new URL(origin).host === host;
  } catch { return false; }
}

export const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
