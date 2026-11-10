'use strict';

const {
  clearStateCookie,
  getConfig,
  isExpectedHost,
  requestUrl,
  sendPopup,
  sendText,
  validState,
} = require('../lib/cms-oauth');

async function revokeToken(config, token) {
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const response = await fetch(
    `https://api.github.com/applications/${encodeURIComponent(config.clientId)}/grant`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Brew-Masters-CMS',
      },
      body: JSON.stringify({ access_token: token }),
    },
  );
  if (!response.ok) {
    console.error('Could not revoke an OAuth token for a non-allowlisted CMS user:', response.status);
  }
}

module.exports = async function callback(req, res) {
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

  const url = requestUrl(req);
  if (!validState(req, url.searchParams.get('state'))) {
    return sendText(res, 400, 'GitHub sign-in state could not be verified. Close this window and try again.');
  }
  clearStateCookie(res);

  if (url.searchParams.has('error')) {
    return sendPopup(res, 400, 'error', { message: 'GitHub sign-in was cancelled or denied.' }, config.callback.origin);
  }

  const code = url.searchParams.get('code');
  if (!code || code.length > 512) {
    return sendPopup(res, 400, 'error', { message: 'GitHub did not return a valid sign-in code.' }, config.callback.origin);
  }

  let tokenResponse;
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Brew-Masters-CMS',
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.callbackUrl,
      }),
    });
    if (!response.ok) {
      return sendPopup(res, 502, 'error', { message: 'GitHub could not complete sign-in. Please try again.' }, config.callback.origin);
    }
    tokenResponse = await response.json();
  } catch {
    return sendPopup(res, 502, 'error', { message: 'Could not reach GitHub to complete sign-in.' }, config.callback.origin);
  }

  if (!tokenResponse.access_token) {
    return sendPopup(res, 502, 'error', { message: 'GitHub did not return an access token.' }, config.callback.origin);
  }

  let user;
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${tokenResponse.access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Brew-Masters-CMS',
      },
    });
    if (!response.ok) {
      return sendPopup(res, 502, 'error', { message: 'GitHub could not verify the account. Please try again.' }, config.callback.origin);
    }
    user = await response.json();
  } catch {
    return sendPopup(res, 502, 'error', { message: 'Could not verify the GitHub account.' }, config.callback.origin);
  }

  if (!user.login || !config.allowedUsers.includes(user.login.toLowerCase())) {
    try {
      await revokeToken(config, tokenResponse.access_token);
    } catch {
      console.error('Could not revoke an OAuth token for a non-allowlisted CMS user.');
    }
    return sendPopup(
      res,
      403,
      'error',
      { message: 'This GitHub account is not on the CMS editor allowlist.' },
      config.callback.origin,
    );
  }

  return sendPopup(
    res,
    200,
    'success',
    { token: tokenResponse.access_token, provider: 'github' },
    config.callback.origin,
  );
};
