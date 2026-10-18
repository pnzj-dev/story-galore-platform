import { NowPaymentsSDK } from '@nowpaymentsio/nowpayments-sdk-nodejs';

// StoryGalore NOWPayments adapter — TypeScript/Node Appwrite function.
// This is the ONLY Appwrite function allowed in TypeScript: the NOWPayments
// SDK has no Go equivalent (see AGENTS.md rule 4 exception).
//
// Two paths:
//   POST /                         -> command: create_payment
//   POST /webhooks/nowpayments     -> IPN (Instant Payment Notification)

const DATABASE_ID = 'main';
const PAYMENTS_TABLE = 'payments';
const APPWRITE_ENDPOINT =
  process.env.APPWRITE_ENDPOINT ||
  process.env.APPWRITE_FUNCTION_API_ENDPOINT ||
  'http://187.126.0.227/v1';

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

// Map NOWPayments SDK status -> StoryGalore payments.status enum.
function mapStatus(sdkStatus) {
  switch (sdkStatus) {
    case 'paid':
      return 'CAPTURED';
    case 'failed':
      return 'FAILED';
    case 'expired':
      return 'EXPIRED';
    case 'refunded':
      return 'REFUNDED';
    case 'cancelled':
      return 'FAILED';
    default:
      // pending, processing, partially_paid, unknown
      return 'AWAITING_PROVIDER';
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
  if (!body || body.operation !== 'create_payment') {
    return res.json({ error: 'INVALID_OPERATION' }, 400);
  }
  const input = body.input || {};
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

async function handleIpn(req, res, log) {
  const sdk = nowpaymentsSDK();
  const sig = req.headers['x-nowpayments-sig'];
  if (!sig) {
    return res.json({ error: 'MISSING_SIGNATURE' }, 400);
  }

  // parseWebhook verifies the HMAC-SHA512 signature and returns a normalized event.
  const event = sdk.parseWebhook(req.bodyJson, sig);

  if (event.type === 'payment.status_changed') {
    const p = event.payment;
    const paymentId = p.order_id || p.purchase_id || p.payment_id;
    const status = mapStatus(p.status);
    await appwriteRequest(
      req,
      'PATCH',
      `/tablesdb/${DATABASE_ID}/tables/${PAYMENTS_TABLE}/rows/${paymentId}`,
      {
        databaseId: DATABASE_ID,
        tableId: PAYMENTS_TABLE,
        rowId: paymentId,
        data: { status, updatedAt: new Date().toISOString() },
      }
    );
    log('nowpayments ipn', `paymentId=${paymentId}`, `status=${status}`, `rawStatus=${p.payment_status}`);
  }

  return res.json({ ok: true });
}
