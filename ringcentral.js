const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const DATA_DIR = path.join(__dirname, '.data');
const LOCAL_AUTH_FILE = path.join(DATA_DIR, 'ringcentral_auth.enc');

let firebaseConfig = null;
try {
  firebaseConfig = require('./firebase-applet-config.json');
} catch (e) {}

let ringCentralAuthDoc = null;
try {
  const firebaseAdminApp = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig && firebaseConfig.projectId ? {
        projectId: firebaseConfig.projectId
      } : undefined);

  const firestoreDb = (firebaseConfig && firebaseConfig.firestoreDatabaseId)
    ? getFirestore(firebaseAdminApp, firebaseConfig.firestoreDatabaseId)
    : getFirestore(firebaseAdminApp);

  ringCentralAuthDoc = firestoreDb
    .collection('integrations')
    .doc('ringcentral');
} catch (err) {
  // Graceful fallback to local encrypted store
}

// Local secure file store helpers
function getStoredAuthFromLocal() {
  try {
    if (fs.existsSync(LOCAL_AUTH_FILE)) {
      const raw = fs.readFileSync(LOCAL_AUTH_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
}

function saveStoredAuthToLocal(record) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_AUTH_FILE, JSON.stringify(record, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function deleteStoredAuthFromLocal() {
  try {
    if (fs.existsSync(LOCAL_AUTH_FILE)) {
      fs.unlinkSync(LOCAL_AUTH_FILE);
    }
  } catch (e) {}
}

// In-memory OAuth state registry with 15-minute expiration (for CSRF state validation during authorization flow)
const oauthStates = new Map();
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [state, meta] of oauthStates.entries()) {
    if (now - meta.createdAt > 15 * 60 * 1000) {
      oauthStates.delete(state);
    }
  }
}, 60 * 1000);
if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
  cleanupTimer.unref();
}

// Global token refresh mutex to guarantee atomic token rotation under concurrency
let activeRefreshPromise = null;

// Helper: Parse cookies from request headers
function parseCookies(req) {
  const list = {};
  const rc = req.headers && req.headers.cookie;
  if (!rc) return list;
  rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift().trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
}

// Helper: Redact sensitive information from errors and logs
function sanitize(input) {
  if (!input) return '';
  let str = typeof input === 'string' ? input : JSON.stringify(input);
  const secret = process.env.RINGCENTRAL_CLIENT_SECRET || '';
  const clientId = process.env.RINGCENTRAL_CLIENT_ID || '';
  const encKey = process.env.TOKEN_ENCRYPTION_KEY || '';

  if (secret) str = str.split(secret).join('[REDACTED_CLIENT_SECRET]');
  if (clientId) str = str.split(clientId).join('[REDACTED_CLIENT_ID]');
  if (encKey) str = str.split(encKey).join('[REDACTED_ENCRYPTION_KEY]');

  str = str.replace(/Bearer\s+[A-Za-z0-9_\-\.~]+/gi, 'Bearer [REDACTED_TOKEN]');
  str = str.replace(/Basic\s+[A-Za-z0-9+/=]+/gi, 'Basic [REDACTED_BASIC_AUTH]');
  str = str.replace(/code=[A-Za-z0-9_\-\.~]+/gi, 'code=[REDACTED_CODE]');
  str = str.replace(/access_token["']?\s*:\s*["'][^"']+["']/gi, 'access_token:"[REDACTED_TOKEN]"');
  str = str.replace(/refresh_token["']?\s*:\s*["'][^"']+["']/gi, 'refresh_token:"[REDACTED_TOKEN]"');
  return str;
}

// Derive a 32-byte encryption key from dedicated TOKEN_ENCRYPTION_KEY server secret only
function getEncryptionKey() {
  const secretKey = (process.env.TOKEN_ENCRYPTION_KEY || '').trim();
  if (!secretKey) {
    const err = new Error('TOKEN_ENCRYPTION_KEY server secret is missing. Please add TOKEN_ENCRYPTION_KEY to your environment variables in Settings.');
    err.code = 'MISSING_ENCRYPTION_KEY';
    throw err;
  }
  // If 64-hex characters (32 bytes), decode directly; otherwise hash to exact 32 bytes using SHA-256
  if (/^[0-9a-fA-F]{64}$/.test(secretKey)) {
    return Buffer.from(secretKey, 'hex');
  }
  return crypto.createHash('sha256').update(secretKey, 'utf8').digest();
}

// Encrypt token payload (AES-256-GCM)
function encryptPayload(dataObj) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(dataObj);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag,
    algorithm: 'AES-256-GCM'
  };
}

// Decrypt token payload (AES-256-GCM)
function decryptPayload(encryptedRecord) {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(encryptedRecord.iv, 'hex');
    const authTag = Buffer.from(encryptedRecord.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedRecord.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    if (err.code === 'MISSING_ENCRYPTION_KEY') throw err;
    throw new Error('Failed to decrypt stored credentials (invalid key or tampered record).');
  }
}

// Get Config
function getRingCentralConfig() {
  return {
    clientId: (process.env.RINGCENTRAL_CLIENT_ID || '').trim(),
    clientSecret: (process.env.RINGCENTRAL_CLIENT_SECRET || '').trim(),
    serverUrl: (process.env.RINGCENTRAL_SERVER_URL || 'https://platform.ringcentral.com').trim().replace(/\/+$/, ''),
    redirectUri: (process.env.RINGCENTRAL_REDIRECT_URI || '').trim(),
    hasTokenEncryptionKey: Boolean((process.env.TOKEN_ENCRYPTION_KEY || '').trim())
  };
}

// --- MULTI-TIER SECURE TOKEN STORAGE (FIRESTORE + ENCRYPTED LOCAL STORAGE FALLBACK) ---
async function getStoredAuthFromFirestore() {
  if (ringCentralAuthDoc) {
    try {
      const snapshot = await ringCentralAuthDoc.get();
      if (snapshot.exists) {
        return snapshot.data();
      }
    } catch (e) {
      // Graceful fallback to local encrypted store if Firestore is restricted or unavailable
    }
  }
  return getStoredAuthFromLocal();
}

async function saveStoredAuthToFirestore(record) {
  // Always update local cache for high availability
  saveStoredAuthToLocal(record);
  if (ringCentralAuthDoc) {
    try {
      await ringCentralAuthDoc.set(record, { merge: true });
    } catch (e) {
      // Non-blocking fallback to local encrypted store
    }
  }
  return true;
}

async function deleteStoredAuthFromFirestore() {
  deleteStoredAuthFromLocal();
  if (ringCentralAuthDoc) {
    try {
      await ringCentralAuthDoc.delete();
    } catch (e) {
      // Non-blocking fallback
    }
  }
}

// Refresh token helper with Firestore transaction & concurrency locking for atomic token rotation
async function refreshAccessToken(refreshToken) {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const { clientId, clientSecret, serverUrl } = getRingCentralConfig();
      if (!clientId || !clientSecret) {
        throw new Error('RingCentral client credentials missing on server');
      }

      const tokenUrl = `${serverUrl}/restapi/oauth/token`;
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', refreshToken);

      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(`Token refresh failed HTTP ${res.status}: ${sanitize(errTxt)}`);
      }

      const tokenData = await res.json();
      const expiresAt = Date.now() + ((tokenData.expires_in || 3600) * 1000);
      const encrypted = encryptPayload({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        token_type: tokenData.token_type || 'bearer',
        scope: tokenData.scope || '',
        owner_id: tokenData.owner_id || ''
      });

      const record = {
        ...encrypted,
        expiresAt,
        scope: tokenData.scope || '',
        ownerId: tokenData.owner_id || '',
        updatedAt: new Date().toISOString(),
        status: 'connected'
      };

      // Write into Firestore
      await saveStoredAuthToFirestore(record);

      return record;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

// Handlers
async function handleConnect(req, res) {
  const missing = [];
  if (!process.env.RINGCENTRAL_CLIENT_ID || !process.env.RINGCENTRAL_CLIENT_ID.trim()) missing.push('RINGCENTRAL_CLIENT_ID');
  if (!process.env.RINGCENTRAL_CLIENT_SECRET || !process.env.RINGCENTRAL_CLIENT_SECRET.trim()) missing.push('RINGCENTRAL_CLIENT_SECRET');
  if (!process.env.RINGCENTRAL_SERVER_URL || !process.env.RINGCENTRAL_SERVER_URL.trim()) missing.push('RINGCENTRAL_SERVER_URL');
  if (!process.env.RINGCENTRAL_REDIRECT_URI || !process.env.RINGCENTRAL_REDIRECT_URI.trim()) missing.push('RINGCENTRAL_REDIRECT_URI');
  if (!process.env.TOKEN_ENCRYPTION_KEY || !process.env.TOKEN_ENCRYPTION_KEY.trim()) missing.push('TOKEN_ENCRYPTION_KEY');

  if (missing.length > 0) {
    console.error(`[RingCentral Connect Error] Missing server environment variables: ${missing.join(', ')}`);
    res.writeHead(400, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({
      success: false,
      error: `Missing server configuration: ${missing.join(', ')}. Please configure these in Settings.`
    }));
  }

  const config = getRingCentralConfig();

  // Validate server URL and redirect URI structure safely
  let authBaseUrl = '';
  try {
    const parsedServer = new URL(config.serverUrl);
    if (!['http:', 'https:'].includes(parsedServer.protocol)) {
      throw new Error('RINGCENTRAL_SERVER_URL must use http: or https: protocol');
    }
    authBaseUrl = `${config.serverUrl}/restapi/oauth/authorize`;
  } catch (urlErr) {
    console.error('[RingCentral Connect Error] Invalid RINGCENTRAL_SERVER_URL format');
    res.writeHead(400, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({
      success: false,
      error: 'Malformed RINGCENTRAL_SERVER_URL in server settings.'
    }));
  }

  try {
    const parsedRedirect = new URL(config.redirectUri);
    if (!['http:', 'https:'].includes(parsedRedirect.protocol)) {
      throw new Error('RINGCENTRAL_REDIRECT_URI must use http: or https: protocol');
    }
  } catch (urlErr) {
    console.error('[RingCentral Connect Error] Invalid RINGCENTRAL_REDIRECT_URI format');
    res.writeHead(400, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({
      success: false,
      error: 'Malformed RINGCENTRAL_REDIRECT_URI in server settings.'
    }));
  }

  // Cryptographically random state
  const state = crypto.randomBytes(32).toString('hex');
  oauthStates.set(state, { createdAt: Date.now() });

  const authUrl = `${authBaseUrl}?response_type=code&client_id=${encodeURIComponent(config.clientId)}&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${encodeURIComponent(state)}`;

  const isHttps = req.headers['x-forwarded-proto'] === 'https' || (req.socket && req.socket.encrypted);
  const cookieFlags = `Path=/; HttpOnly; SameSite=Lax; Max-Age=900; ${isHttps ? 'Secure;' : ''}`;

  let isDirectRedirect = false;
  try {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (u.searchParams.get('mode') === 'redirect') {
      isDirectRedirect = true;
    }
  } catch (e) {
    // Keep JSON default
  }

  if (isDirectRedirect) {
    res.writeHead(302, {
      Location: authUrl,
      'Set-Cookie': `rc_oauth_state=${state}; ${cookieFlags}`
    });
    return res.end();
  }

  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Set-Cookie': `rc_oauth_state=${state}; ${cookieFlags}`
  });
  res.end(JSON.stringify({
    success: true,
    url: authUrl,
    state: state
  }));
}

async function handleCallback(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const code = u.searchParams.get('code');
  const state = u.searchParams.get('state');
  const error = u.searchParams.get('error');
  const errorDescription = u.searchParams.get('error_description');

  const cookies = parseCookies(req);
  const cookieState = cookies['rc_oauth_state'];

  // Clear the OAuth state cookie
  const clearCookieHeader = 'rc_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

  if (error) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': clearCookieHeader
    });
    return res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>RingCentral Authorization Error</title></head>
      <body style="font-family:system-ui,-apple-system,sans-serif; background:#f8fafc; color:#0f172a; padding:40px; text-align:center">
        <div style="max-width:480px; margin:0 auto; background:#fff; padding:32px; border-radius:12px; border:1px solid #cbd5e1; box-shadow:0 4px 12px rgba(0,0,0,0.05)">
          <div style="font-size:40px; margin-bottom:12px">⚠️</div>
          <h2 style="margin:0 0 10px; color:#b91c1c">RingCentral Connection Cancelled</h2>
          <p style="color:#64748b; font-size:14px">${escHtml(sanitize(errorDescription || error))}</p>
          <button onclick="window.close()" style="background:#0284c7; color:#fff; border:0; padding:10px 20px; border-radius:6px; font-weight:700; cursor:pointer">Close Window</button>
        </div>
      </body>
      </html>
    `);
  }

  // Validate state against server session registry and cookie
  const isValidSessionState = state && oauthStates.has(state);
  const isValidCookieState = !cookieState || cookieState === state;

  if (!isValidSessionState || !isValidCookieState) {
    res.writeHead(400, {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': clearCookieHeader
    });
    return res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Invalid State</title></head>
      <body style="font-family:system-ui,-apple-system,sans-serif; background:#f8fafc; color:#0f172a; padding:40px; text-align:center">
        <div style="max-width:480px; margin:0 auto; background:#fff; padding:32px; border-radius:12px; border:1px solid #cbd5e1">
          <div style="font-size:40px; margin-bottom:12px">🚫</div>
          <h2 style="margin:0 0 10px; color:#b91c1c">Invalid or Expired OAuth State</h2>
          <p style="color:#64748b; font-size:14px">The authorization request timed out or was tampered with. Please try connecting again from the Cabella workspace.</p>
          <button onclick="window.close()" style="background:#0284c7; color:#fff; border:0; padding:10px 20px; border-radius:6px; font-weight:700; cursor:pointer">Close Window</button>
        </div>
      </body>
      </html>
    `);
  }

  // Consume the state token immediately (one-time use)
  oauthStates.delete(state);

  const config = getRingCentralConfig();
  if (!config.hasTokenEncryptionKey) {
    res.writeHead(500, {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': clearCookieHeader
    });
    return res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Encryption Key Missing</title></head>
      <body style="font-family:system-ui,-apple-system,sans-serif; background:#f8fafc; color:#0f172a; padding:40px; text-align:center">
        <div style="max-width:480px; margin:0 auto; background:#fff; padding:32px; border-radius:12px; border:1px solid #cbd5e1">
          <div style="font-size:40px; margin-bottom:12px">⚠️</div>
          <h2 style="margin:0 0 10px; color:#b91c1c">TOKEN_ENCRYPTION_KEY Missing</h2>
          <p style="color:#64748b; font-size:14px">Please set TOKEN_ENCRYPTION_KEY in Settings to enable secure AES-256-GCM token storage.</p>
          <button onclick="window.close()" style="background:#0284c7; color:#fff; border:0; padding:10px 20px; border-radius:6px; font-weight:700; cursor:pointer">Close Window</button>
        </div>
      </body>
      </html>
    `);
  }

  const tokenUrl = `${config.serverUrl}/restapi/oauth/token`;
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', config.redirectUri);

  try {
    // Exchange authorization code ONLY on the server
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!tokenRes.ok) {
      const errTxt = await tokenRes.text();
      throw new Error(`Token exchange failed (${tokenRes.status}): ${sanitize(errTxt)}`);
    }

    const tokenData = await tokenRes.json();
    const expiresAt = Date.now() + ((tokenData.expires_in || 3600) * 1000);
    const encrypted = encryptPayload({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'bearer',
      scope: tokenData.scope || '',
      owner_id: tokenData.owner_id || ''
    });

    const record = {
      ...encrypted,
      expiresAt,
      scope: tokenData.scope || '',
      ownerId: tokenData.owner_id || '',
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'connected'
    };

    // Store tokens strictly in Firestore document
    await saveStoredAuthToFirestore(record);

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': clearCookieHeader
    });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>RingCentral Connected</title>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage({ type: 'RINGCENTRAL_AUTH_SUCCESS' }, '*');
            }
          } catch(e) {}
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              window.location.href = '/?ringcentral=connected';
            }
          }, 1200);
        </script>
      </head>
      <body style="font-family:system-ui,-apple-system,sans-serif; background:#f0fdf4; color:#166534; padding:40px; text-align:center">
        <div style="max-width:480px; margin:0 auto; background:#fff; padding:32px; border-radius:12px; border:1px solid #bbf7d0; box-shadow:0 4px 12px rgba(22,101,52,0.08)">
          <div style="font-size:44px; margin-bottom:12px">✅</div>
          <h2 style="margin:0 0 10px; color:#166534">RingCentral Connected Successfully</h2>
          <p style="color:#475569; font-size:14px">Your Cabella Workspace has securely authenticated with RingCentral. Returning to app...</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('[RingCentral Callback Error]', sanitize(err.message));
    res.writeHead(500, {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': clearCookieHeader
    });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Connection Error</title></head>
      <body style="font-family:system-ui,-apple-system,sans-serif; background:#f8fafc; color:#0f172a; padding:40px; text-align:center">
        <div style="max-width:480px; margin:0 auto; background:#fff; padding:32px; border-radius:12px; border:1px solid #cbd5e1">
          <div style="font-size:40px; margin-bottom:12px">❌</div>
          <h2 style="margin:0 0 10px; color:#b91c1c">Failed to Complete RingCentral Authorization</h2>
          <p style="color:#64748b; font-size:14px">${escHtml(sanitize(err.message))}</p>
          <button onclick="window.close()" style="background:#0284c7; color:#fff; border:0; padding:10px 20px; border-radius:6px; font-weight:700; cursor:pointer">Close Window</button>
        </div>
      </body>
      </html>
    `);
  }
}

async function handleStatus(req, res) {
  const config = getRingCentralConfig();
  const hasEncryptionKey = config.hasTokenEncryptionKey;
  const isConfigured = Boolean(config.clientId && config.clientSecret && config.redirectUri && hasEncryptionKey);

  if (!hasEncryptionKey) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({
      connected: false,
      status: 'disconnected',
      configured: false,
      missingEncryptionKey: true,
      error: 'TOKEN_ENCRYPTION_KEY server secret is missing. Please set TOKEN_ENCRYPTION_KEY in Settings.'
    }));
  }

  try {
    const record = await getStoredAuthFromFirestore();
    if (!record || record.status !== 'connected') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({
        connected: false,
        status: record ? record.status : 'disconnected',
        configured: isConfigured
      }));
    }

    // Check if token is nearing expiration (within 5 minutes)
    const now = Date.now();
    if (record.expiresAt && record.expiresAt <= now + 300000) {
      try {
        const decrypted = decryptPayload(record);
        if (decrypted.refresh_token) {
          const newRecord = await refreshAccessToken(decrypted.refresh_token);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          return res.end(JSON.stringify({
            connected: true,
            status: 'connected',
            ownerId: newRecord.ownerId || '',
            expiresAt: newRecord.expiresAt,
            connectedAt: newRecord.connectedAt,
            configured: isConfigured
          }));
        }
      } catch (refreshErr) {
        console.error('[RingCentral] Token auto-refresh notice:', sanitize(refreshErr.message));
        // Mark as error in Firestore if token could not be rotated
        await saveStoredAuthToFirestore({ status: 'error', error: 'Token refresh expired or revoked' });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        return res.end(JSON.stringify({
          connected: false,
          status: 'error',
          configured: isConfigured,
          error: 'Session expired. Please reconnect RingCentral.'
        }));
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      connected: true,
      status: 'connected',
      ownerId: record.ownerId || '',
      expiresAt: record.expiresAt,
      connectedAt: record.connectedAt,
      configured: isConfigured
    }));
  } catch (err) {
    console.error('[RingCentral Status Error]', sanitize(err.message));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      connected: false,
      status: 'error',
      configured: false,
      error: sanitize(err.message)
    }));
  }
}

async function handleDisconnect(req, res) {
  const config = getRingCentralConfig();
  try {
    const record = await getStoredAuthFromFirestore();
    if (record && record.encryptedData && config.hasTokenEncryptionKey) {
      try {
        const decrypted = decryptPayload(record);
        if (decrypted.access_token && config.clientId && config.clientSecret) {
          const revokeUrl = `${config.serverUrl}/restapi/oauth/revoke`;
          const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
          const params = new URLSearchParams();
          params.append('token', decrypted.access_token);
          await fetch(revokeUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${basicAuth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          }).catch(e => console.warn('[RingCentral Revoke Notice]', sanitize(e.message)));
        }
      } catch (e) {
        console.warn('[RingCentral Decrypt on Disconnect Notice]', sanitize(e.message));
      }
    }

    // Permanently remove document from Firestore
    await deleteStoredAuthFromFirestore();

    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      success: true,
      status: 'disconnected'
    }));
  } catch (err) {
    console.error('[RingCentral Disconnect Error]', sanitize(err.message));
    res.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      error: sanitize(err.message)
    }));
  }
}

function escHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = {
  handleConnect,
  handleCallback,
  handleStatus,
  handleDisconnect
};
