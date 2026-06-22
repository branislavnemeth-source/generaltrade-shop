/* ===================================================================
   Generaltrade Shop — Stripe Webhook (Netlify Function)
   -------------------------------------------------------------------
   Spracuje udalosť `checkout.session.completed` od Stripe:
     • overí podpis webhooku (STRIPE_WEBHOOK_SECRET),
     • zaeviduje zaplatenú objednávku (log + voliteľne e-mail),
     • pošle e-mail adminovi a zákazníkovi cez Resend (RESEND_API_KEY).

   Vďaka tomu sa platby nemusia kontrolovať ručne v Stripe dashboarde —
   objednávka sa spracuje automaticky hneď po zaplatení.

   Premenné prostredia (Netlify → Environment variables):
     STRIPE_SECRET_KEY      — tajný kľúč Stripe (sk_live_… / sk_test_…)
     STRIPE_WEBHOOK_SECRET  — podpisové tajomstvo webhooku (whsec_…)
     RESEND_API_KEY         — API kľúč Resend (re_…)            [voliteľné]
     ORDER_FROM_EMAIL       — odosielateľ, napr. objednavky@generaltrade.shop
     ORDER_NOTIFY_EMAIL     — admin e-mail pre notifikácie
   =================================================================== */

const Stripe = require('stripe');

// Netlify musí dať RAW telo, aby podpis sedel — viď export `config` nižšie.
exports.handler = async (event) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !webhookSecret) {
    return { statusCode: 500, body: 'Webhook nie je nakonfigurovaný (chýba STRIPE_SECRET_KEY alebo STRIPE_WEBHOOK_SECRET).' };
  }

  const stripe = Stripe(secret);
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];

  // Telo môže prísť base64-kódované (binárne) — dekódujeme na raw string.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Zaujíma nás len úspešne dokončená platba.
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: JSON.stringify({ received: true, ignored: stripeEvent.type }) };
  }

  const session = stripeEvent.data.object;

  // Spoľahlivosť: pri async platobných metódach môže byť stav "unpaid".
  if (session.payment_status && session.payment_status !== 'paid') {
    return { statusCode: 200, body: JSON.stringify({ received: true, payment_status: session.payment_status }) };
  }

  const order = {
    orderId: session.client_reference_id || (session.metadata && session.metadata.orderId) || session.id,
    amount: (session.amount_total != null) ? (session.amount_total / 100).toFixed(2) : '?',
    currency: (session.currency || 'eur').toUpperCase(),
    email: session.customer_details && session.customer_details.email
      ? session.customer_details.email
      : (session.customer_email || ''),
    name: session.customer_details ? session.customer_details.name : '',
    shipping: session.metadata ? session.metadata.shipping : '',
    address: session.customer_details && session.customer_details.address
      ? session.customer_details.address : (session.shipping_details ? session.shipping_details.address : null),
    stripeSession: session.id,
  };

  // Vždy zalogujeme — viditeľné v Netlify → Functions → logs.
  console.log('PAID ORDER:', JSON.stringify(order));

  // --- Položky objednávky (pre e-mail) ---
  let itemsHtml = '';
  let itemsText = '';
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
    for (const it of items.data) {
      const line = `${it.description} × ${it.quantity} — ${(it.amount_total / 100).toFixed(2)} ${order.currency}`;
      itemsHtml += `<tr><td style="padding:4px 0">${escapeHtml(it.description)} × ${it.quantity}</td><td style="padding:4px 0;text-align:right">${(it.amount_total / 100).toFixed(2)} ${order.currency}</td></tr>`;
      itemsText += '  - ' + line + '\n';
    }
  } catch (e) {
    console.error('listLineItems error:', e.message);
  }

  // --- Odoslanie e-mailov cez Resend (ak je nakonfigurované) ---
  await sendEmails(order, itemsHtml, itemsText);

  return { statusCode: 200, body: JSON.stringify({ received: true, orderId: order.orderId }) };
};

// Netlify: nech telo NEparsuje, aby podpis Stripe sedel.
exports.config = { bodyParser: false };

async function sendEmails(order, itemsHtml, itemsText) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL || 'objednavky@generaltrade.shop';
  const adminTo = process.env.ORDER_NOTIFY_EMAIL;

  if (!apiKey) {
    console.log('RESEND_API_KEY chýba — e-mail sa neodoslal, objednávka len zalogovaná.');
    return;
  }

  const addr = order.address
    ? [order.address.line1, order.address.line2, order.address.postal_code, order.address.city, order.address.country]
        .filter(Boolean).join(', ')
    : '';

  const baseHtml = (heading, intro) => `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222">
      <h2 style="color:#1a5e3a">${heading}</h2>
      <p>${intro}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        ${itemsHtml}
        <tr><td style="padding:8px 0;border-top:1px solid #ddd"><strong>Spolu uhradené</strong></td>
            <td style="padding:8px 0;border-top:1px solid #ddd;text-align:right"><strong>${order.amount} ${order.currency}</strong></td></tr>
      </table>
      <p><strong>Číslo objednávky:</strong> ${escapeHtml(order.orderId)}<br/>
         ${order.name ? '<strong>Zákazník:</strong> ' + escapeHtml(order.name) + '<br/>' : ''}
         ${order.email ? '<strong>E-mail:</strong> ' + escapeHtml(order.email) + '<br/>' : ''}
         ${addr ? '<strong>Adresa:</strong> ' + escapeHtml(addr) + '<br/>' : ''}
         ${order.shipping ? '<strong>Doprava:</strong> ' + escapeHtml(order.shipping) : ''}</p>
      <p style="color:#666;font-size:13px">Generaltrade Shop · generaltrade.shop</p>
    </div>`;

  const sends = [];

  // Potvrdenie zákazníkovi
  if (order.email) {
    sends.push(resendSend(apiKey, {
      from,
      to: order.email,
      subject: `Potvrdenie objednávky ${order.orderId} — Generaltrade Shop`,
      html: baseHtml('Ďakujeme za objednávku!',
        `Vašu platbu sme úspešne prijali. Objednávku <strong>${escapeHtml(order.orderId)}</strong> spracujeme a tovar expedujeme z externého skladu (zvyčajne 2–5 pracovných dní).`),
    }));
  }

  // Notifikácia adminovi
  if (adminTo) {
    sends.push(resendSend(apiKey, {
      from,
      to: adminTo,
      subject: `💶 Nová zaplatená objednávka ${order.orderId} (${order.amount} ${order.currency})`,
      html: baseHtml('Nová zaplatená objednávka',
        `Práve bola zaplatená objednávka <strong>${escapeHtml(order.orderId)}</strong>. Pripravte expedíciu.`),
    }));
  } else {
    console.log('ORDER_NOTIFY_EMAIL chýba — admin notifikácia sa neodoslala.');
  }

  const results = await Promise.allSettled(sends);
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error('Resend send failed:', r.reason);
  });
}

async function resendSend(apiKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Resend HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
