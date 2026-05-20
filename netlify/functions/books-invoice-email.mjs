const zohoAccountsUrl = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com.au').replace(/\/$/, '');
const zohoApiDomain = (process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com.au').replace(/\/$/, '');
const tokenCache = new Map();

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.MOTOCO_ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}

function parseBody(event) {
  if (!event.body) return {};
  return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body);
}

function normalise(value) {
  return String(value || '').trim();
}

function emailsFrom(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(/[;,\s]+/);
  return list.map(normalise).filter(item => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
}

async function accessTokenForBooks() {
  const directToken = process.env.ZOHO_BOOKS_ACCESS_TOKEN;
  const refreshToken = process.env.ZOHO_BOOKS_REFRESH_TOKEN || process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  if (!refreshToken) return directToken;
  if (!clientId || !clientSecret) return directToken;

  const cacheKey = `BOOKS:${refreshToken}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60000) return cached.token;

  const params = new URLSearchParams({ refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token' });
  const res = await fetch(`${zohoAccountsUrl}/oauth/v2/token?${params.toString()}`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(data.error_description || data.error || 'Could not refresh Zoho Books access token.');

  tokenCache.set(cacheKey, { token: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 });
  return data.access_token;
}

async function zohoBooksRequest({ path, token, method = 'GET', body }) {
  const res = await fetch(`${zohoApiDomain}${path}`, {
    method,
    headers: compact({ Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': body ? 'application/json' : undefined }),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const detail = data?.message || data?.data?.[0]?.message || text || `${res.status} ${res.statusText}`;
    throw new Error(`Zoho Books request failed: ${detail}`);
  }
  return data;
}

async function emailInvoice(payload = {}) {
  const token = await accessTokenForBooks();
  const organisationId = process.env.ZOHO_BOOKS_ORGANIZATION_ID;
  const invoiceId = normalise(payload.invoiceId || payload.invoice_id);
  const toMailIds = emailsFrom(payload.toMailIds || payload.to || payload.email);

  if (!token) throw new Error('Zoho Books credentials are missing.');
  if (!organisationId) throw new Error('ZOHO_BOOKS_ORGANIZATION_ID is missing.');
  if (!invoiceId) throw new Error('Invoice ID is missing.');
  if (!toMailIds.length) throw new Error('Add a billing email address before sending the invoice.');

  const body = compact({
    to_mail_ids: toMailIds,
    cc_mail_ids: emailsFrom(payload.ccMailIds || payload.cc),
    subject: normalise(payload.subject),
    body: normalise(payload.body),
    send_from_org_email_id: true,
  });

  const result = await zohoBooksRequest({
    token,
    method: 'POST',
    path: `/books/v3/invoices/${encodeURIComponent(invoiceId)}/email?organization_id=${encodeURIComponent(organisationId)}`,
    body,
  });

  return { success: true, mode: 'live', invoiceId, toMailIds, result, message: `Invoice emailed to ${toMailIds.join(', ')}.` };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { message: 'Method not allowed.' });
  try {
    return response(200, await emailInvoice(parseBody(event)));
  } catch (error) {
    return response(500, { success: false, message: error instanceof Error ? error.message : 'Could not email Zoho Books invoice.' });
  }
}
