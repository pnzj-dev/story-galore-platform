import { NowPaymentsSDK } from '@nowpaymentsio/nowpayments-sdk-nodejs';

// StoryGalore NOWPayments adapter — TypeScript/Node Appwrite function.
// This is the ONLY Appwrite function allowed in TypeScript: the NOWPayments
// SDK has no Go equivalent (see AGENTS.md rule 4 exception).
//
// Paths:
//   POST /                         -> command: create_payment | create_subscription | cancel_subscription
//   POST /webhooks/nowpayments     -> IPN (Instant Payment Notification)

const DATABASE_ID = 'main';
const PAYMENTS_TABLE = 'payments';
const SUBSCRIPTIONS_TABLE = 'subscriptions';
const APPWRITE_ENDPOINT =
  process.env.APPWRITE_ENDPOINT ||
  process.env.APPWRITE_FUNCTION_API_ENDPOINT ||
  'http://187.126.0.227/v1';
const NP_API_BASE = process.env.NOWPAYMENTS_API_BASE || 'https://api.nowpayments.io/v1';
const AUTH_TABLE = 'provider_auth_tokens';
// Conservative TTL for the NOWPayments Bearer JWT (short-lived).
const JWT_TTL_MS = 15 * 60 * 1000;

// In-memory JWT cache (per-execution). The cross-execution cache lives in the
// provider_auth_tokens table so fresh executions don't re-hit /v1/auth.
let jwtCache = { token: null, expiresAt: 0 };

function nowpaymentsSDK() {
  return new NowPaymentsSDK({
    apiKey: process.env.NOWPAYMENTS_API_KEY,
    ipnSecret: process.env.NOWPAYMENTS_IPN_KEY,
    ipnCallbackUrl: process.env.NOWPAYMENTS_IPN_CALLBACK_URL,
  });
}

// Raw Appwrite TablesDB call using the per-execution ephemeral key. Avoids a
// node-appwrite version dependency; the endpoint/body match the Go SDK.
async function appwriteRequest(req, method, path, body) {
  const key = process.env.APPWRITE_FUNCTION_API_KEY || req.headers['x-appwrite-key'];
  const resp = await fetch(`${APPWRITE_ENDPOINT}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-appwrite-project': process.env.APPWRITE_FUNCTION_PROJECT_ID,
      'x-appwrite-key': key,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Appwrite ${method} ${path} failed: ${resp.status} ${text}`);
  }
  return resp.json();
}

// Raw NOWPayments REST call (x-api-key, optional Bearer JWT). Used for the
// Recurring Payments (subscriptions) endpoints, which the SDK does not wrap.
async function npRequest(method, path, body, jwt) {
  const headers = {
    'content-type': 'application/json',
    'x-api-key': process.env.NOWPAYMENTS_API_KEY,
  };
  if (jwt) {
    headers['authorization'] = `Bearer ${jwt}`;
  }
  const resp = await fetch(`${NP_API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`NOWPayments ${method} ${path}: ${resp.status} ${text}`);
  }
  return resp.json();
}

// Obtain the NOWPayments Bearer JWT: in-memory cache -> provider_auth_tokens
// table -> POST /v1/auth. Avoids hitting the auth endpoint on every execution.
async function getJwt(req) {
  const now = Date.now();
  if (jwtCache.token && jwtCache.expiresAt > now) {
    return jwtCache.token;
  }
  try {
    const q = encodeURIComponent(
      JSON.stringify([{ method: 'equal', attribute: 'providerId', values: ['NOWPAYMENTS'] }])
    );
    const list = await appwriteRequest(req, 'GET', `/tablesdb/${DATABASE_ID}/tables/${AUTH_TABLE}/rows?queries=${q}`);
    const row = list && list.rows && list.rows[0];
    if (row && row.data && row.data.token && row.data.expiresAt) {
      const exp = new Date(row.data.expiresAt).getTime();
      if (exp > now) {
        jwtCache = { token: row.data.token, expiresAt: exp };
        return row.data.token;
      }
    }
  } catch (e) {
    // table/read may be unavailable; fall through to re-auth.
  }
  const auth = await npRequest(
    'POST',
    '/auth',
    { email: process.env.NOWPAYMENTS_EMAIL, password: process.env.NOWPAYMENTS_PASSWORD },
    null
  );
  const token = auth && auth.token;
  if (!token) {
    throw new Error('NOWPayments auth returned no token');
  }
  const expiresAt = now + JWT_TTL_MS;
  jwtCache = { token, expiresAt };
  try {
    await appwriteRequest(req, 'POST', `/tablesdb/${DATABASE_ID}/tables/${AUTH_TABLE}/rows`, {
      databaseId: DATABASE_ID,
      tableId: AUTH_TABLE,
      rowId: 'NOWPAYMENTS',
      data: { providerId: 'NOWPAYMENTS', token, expiresAt: new Date(expiresAt).toISOString() },
    });
  } catch (e) {
    // best-effort; the in-memory cache still holds the token.
  }
  return token;
}

// Map raw NOWPayments payment_status -> StoryGalore payments.status enum.
function mapPaymentStatus(rawStatus) {
  switch (String(rawStatus).toLowerCase()) {
    case 'finished':
      return 'CAPTURED';
    case 'failed':
      return 'FAILED';
    case 'refunded':
      return 'REFUNDED';
    case 'expired':
      return 'EXPIRED';
    case 'cancelled':
    case 'canceled':
      return 'FAILED';
    default:
      // waiting, confirming, confirmed, sending, partially_paid
      return 'AWAITING_PROVIDER';
  }
}

// Map raw NOWPayments recurring-payment status -> StoryGalore subscriptions.status.
function mapSubscriptionStatus(rawStatus) {
  switch (String(rawStatus).toUpperCase()) {
    case 'FINISHED':
      return 'ACTIVE';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
    case 'CANCELED':
      return 'CANCELLED';
    case 'EXPIRED':
      return 'EXPIRED';
    default:
      return 'AWAITING_PROVIDER';
  }
}

// Map a StoryGalore billing interval to NOWPayments plan interval_day.
function intervalToDays(interval) {
  switch (String(interval).toLowerCase()) {
    case 'day':
      return 1;
    case 'week':
      return 7;
    case 'month':
      return 30;
    case 'year':
      return 365;
    default:
      return 30;
  }
}

export default async ({ req, res, log, error }) => {
  try {
    if (req.path === '/webhooks/nowpayments') {
      return await handleIpn(req, res, log);
    }
    return await handleCommand(req, res, log);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    error('nowpayments: ' + msg);
    return res.json({ error: 'INTERNAL_FAILURE', message: msg }, 500);
  }
};

async function handleCommand(req, res, log) {
  const body = req.bodyJson;
  if (!body || !body.operation) {
    return res.json({ error: 'INVALID_OPERATION' }, 400);
  }
  switch (body.operation) {
    case 'create_payment':
      return handleCreatePayment(req, res, log);
    case 'create_subscription':
      return handleCreateSubscription(req, res, log);
    case 'cancel_subscription':
      return handleCancelSubscription(req, res, log);
    default:
      return res.json({ error: 'INVALID_OPERATION' }, 400);
  }
}

async function handleCreatePayment(req, res, log) {
  const input = req.bodyJson.input || {};
  if (!input.userId || !input.amount || !input.currency) {
    return res.json({ error: 'INVALID_INPUT' }, 400);
  }

  const paymentId =
    input.paymentId ||
    'np_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);

  const sdk = nowpaymentsSDK();
  const np = await sdk.createDirectPayment({
    amount: input.amount,
    currency: String(input.currency).toLowerCase(),
    payCurrency: input.payCurrency,
    orderId: paymentId,
    ipnCallbackUrl: process.env.NOWPAYMENTS_IPN_CALLBACK_URL,
  });

  const now = new Date().toISOString();
  const amountMinor =
    input.amountMinor != null ? input.amountMinor : Math.round(input.amount * 100);

  await appwriteRequest(req, 'POST', `/tablesdb/${DATABASE_ID}/tables/${PAYMENTS_TABLE}/rows`, {
    databaseId: DATABASE_ID,
    tableId: PAYMENTS_TABLE,
    rowId: paymentId,
    data: {
      userId: input.userId,
      amount: amountMinor,
      currency: String(input.currency).toUpperCase(),
      provider: 'NOWPAYMENTS',
      status: 'AWAITING_PROVIDER',
      providerPaymentId: String(np.payment_id),
      idempotencyKey: paymentId,
      createdAt: now,
      updatedAt: now,
    },
  });

  log('nowpayments create_payment', `paymentId=${paymentId}`, `providerPaymentId=${np.payment_id}`);

  return res.json({
    status: 'SUCCESS',
    result: {
      paymentId,
      providerPaymentId: String(np.payment_id),
      payAddress: np.pay_address,
      payAmount: np.pay_amount,
      payCurrency: np.pay_currency,
      invoiceUrl: np.invoice_url || null,
    },
  });
}

async function handleCreateSubscription(req, res, log) {
  const input = req.bodyJson.input || {};
  if (!input.subscriptionId || !input.email || !input.amount || !input.currency) {
    return res.json({ error: 'INVALID_INPUT' }, 400);
  }

  const jwt = await getJwt(req);

  // 1. Create the NOWPayments subscription plan (prerequisite).
  const plan = await npRequest('POST', '/subscriptions/plans', {
    title: `StoryGalore ${input.planId || 'subscription'}`,
    interval_day: intervalToDays(input.interval),
    amount: input.amount,
    currency: String(input.currency).toLowerCase(),
  }, jwt);
  const planId = plan.result ? plan.result.id : plan.id;

  // 2. Create the email subscription against the plan.
  const sub = await npRequest('POST', '/subscriptions', {
    subscription_plan_id: planId,
    email: input.email,
  }, jwt);
  // NOWPayments returns { result: [ { id, ... } ] } (an array of subscriptions).
  const subObj = (Array.isArray(sub.result) ? sub.result[0] : sub.result) || sub;
  const subId = subObj.id;

  // 3. Update the subscriptions row (created by the Go gateway).
  await appwriteRequest(
    req,
    'PATCH',
    `/tablesdb/${DATABASE_ID}/tables/${SUBSCRIPTIONS_TABLE}/rows/${input.subscriptionId}`,
    {
      databaseId: DATABASE_ID,
      tableId: SUBSCRIPTIONS_TABLE,
      rowId: input.subscriptionId,
      data: {
        providerSubscriptionId: String(subId),
        providerPlanId: String(planId),
        status: 'AWAITING_PROVIDER',
        updatedAt: new Date().toISOString(),
      },
    }
  );

  log(
    'nowpayments create_subscription',
    `subscriptionId=${input.subscriptionId}`,
    `providerSubscriptionId=${subId}`
  );

  return res.json({
    status: 'SUCCESS',
    result: {
      subscriptionId: input.subscriptionId,
      providerSubscriptionId: String(subId),
      providerPlanId: String(planId),
    },
  });
}

async function handleCancelSubscription(req, res, log) {
  const input = req.bodyJson.input || {};
  if (!input.providerSubscriptionId) {
    return res.json({ error: 'INVALID_INPUT' }, 400);
  }
  const jwt = await getJwt(req);
  await npRequest('DELETE', `/subscriptions/${input.providerSubscriptionId}`, null, jwt);
  log('nowpayments cancel_subscription', `providerSubscriptionId=${input.providerSubscriptionId}`);
  return res.json({ status: 'SUCCESS', result: { cancelled: true } });
}

async function handleIpn(req, res, log) {
  const sdk = nowpaymentsSDK();
  const sig = req.headers['x-nowpayments-sig'];
  if (!sig) {
    return res.json({ error: 'MISSING_SIGNATURE' }, 400);
  }

  const payload = req.bodyJson;
  let isValid = false;
  try {
    isValid = sdk.verifyWebhookSignature(payload, sig);
  } catch (e) {
    return res.json({ error: 'SIGNATURE_VERIFICATION_FAILED' }, 400);
  }
  if (!isValid) {
    return res.json({ error: 'SIGNATURE_VERIFICATION_FAILED' }, 400);
  }

  // One-time payment status change.
  if (payload.payment_id) {
    const paymentId = payload.order_id || payload.purchase_id || payload.payment_id;
    const status = mapPaymentStatus(payload.payment_status);
    await appwriteRequest(req, 'PATCH', `/tablesdb/${DATABASE_ID}/tables/${PAYMENTS_TABLE}/rows/${paymentId}`, {
      databaseId: DATABASE_ID,
      tableId: PAYMENTS_TABLE,
      rowId: paymentId,
      data: { status, updatedAt: new Date().toISOString() },
    });
    log('nowpayments ipn payment', `paymentId=${paymentId}`, `status=${status}`, `rawStatus=${payload.payment_status}`);
    return res.json({ ok: true });
  }

  // Recurring payment (subscription) status change: has id/status but no
  // payment_id/address.
  if (payload.id && payload.currency && payload.amount && !payload.address) {
    const status = mapSubscriptionStatus(payload.status);
    await updateSubscriptionByProviderId(req, String(payload.id), status);
    log('nowpayments ipn subscription', `providerSubscriptionId=${payload.id}`, `status=${status}`, `rawStatus=${payload.status}`);
  }

  return res.json({ ok: true });
}

// Find the subscriptions row whose providerSubscriptionId matches the NOWPayments
// recurring payment id, and transition it to the given status (idempotent: no
// regression from terminal states).
async function updateSubscriptionByProviderId(req, providerSubscriptionId, status) {
  const q = JSON.stringify([
    { method: 'equal', attribute: 'providerSubscriptionId', values: [providerSubscriptionId] },
  ]);
  const list = await appwriteRequest(
    req,
    'GET',
    `/tablesdb/${DATABASE_ID}/tables/${SUBSCRIPTIONS_TABLE}/rows?queries=${encodeURIComponent(q)}`
  );
  const rows = (list && list.rows) || [];
  for (const row of rows) {
    const current = row.data && row.data.status;
    if (['ACTIVE', 'CANCELLED', 'EXPIRED'].includes(current)) continue;
    await appwriteRequest(req, 'PATCH', `/tablesdb/${DATABASE_ID}/tables/${SUBSCRIPTIONS_TABLE}/rows/${row.$id}`, {
      databaseId: DATABASE_ID,
      tableId: SUBSCRIPTIONS_TABLE,
      rowId: row.$id,
      data: { status, updatedAt: new Date().toISOString() },
    });
  }
}
