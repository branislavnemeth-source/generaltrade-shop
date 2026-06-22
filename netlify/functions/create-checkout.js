/* ===================================================================
   Generaltrade Shop — Stripe Checkout Session (Netlify Function)
   -------------------------------------------------------------------
   Vytvorí Stripe Checkout Session z obsahu košíka.

   BEZPEČNOSŤ: cena sa NIKDY neberie z frontendu. Funkcia si stiahne
   živý products.json z e-shopu a prepočíta sumu na serveri podľa
   poslaných ID produktov a množstiev. Klient nemôže cenu ovplyvniť.

   Tajný kľúč Stripe sa číta z premennej prostredia STRIPE_SECRET_KEY
   (nastavená v Netlify → Site settings → Environment variables).
   Nikdy nie je v kóde ani v repozitári.
   =================================================================== */

const Stripe = require('stripe');

// --- Konfigurácia (rovnaké hodnoty ako vo frontende) ---
const PRODUCTS_URL = 'https://generaltrade.shop/data/products.json';
const SITE_URL = 'https://generaltrade.shop';
const FREE_SHIPPING_THRESHOLD = 60.0;
const SHIPPING = { gls: 3.5, packeta: 4.5, pickup: 0 };
const CURRENCY = 'eur';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': SITE_URL,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function cents(eur) {
  return Math.round(Number(eur) * 100);
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Platobná brána nie je nakonfigurovaná (chýba STRIPE_SECRET_KEY).' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Neplatné dáta.' }) };
  }

  const cart = Array.isArray(payload.cart) ? payload.cart : [];
  const shipping = SHIPPING.hasOwnProperty(payload.shipping) ? payload.shipping : 'gls';
  const orderId = typeof payload.orderId === 'string' ? payload.orderId.slice(0, 40) : '';
  const email = typeof payload.email === 'string' ? payload.email.slice(0, 200) : '';

  if (!cart.length) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Košík je prázdny.' }) };
  }

  // --- Stiahnutie živého katalógu a prepočet cien na serveri ---
  let products;
  try {
    const res = await fetch(PRODUCTS_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('feed ' + res.status);
    products = await res.json();
  } catch (e) {
    return { statusCode: 502, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Nepodarilo sa načítať katalóg produktov.' }) };
  }
  const byId = new Map(products.map((p) => [String(p.id), p]));

  const line_items = [];
  let subtotal = 0;
  for (const line of cart) {
    const p = byId.get(String(line && line.id));
    if (!p) continue;
    const qty = Math.max(1, Math.min(99, parseInt(line.qty, 10) || 1));
    const price = Number(p.price);
    if (!isFinite(price) || price <= 0) continue;
    subtotal += price * qty;
    line_items.push({
      quantity: qty,
      price_data: {
        currency: CURRENCY,
        unit_amount: cents(price),
        product_data: {
          name: String(p.title || 'Produkt').slice(0, 250),
          images: p.image ? [String(p.image)] : [],
        },
      },
    });
  }

  if (!line_items.length) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: 'Žiadne platné položky v košíku.' }) };
  }

  // --- Doprava ako samostatná položka (zľava pri free shipping) ---
  let shipEur = SHIPPING[shipping];
  if (shipping !== 'pickup' && subtotal >= FREE_SHIPPING_THRESHOLD) shipEur = 0;
  if (shipEur > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: CURRENCY,
        unit_amount: cents(shipEur),
        product_data: { name: 'Doprava' + (shipping === 'packeta' ? ' — Packeta' : ' — GLS') },
      },
    });
  }

  const stripe = Stripe(secret);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      locale: 'sk',
      ...(email ? { customer_email: email } : {}),
      client_reference_id: orderId || undefined,
      metadata: { orderId, shipping },
      shipping_address_collection: { allowed_countries: ['SK', 'CZ'] },
      success_url: `${SITE_URL}/pokladna.html?platba=ok&objednavka=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/pokladna.html?platba=zrusena`,
    });
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ url: session.url, id: session.id }) };
  } catch (e) {
    return {
      statusCode: 502,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Stripe: ' + (e && e.message ? e.message : 'neznáma chyba') }),
    };
  }
};
