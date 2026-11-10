'use strict';

const crypto = require('node:crypto');
const { getConfig, isExpectedHost, sendText } = require('../lib/cms-oauth');

module.exports = function auth(req, res) {
  const config = getConfig();
  if (!config) {
    return sendText(res, 503, 'CMS OAuth is not configured. Set the required Vercel environment variables.');
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendText(res, 405, 'Method not allowed.');
  }
  if (!isExpectedHost(req, config.callback)) {
    return sendText(res, 403, 'CMS authentication is only available on the configured site domain.');
  }

  const url = new URL(req.url, config.callback.origin);
  const provider = url.searchParams.get('provider');
  const siteId = url.searchParams.get('site_id');
  if ((provider && provider !== 'github') || (siteId && siteId !== config.callback.hostname)) {
    return sendText(res, 400, 'Invalid CMS authentication request.');
  }

  const state = crypto.randomBytes(32).toString('base64url');
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', config.clientId);
  authorizeUrl.searchParams.set('redirect_uri', config.callbackUrl);
  authorizeUrl.searchParams.set('scope', 'public_repo');
  authorizeUrl.searchParams.set('state', state);

  res.setHeader(
    'Set-Cookie',
    `bm_cms_oauth_state=${state}; Path=/callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
  );
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 302;
  res.setHeader('Location', authorizeUrl.toString());
  res.end();
};
