#!/usr/bin/env node
/**
 * Import Panakeia Google Merchant XML feed into a static products.json
 * for use by the Generaltrade storefront.
 *
 * Behaviour
 * - Pulls https://www.panakeia.sk/google/export/products.xml (or local file)
 * - Parses each <item> into a normalized product object
 * - Applies a +40% markup on price (rounded to 2 decimals, with .x9 ending where possible)
 * - Derives a stable slug + category from g:product_type
 * - Writes data/products.json, data/categories.json, data/feed-meta.json
 *
 * Usage:
 *   node scripts/import-feed.mjs
 *   node scripts/import-feed.mjs --source ./feed.xml
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const FEED_URL = 'https://www.panakeia.sk/google/export/products.xml';
const MARKUP = 1.40; // +40 %

const args = process.argv.slice(2);
const sourceArg = args.indexOf('--source');
const localSource = sourceArg >= 0 ? args[sourceArg + 1] : null;

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

async function loadXml() {
  if (localSource) {
    console.log(`[feed] reading local: ${localSource}`);
    return readFileSync(localSource, 'utf8');
  }
  console.log(`[feed] fetching: ${FEED_URL}`);
  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'Generaltrade-Shop/1.0 (+https://generaltrade.shop)' },
  });
  if (!res.ok) throw new Error(`Feed HTTP ${res.status}`);
  return await res.text();
}

// Lightweight XML parser tuned for the Google Merchant RSS structure
function parseItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    items.push(parseItem(m[1]));
  }
  return items.filter(Boolean);
}

function tag(block, name) {
  // matches <name>value</name> or <name attr="x">value</name>, possibly with CDATA
  const re = new RegExp(`<${name.replace(':', '\\:')}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name.replace(':', '\\:')}>`);
  const m = re.exec(block);
  if (!m) return null;
  let v = m[1].trim();
  const cd = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(v);
  if (cd) v = cd[1].trim();
  return v;
}

function tagAll(block, name) {
  const re = new RegExp(`<${name.replace(':', '\\:')}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name.replace(':', '\\:')}>`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(block)) !== null) {
    let v = m[1].trim();
    const cd = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(v);
    if (cd) v = cd[1].trim();
    out.push(v);
  }
  return out;
}

function decode(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function slugify(s) {
  return decode(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function priceFromString(s) {
  if (!s) return null;
  const m = /([0-9]+(?:[.,][0-9]+)?)/.exec(s);
  if (!m) return null;
  return parseFloat(m[1].replace(',', '.'));
}

function applyMarkup(price) {
  if (price == null) return null;
  const raw = price * MARKUP;
  // Round to 2 decimals, keep psychological pricing-friendly result
  return Math.round(raw * 100) / 100;
}

function deriveCategory(productType) {
  if (!productType) return { id: 'ostatne', name: 'Ostatné', path: ['Ostatné'] };
  const cleaned = decode(productType)
    .replace(/PANAKEIA®?\s*slovensk[áa]\s*pr[íi]rodn[áa]\s*kozmetika/i, '')
    .replace(/^\s*&gt;\s*/, '')
    .replace(/^\s*>\s*/, '')
    .trim();
  const parts = cleaned.split(/\s*(?:&gt;|>)\s*/).map((p) => p.trim()).filter(Boolean);
  const name = parts[parts.length - 1] || 'Ostatné';
  return {
    id: slugify(name) || 'ostatne',
    name,
    path: parts,
  };
}

function parseItem(block) {
  const id = tag(block, 'g:id');
  const title = decode(tag(block, 'title') || '');
  const description = decode(tag(block, 'description') || '');
  const productType = tag(block, 'g:product_type');
  const link = tag(block, 'link');
  const image = tag(block, 'g:image_link');
  const additionalImages = tagAll(block, 'g:additional_image_link');
  const condition = tag(block, 'g:condition');
  const availability = (tag(block, 'g:availability') || '').toLowerCase();
  const priceRaw = tag(block, 'g:price');
  const gtin = tag(block, 'g:gtin');
  const brand = tag(block, 'g:brand');
  const itemGroup = tag(block, 'g:item_group_id');

  if (!id || !title) return null;

  const feedPrice = priceFromString(priceRaw);
  const finalPrice = applyMarkup(feedPrice);

  const cat = deriveCategory(productType);
  const slug = slugify(title) + '-' + id.toLowerCase();

  // Pull shipping (informational only — Generaltrade applies its own shipping rules)
  const shippingBlock = /<g:shipping>([\s\S]*?)<\/g:shipping>/.exec(block);
  let feedShipping = null;
  if (shippingBlock) {
    const sb = shippingBlock[1];
    feedShipping = {
      country: tag(sb, 'g:country'),
      service: tag(sb, 'g:service'),
      price: priceFromString(tag(sb, 'g:price')),
    };
  }

  return {
    id,
    slug,
    title,
    description,
    short_description: description.split('\n')[0].slice(0, 160),
    category: cat,
    brand: brand || null,
    gtin: gtin || null,
    item_group_id: itemGroup || null,
    condition: condition || 'new',
    availability: availability.includes('in stock') ? 'in_stock' : 'out_of_stock',
    price: finalPrice,
    feed_price: feedPrice,
    currency: 'EUR',
    image,
    additional_images: additionalImages,
    feed_link: link, // INTERNAL ONLY — not shown to customers
    feed_shipping: feedShipping,
  };
}

function buildCategories(products) {
  const map = new Map();
  for (const p of products) {
    const c = p.category;
    if (!map.has(c.id)) {
      map.set(c.id, { id: c.id, name: c.name, path: c.path, count: 0, in_stock: 0 });
    }
    const e = map.get(c.id);
    e.count += 1;
    if (p.availability === 'in_stock') e.in_stock += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

(async () => {
  ensureDir(DATA_DIR);
  const xml = await loadXml();
  const items = parseItems(xml);
  console.log(`[feed] parsed ${items.length} items`);

  const categories = buildCategories(items);
  const meta = {
    source: localSource || FEED_URL,
    fetched_at: new Date().toISOString(),
    item_count: items.length,
    in_stock: items.filter((i) => i.availability === 'in_stock').length,
    out_of_stock: items.filter((i) => i.availability === 'out_of_stock').length,
    markup: MARKUP,
  };

  writeFileSync(join(DATA_DIR, 'products.json'), JSON.stringify(items, null, 2));
  writeFileSync(join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2));
  writeFileSync(join(DATA_DIR, 'feed-meta.json'), JSON.stringify(meta, null, 2));

  console.log(`[feed] wrote ${items.length} products → data/products.json`);
  console.log(`[feed] wrote ${categories.length} categories → data/categories.json`);
  console.log(`[feed] in_stock: ${meta.in_stock}  out_of_stock: ${meta.out_of_stock}`);
})().catch((err) => {
  console.error('[feed] FAILED:', err);
  process.exit(1);
});
