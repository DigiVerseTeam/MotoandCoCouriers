const zohoAccountsUrl = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com.au').replace(/\/$/, '');
const zohoApiDomain = (process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com.au').replace(/\/$/, '');
const zohoCrmVersion = process.env.ZOHO_CRM_VERSION || 'v8';
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

function safeName(value) {
  return normalise(value).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'delivery';
}

function dealStage(key) {
  const defaults = {
    ORDER_PLACED: 'Order Placed',
    PICKED_UP: 'Picked Up',
    IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered',
    INVOICED: 'Invoiced',
    PAID: 'Paid - future use',
  };
  return process.env[`ZOHO_DEAL_STAGE_${key}`] || defaults[key] || defaults.DELIVERED;
}

function dealPipeline() {
  return process.env.ZOHO_DEAL_PIPELINE || 'Courier Pipeline';
}

function zohoDateTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return zohoDateTime(new Date());
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const item = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${item.year}-${item.month}-${item.day}T${item.hour}:${item.minute}:${item.second}+10:00`;
}

function deliveryProofId(delivery = {}) {
  return normalise(delivery.id || `${delivery.zohoDealId}-${delivery.completedAt || delivery.conNote || 'delivery'}`);
}

function signatureDataUrl(delivery = {}) {
  return normalise(
    delivery.signatureData ||
    delivery.signatureDataUrl ||
    delivery.signatureImage ||
    delivery.signaturePreview ||
    delivery.signature ||
    ''
  );
}

function parseSignatureImage(delivery = {}) {
  const dataUrl = signatureDataUrl(delivery);
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  const extension = mimeType.includes('jpeg') ? 'jpg' : mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'png';
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length) return null;

  const fileName = [
    'moto-co-delivery-signature',
    safeName(delivery.conNote),
    safeName(delivery.receiverName),
    safeName(deliveryProofId(delivery)),
  ].filter(Boolean).join('-') + `.${extension}`;

  return { buffer, mimeType, fileName };
}

async function accessTokenForCrm() {
  const directToken = process.env.ZOHO_CRM_ACCESS_TOKEN;
  const refreshToken = process.env.ZOHO_CRM_REFRESH_TOKEN || process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  if (!refreshToken) return directToken;
  if (!clientId || !clientSecret) return directToken;

  const cacheKey = `CRM:${refreshToken}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60000) return cached.token;

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });

  const res = await fetch(`${zohoAccountsUrl}/oauth/v2/token?${params.toString()}`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Could not refresh Zoho CRM access token.');
  }

  tokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  });
  return data.access_token;
}

async function zohoRequest({ path, token, method = 'GET', body, contentType }) {
  const headers = compact({
    Authorization: `Zoho-oauthtoken ${token}`,
    'Content-Type': contentType || (body && !(body instanceof FormData) ? 'application/json' : undefined),
  });
  const res = await fetch(`${zohoApiDomain}${path}`, {
    method,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const detail = data?.message || data?.data?.[0]?.message || text || `${res.status} ${res.statusText}`;
    throw new Error(`Zoho request failed: ${detail}`);
  }
  const failed = Array.isArray(data?.data) ? data.data.find(item => item.status === 'error' || (item.code && item.code !== 'SUCCESS')) : null;
  if (failed) throw new Error(`Zoho request failed: ${failed.message || failed.code || 'Unknown Zoho error'}`);
  return data;
}

async function fetchDeal({ token, dealId }) {
  const data = await zohoRequest({
    token,
    path: `/crm/${zohoCrmVersion}/Deals/${encodeURIComponent(dealId)}?fields=${encodeURIComponent('Description')}`,
  });
  return data?.data?.[0] || {};
}

async function uploadDealAttachment({ token, dealId, image }) {
  const form = new FormData();
  form.append('file', new Blob([image.buffer], { type: image.mimeType }), image.fileName);

  const res = await fetch(`${zohoApiDomain}/crm/${zohoCrmVersion}/Deals/${encodeURIComponent(dealId)}/Attachments`, {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    body: form,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const detail = data?.message || data?.data?.[0]?.message || text || `${res.status} ${res.statusText}`;
    throw new Error(`Zoho signature upload failed: ${detail}`);
  }
  const failed = Array.isArray(data?.data) ? data.data.find(item => item.status === 'error' || (item.code && item.code !== 'SUCCESS')) : null;
  if (failed) throw new Error(`Zoho signature upload failed: ${failed.message || failed.code || 'Unknown Zoho error'}`);
  return data?.data?.[0]?.details?.id || data?.data?.[0]?.details?.attachment_id || '';
}

async function attachSignature({ token, dealId, delivery, currentDescription }) {
  const image = parseSignatureImage(delivery);
  if (!image) return { skipped: true, reason: 'no-signature-image' };

  const proofId = deliveryProofId(delivery);
  const marker = `Delivery signature proof id: ${proofId}`;
  if (String(currentDescription || '').includes(marker)) {
    return { skipped: true, reason: 'already-attached', proofId };
  }

  const attachmentId = await uploadDealAttachment({ token, dealId, image });
  return { attached: true, proofId, attachmentId, fileName: image.fileName, marker };
}

function deliveryFields(delivery = {}) {
  const receiverNameField = process.env.ZOHO_DEAL_FIELD_RECEIVER_NAME || 'Reciever_Name';
  const deliveredAtField = process.env.ZOHO_DEAL_FIELD_DELIVERED_AT || 'Work_End_Date_Time';
  const driverNameField = process.env.ZOHO_DEAL_FIELD_DRIVER_NAME || 'Driver_Name';
  const notesField = process.env.ZOHO_DEAL_FIELD_DELIVERY_NOTES || 'Delivery_Notes';
  const receiverPhoneField = process.env.ZOHO_DEAL_FIELD_RECEIVER_PHONE || '';

  const driverName = normalise(delivery.driverName);
  const signatureNote = [
    delivery.itemsDesc ? `Delivered items: ${delivery.itemsDesc}` : '',
    delivery.receiverPhone ? `Receiver phone: ${delivery.receiverPhone}` : '',
    driverName ? `Driver: ${driverName}` : '',
  ].filter(Boolean).join('\n');

  return compact({
    Stage: dealStage('DELIVERED'),
    Pipeline: dealPipeline(),
    [receiverNameField]: normalise(delivery.receiverName),
    [deliveredAtField]: zohoDateTime(delivery.completedAt || new Date()),
    [driverNameField]: driverName || undefined,
    [receiverPhoneField]: normalise(delivery.receiverPhone) || undefined,
    [notesField]: signatureNote || undefined,
  });
}

async function updateDealWithRetry({ token, dealId, fields }) {
  try {
    await zohoRequest({
      token,
      method: 'PUT',
      path: `/crm/${zohoCrmVersion}/Deals/${encodeURIComponent(dealId)}`,
      body: { data: [fields] },
    });
    return { saved: true, droppedDriverName: false };
  } catch (error) {
    if (!Object.prototype.hasOwnProperty.call(fields, process.env.ZOHO_DEAL_FIELD_DRIVER_NAME || 'Driver_Name')) throw error;
    const retryFields = { ...fields };
    delete retryFields[process.env.ZOHO_DEAL_FIELD_DRIVER_NAME || 'Driver_Name'];
    await zohoRequest({
      token,
      method: 'PUT',
      path: `/crm/${zohoCrmVersion}/Deals/${encodeURIComponent(dealId)}`,
      body: { data: [retryFields] },
    });
    return { saved: true, droppedDriverName: true, driverNameMessage: error.message };
  }
}

async function syncDelivery({ token, delivery }) {
  if (!delivery?.zohoDealId) throw new Error('Zoho Deal ID is missing for delivery sign-off.');
  const deal = await fetchDeal({ token, dealId: delivery.zohoDealId });
  const currentDescription = deal.Description || '';
  const signature = await attachSignature({ token, dealId: delivery.zohoDealId, delivery, currentDescription });

  const descriptionAddition = [
    '--- Moto & Co delivery sign-off ---',
    `Delivered at: ${zohoDateTime(delivery.completedAt || new Date())}`,
    `Receiver: ${normalise(delivery.receiverName) || 'Not supplied'}`,
    delivery.receiverPhone ? `Receiver phone: ${delivery.receiverPhone}` : '',
    delivery.driverName ? `Driver: ${delivery.driverName}` : '',
    delivery.itemsDesc ? `Delivered items: ${delivery.itemsDesc}` : '',
    signature.marker || '',
    signature.fileName ? `Signature file: ${signature.fileName}` : '',
    signature.attachmentId ? `Signature attachment id: ${signature.attachmentId}` : '',
  ].filter(Boolean).join('\n');

  const fields = {
    ...deliveryFields(delivery),
    Description: [currentDescription, descriptionAddition].filter(Boolean).join('\n\n'),
  };

  const saved = await updateDealWithRetry({ token, dealId: delivery.zohoDealId, fields });
  return {
    dealId: delivery.zohoDealId,
    conNote: delivery.conNote,
    ...saved,
    signature,
  };
}

async function syncDeliveries(payload = {}) {
  const token = await accessTokenForCrm();
  if (!token) throw new Error('Zoho CRM credentials are missing.');

  const deliveries = Array.isArray(payload.deliveries) ? payload.deliveries : [];
  if (!deliveries.length) throw new Error('No deliveries were supplied for sign-off.');

  const results = [];
  for (const delivery of deliveries) {
    results.push(await syncDelivery({ token, delivery }));
  }

  return {
    success: true,
    mode: 'live',
    deliveryRows: results.length,
    results,
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { message: 'Method not allowed.' });

  try {
    return response(200, await syncDeliveries(parseBody(event)));
  } catch (error) {
    return response(500, { success: false, message: error instanceof Error ? error.message : 'Could not sync delivery sign-off.' });
  }
}
