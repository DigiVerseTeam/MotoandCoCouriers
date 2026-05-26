import { createHmac, timingSafeEqual } from 'node:crypto';

const zohoAccountsUrl = (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com.au').replace(/\/$/, '');
const zohoApiDomain = (process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com.au').replace(/\/$/, '');
const zohoCrmVersion = process.env.ZOHO_CRM_VERSION || 'v8';
const tokenCache = new Map();
const staffEmails = new Set(['admin@motoandco.com.au', 'gerrard@otimi.com.au', 'jake@motoandco.com.au', 'stephen@motoandco.com.au', 'gcmtm12@gmail.com']);
const sessionCookieName = 'motoco_session';

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.ZOHO_CLIENT_SECRET || '';
}

function signSessionPayload(payload) {
  const secret = sessionSecret();
  if (!secret) return '';
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(header = '') {
  return Object.fromEntries(String(header || '').split(';').map(part => {
    const [name, ...value] = part.trim().split('=');
    return [name, value.join('=')];
  }).filter(([name]) => name));
}

function sessionFromEvent(event) {
  const cookies = parseCookies(event.headers?.cookie || event.headers?.Cookie || '');
  const token = cookies[sessionCookieName];
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, signSessionPayload(payload))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}

function normaliseEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function lookupName(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return String(value.name || value.display_value || value.value || value.id || '').trim();
}

function firstValue(...values) {
  return values.map(value => String(value || '').trim()).find(Boolean) || '';
}

function formatAddress(...parts) {
  return parts.map(part => String(part || '').trim()).filter(Boolean).join(', ');
}

function accountIdFromDeal(deal) {
  return String(deal?.Account_Name?.id || '').trim();
}

function addressFromAccount(account = {}) {
  return firstValue(
    formatAddress(account.Shipping_Street, account.Shipping_City, account.Shipping_State, account.Shipping_Code, account.Shipping_Country),
    formatAddress(account.Billing_Street, account.Billing_City, account.Billing_State, account.Billing_Code, account.Billing_Country),
    account.Shipping_Street,
    account.Billing_Street
  );
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
  return process.env[`ZOHO_DEAL_STAGE_${key}`] || defaults[key] || defaults.ORDER_PLACED;
}

function dealPipeline() {
  return process.env.ZOHO_DEAL_PIPELINE || 'Couriers';
}

function appStatusFromDealStage(stage) {
  if (stage === dealStage('PICKED_UP')) return 'Picked Up';
  if (stage === dealStage('IN_TRANSIT')) return 'In Transit';
  if (stage === dealStage('DELIVERED')) return 'Delivered';
  if (stage === dealStage('INVOICED')) return 'Invoiced';
  if (stage === dealStage('PAID')) return 'Paid - future use';
  return 'Order Placed';
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function descriptionField(description = '', label) {
  const match = String(description).match(new RegExp(`^${escapeRegExp(label)}:\s*(.+)$`, 'im'));
  const value = match?.[1]?.trim();
  return value && value !== 'Not supplied' ? value : '';
}

async function accessTokenForCRM() {
  const directToken = process.env.ZOHO_CRM_ACCESS_TOKEN;
  const refreshToken = process.env.ZOHO_CRM_REFRESH_TOKEN || process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  if (!refreshToken) return directToken;
  if (!clientId || !clientSecret) return directToken;

  const cached = tokenCache.get(refreshToken);
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
    throw new Error(data.error_description || data.error || 'Could not refresh Zoho access token.');
  }

  tokenCache.set(refreshToken, {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  });
  return data.access_token;
}

async function zohoRequest({ path, token }) {
  const res = await fetch(`${zohoApiDomain}${path}`, {
    headers: compact({ Authorization: `Zoho-oauthtoken ${token}` }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const detail = data?.message || data?.data?.[0]?.message || text || `${res.status} ${res.statusText}`;
    throw new Error(`Zoho request failed: ${detail}`);
  }
  return data;
}

async function contactByEmail(token, email) {
  if (!email) return null;
  const result = await zohoRequest({
    token,
    path: `/crm/${zohoCrmVersion}/Contacts/search?email=${encodeURIComponent(normaliseEmail(email))}`,
  });
  return (result.data || [])[0] || null;
}

async function fetchDeals(token) {
  const fieldSets = [
    'Deal_Name,Stage,Pipeline,Closing_Date,Amount,Account_Name,Contact_Name,Description,Created_Time,Modified_Time,Pickup_Supplier,Vendor_Pick_Up,Con_Note_Number,Delivery_Notes,Milk_Run_Date,Work_Item_ID,Scheduled_Date_Time,Work_End_Date_Time,Reciever_Name,Driver_Name,Invoice_Number,Invoice_Status',
    'Deal_Name,Stage,Pipeline,Closing_Date,Amount,Account_Name,Contact_Name,Description,Created_Time,Modified_Time,Pickup_Supplier,Vendor_Pick_Up,Con_Note_Number,Delivery_Notes,Milk_Run_Date,Work_Item_ID,Scheduled_Date_Time,Work_End_Date_Time,Receiver_Name,Driver_Name,Invoice_Number,Invoice_Status',
    'Deal_Name,Stage,Pipeline,Closing_Date,Amount,Account_Name,Contact_Name,Description,Created_Time,Modified_Time,Vendor_Pick_Up,Con_Note_Number,Delivery_Notes,Milk_Run_Date,Work_Item_ID,Scheduled_Date_Time,Work_End_Date_Time,Invoice_Number,Invoice_Status',
    'Deal_Name,Stage,Pipeline,Closing_Date,Amount,Account_Name,Contact_Name,Description,Created_Time,Modified_Time',
    'Deal_Name,Stage,Closing_Date,Amount,Account_Name,Contact_Name,Description,Created_Time,Modified_Time',
  ];

  let lastError;
  for (const fields of fieldSets) {
    try {
      const deals = [];
      for (let page = 1; page <= 5; page += 1) {
        const result = await zohoRequest({
          token,
          path: `/crm/${zohoCrmVersion}/Deals?fields=${encodeURIComponent(fields)}&per_page=200&page=${page}`,
        });
        deals.push(...(result.data || []));
        if (!result.info?.more_records) break;
      }
      return deals;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchAccountAddresses(token, deals = []) {
  const ids = [...new Set(deals.map(accountIdFromDeal).filter(Boolean))];
  const fields = [
    'Account_Name',
    'Billing_Street',
    'Billing_City',
    'Billing_State',
    'Billing_Code',
    'Billing_Country',
    'Shipping_Street',
    'Shipping_City',
    'Shipping_State',
    'Shipping_Code',
    'Shipping_Country',
  ].join(',');
  const addresses = new Map();

  await Promise.all(ids.map(async id => {
    try {
      const result = await zohoRequest({
        token,
        path: `/crm/${zohoCrmVersion}/Accounts/${encodeURIComponent(id)}?fields=${encodeURIComponent(fields)}`,
      });
      const account = (result.data || [])[0] || {};
      const address = addressFromAccount(account);
      if (address) addresses.set(id, address);
    } catch {
      // Keep the driver run available even if the token cannot read Account addresses yet.
    }
  }));

  return addresses;
}

function dealBelongsToClient(deal, contact) {
  return (
    deal.Contact_Name?.id === contact?.id ||
    deal.Account_Name?.id === contact?.Account_Name?.id ||
    deal.Contact_Name?.name === contact?.Full_Name ||
    deal.Account_Name?.name === contact?.Account_Name?.name
  );
}

function deliveredAtFromDeal(deal, description = '') {
  return firstValue(
    deal.Work_End_Date_Time,
    descriptionField(description, 'Delivered at'),
    deal.Modified_Time,
    deal.Created_Time
  );
}

function dealToOrder(deal, clientEmail = '', accountAddresses = new Map()) {
  const description = deal.Description || '';
  const accountName = deal.Account_Name?.name || '';
  const accountId = accountIdFromDeal(deal);
  const contactName = deal.Contact_Name?.name || '';
  const conNote = firstValue(deal.Con_Note_Number, descriptionField(description, 'Con note'), deal.Deal_Name?.split(' - ').at(-1), deal.id);
  const vendor = firstValue(deal.Pickup_Supplier, lookupName(deal.Vendor_Pick_Up), descriptionField(description, 'Supplier'), descriptionField(description, 'Pickup supplier'), 'Supplier');
  const pickupAddress = firstValue(descriptionField(description, 'Pickup address'), descriptionField(description, 'Supplier address'));
  const dropAddress = firstValue(descriptionField(description, 'Drop address'), descriptionField(description, 'Delivery address'), accountAddresses.get(accountId));
  const milkRunDate = firstValue(deal.Milk_Run_Date, descriptionField(description, 'Milk run date'));
  const deliveredAt = deliveredAtFromDeal(deal, description);

  return {
    id: `zoho_${deal.id}`,
    zohoDealId: deal.id,
    zohoDealStage: deal.Stage,
    zohoDealPipeline: deal.Pipeline,
    conNote,
    vendor,
    pickupAddress,
    notes: firstValue(deal.Delivery_Notes, descriptionField(description, 'Notes'), descriptionField(description, 'Driver notes')),
    urgency: 'next-run',
    preferredDate: firstValue(milkRunDate, deal.Closing_Date, String(deal.Created_Time || new Date().toISOString()).slice(0, 10)),
    requestedPickupDate: milkRunDate,
    preferredTime: '09:00',
    dropLocation: dropAddress,
    clientId: deal.Contact_Name?.id ? `crm_${deal.Contact_Name.id}` : accountId ? `crm_account_${accountId}` : '',
    clientName: contactName || accountName || 'Client',
    businessName: accountName || contactName || 'Client',
    accountName,
    accountAddress: accountAddresses.get(accountId) || '',
    clientEmail,
    clientPhone: '',
    status: appStatusFromDealStage(deal.Stage),
    price: Number(deal.Amount || 0),
    totalPrice: Number(deal.Amount || 0),
    submittedAt: deal.Scheduled_Date_Time || deal.Created_Time || new Date().toISOString(),
    deliveredAt,
    completedAt: deliveredAt,
    receiverName: firstValue(deal.Reciever_Name, deal.Receiver_Name, descriptionField(description, 'Receiver')),
    driverName: firstValue(deal.Driver_Name, descriptionField(description, 'Driver')),
    invoiceNumber: firstValue(deal.Invoice_Number, descriptionField(description, 'Books invoice number')),
    invoiceStatus: firstValue(deal.Invoice_Status),
    portalOrderId: firstValue(deal.Work_Item_ID, descriptionField(description, 'Portal order id')),
    itemsDesc: firstValue(descriptionField(description, 'Delivered items'), descriptionField(description, 'Items'), 'Moto & Co courier delivery'),
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, {});

  try {
    const session = sessionFromEvent(event);
    if (!session) {
      return response(200, { orders: [], mode: 'unauthenticated' });
    }

    const { role, email } = session;
    const cleanEmail = normaliseEmail(email);
    if (!cleanEmail || !['client', 'admin', 'driver'].includes(role || '')) {
      return response(200, { orders: [], mode: 'unauthenticated' });
    }
    if (role !== 'client' && !staffEmails.has(cleanEmail)) {
      return response(200, { orders: [], mode: 'unauthorised' });
    }

    const token = await accessTokenForCRM();
    if (!token) return response(200, { orders: [], mode: 'placeholder' });

    const contact = role === 'client' ? await contactByEmail(token, cleanEmail) : null;
    if (role === 'client' && !contact) return response(200, { orders: [], mode: 'live' });

    const pipeline = dealPipeline();
    const stages = new Set([
      dealStage('ORDER_PLACED'),
      dealStage('PICKED_UP'),
      dealStage('IN_TRANSIT'),
      dealStage('DELIVERED'),
      dealStage('INVOICED'),
      dealStage('PAID'),
    ]);

    const visibleDeals = (await fetchDeals(token))
      .filter(deal => !deal.Pipeline || deal.Pipeline === pipeline || deal.Pipeline?.display_value === pipeline || stages.has(deal.Stage))
      .filter(deal => role !== 'client' || dealBelongsToClient(deal, contact));
    const accountAddresses = await fetchAccountAddresses(token, visibleDeals);
    const orders = visibleDeals.map(deal => dealToOrder(deal, role === 'client' ? cleanEmail : '', accountAddresses));

    return response(200, { orders, mode: 'live' });
  } catch (error) {
    return response(500, { message: error instanceof Error ? error.message : 'Could not pull Zoho Deals.' });
  }
}
