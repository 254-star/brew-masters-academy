'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const auth = require('../api/auth');
const callback = require('../api/callback');

const envNames = [
  'GITHUB_OAUTH_CALLBACK_URL',
  'GITHUB_OAUTH_CLIENT_ID',
  'GITHUB_OAUTH_CLIENT_SECRET',
  'CMS_ALLOWED_USERS',
];

function configureEnv(overrides) {
  const previous = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  envNames.forEach((name) => delete process.env[name]);
  Object.assign(process.env, overrides);
  return () => {
    envNames.forEach((name) => {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    });
  };
}

function response() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body = '') {
      this.body = body;
    },
  };
}

const config = {
  GITHUB_OAUTH_CALLBACK_URL: 'https://www.brewmastersacademy.co.ke/callback',
  GITHUB_OAUTH_CLIENT_ID: 'test-client-id',
  GITHUB_OAUTH_CLIENT_SECRET: 'test-client-secret',
  CMS_ALLOWED_USERS: 'Editor-One',
};

test('OAuth login stays disabled until all required settings exist', () => {
  const restore = configureEnv({});
  try {
    const res = response();
    auth({ method: 'GET', url: '/auth', headers: { host: 'www.brewmastersacademy.co.ke' } }, res);
    assert.equal(res.statusCode, 503);
    assert.match(res.body, /not configured/);
  } finally {
    restore();
  }
});

test('OAuth login redirects to GitHub with a scoped request and one-time state cookie', () => {
  const restore = configureEnv(config);
  try {
    const res = response();
    auth({
      method: 'GET',
      url: '/auth?provider=github&site_id=www.brewmastersacademy.co.ke',
      headers: { host: 'www.brewmastersacademy.co.ke' },
    }, res);
    const location = new URL(res.headers.Location);
    assert.equal(res.statusCode, 302);
    assert.equal(location.origin, 'https://github.com');
    assert.equal(location.searchParams.get('scope'), 'public_repo');
    assert.equal(location.searchParams.get('redirect_uri'), config.GITHUB_OAUTH_CALLBACK_URL);
    assert.match(res.headers['Set-Cookie'], /HttpOnly; Secure; SameSite=Lax/);
    assert.equal(location.searchParams.get('state').length, 43);
  } finally {
    restore();
  }
});

test('OAuth callback rejects invalid state before calling GitHub', async () => {
  const restore = configureEnv(config);
  const previousFetch = global.fetch;
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error('Unexpected GitHub request');
  };
  try {
    const res = response();
    await callback({
      method: 'GET',
      url: '/callback?code=test-code&state=wrong-state',
      headers: { host: 'www.brewmastersacademy.co.ke', cookie: 'bm_cms_oauth_state=expected-state' },
    }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = previousFetch;
    restore();
  }
});

test('OAuth callback returns the token only to an allowlisted GitHub user', async () => {
  const restore = configureEnv(config);
  const previousFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    if (url === 'https://github.com/login/oauth/access_token') {
      return { ok: true, json: async () => ({ access_token: 'gho_test-token' }) };
    }
    if (url === 'https://api.github.com/user') {
      assert.equal(options.headers.Authorization, 'Bearer gho_test-token');
      return { ok: true, json: async () => ({ login: 'editor-one' }) };
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    const res = response();
    await callback({
      method: 'GET',
      url: '/callback?code=test-code&state=valid-state',
      headers: { host: 'www.brewmastersacademy.co.ke', cookie: 'bm_cms_oauth_state=valid-state' },
    }, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.body, /authorization:github:success/);
    assert.match(res.body, /gho_test-token/);
    assert.match(res.body, /https:\/\/www\.brewmastersacademy\.co\.ke/);
    assert.match(res.headers['Set-Cookie'], /Max-Age=0/);
  } finally {
    global.fetch = previousFetch;
    restore();
  }
});

test('OAuth callback blocks and revokes tokens for users outside the allowlist', async () => {
  const restore = configureEnv(config);
  const previousFetch = global.fetch;
  const requests = [];
  global.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (url === 'https://github.com/login/oauth/access_token') {
      return { ok: true, json: async () => ({ access_token: 'gho_denied-token' }) };
    }
    if (url === 'https://api.github.com/user') {
      return { ok: true, json: async () => ({ login: 'not-an-editor' }) };
    }
    if (options.method === 'DELETE') return { ok: true };
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    const res = response();
    await callback({
      method: 'GET',
      url: '/callback?code=test-code&state=valid-state',
      headers: { host: 'www.brewmastersacademy.co.ke', cookie: 'bm_cms_oauth_state=valid-state' },
    }, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body, /authorization:github:error/);
    assert.doesNotMatch(res.body, /gho_denied-token/);
    assert.equal(requests.some(({ options }) => options.method === 'DELETE'), true);
  } finally {
    global.fetch = previousFetch;
    restore();
  }
});
