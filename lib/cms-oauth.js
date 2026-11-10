'use strict';

const crypto = require('node:crypto');
const STATE_COOKIE = 'bm_cms_oauth_state';

function getConfig() {
  const callbackUrl = process.env.GITHUB_OAUTH_CALLBACK_URL;
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const allowedUsers = (process.env.CMS_ALLOWED_USERS || '')
    .split(',')
    .map((user) => user.trim().toLowerCase())
    .filter(Boolean);

  if (!callbackUrl || !clientId || !clientSecret || !allowedUsers.length) {
    return null;
  }

  let callback;
  try {
    callback = new URL(callbackUrl);
  } catch {
    return null;
  }

  if (
    callback.protocol !== 'https:' ||
    callback.pathname !== '/callback' ||
    callback.search ||
    callback.hash
  ) {
    return null;
  }

  return { callbackUrl, callback, clientId, clientSecret, allowedUsers };
}

function setSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );
}

function isExpectedHost(req, callback) {
  const host = String(req.headers.host || '').split(':')[0].toLowerCase();
  return host === callback.hostname.toLowerCase();
}

function requestUrl(req) {
  return new URL(req.url, 'https://www.brewmastersacademy.co.ke');
}

function sendText(res, status, message) {
  setSecurityHeaders(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(message);
}

function sendPopup(res, status, type, payload, origin) {
  setSecurityHeaders(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const result = `authorization:github:${type}:${JSON.stringify(payload)}`;
  const scriptResult = JSON.stringify(result).replace(/</g, '\\u003c');
  const scriptOrigin = JSON.stringify(origin);
  res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>GitHub sign-in</title><body><p>Completing sign-in…</p><script>
    const origin = ${scriptOrigin};
    const result = ${scriptResult};
    if (!window.opener) { document.body.textContent = 'Sign-in window is no longer available. Close this window and try again.'; }
    else {
      window.opener.postMessage('authorizing:github', origin);
      window.addEventListener('message', function (event) {
        if (event.source !== window.opener || event.origin !== origin || event.data !== 'authorizing:github') return;
        window.opener.postMessage(result, origin);
        window.close();
      });
    }
  </script></body></html>`);
}

function parseCookies(header) {
  return String(header || '').split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator > 0) {
      cookies[part.slice(0, separator).trim()] = part.slice(separator + 1).trim();
    }
    return cookies;
  }, {});
}

function validState(req, suppliedState) {
  const cookieState = parseCookies(req.headers.cookie)[STATE_COOKIE];
  if (!cookieState || !suppliedState || cookieState.length !== suppliedState.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(cookieState), Buffer.from(suppliedState));
}

function clearStateCookie(res) {
  res.setHeader('Set-Cookie', `${STATE_COOKIE}=; Path=/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}

module.exports = {
  STATE_COOKIE,
  clearStateCookie,
  getConfig,
  isExpectedHost,
  parseCookies,
  requestUrl,
  sendPopup,
  sendText,
  validState,
};
