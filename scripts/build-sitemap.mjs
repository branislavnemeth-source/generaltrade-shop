#!/usr/bin/env node
/**
 * Build sitemap.xml from static pages + product detail URLs.
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DOMAIN = 'https://generaltrade.shop';
const today = new Date().toISOString().slice(0,10);

const STATIC_PAGES = [
  ['',                              '1.0', 'weekly'],
  ['katalog.html',                  '0.9', 'daily'],
  ['kategorie.html',                '0.8', 'weekly'],
  ['o-nas.html',                    '0.6', 'monthly'],
  ['kontakt.html',                  '0.6', 'monthly'],
  ['doprava-platba.html',           '0.7', 'monthly'],
  ['faq.html',                      '0.6', 'monthly'],
  ['obchodne-podmienky.html',       '0.4', 'yearly'],
  ['reklamacny-poriadok.html',      '0.4', 'yearly'],
  ['odstupenie-od-zmluvy.html',     '0.4', 'yearly'],
  ['ochrana-osobnych-udajov.html',  '0.4', 'yearly'],
  ['cookies.html',                  '0.4', 'yearly'],
];

const products = JSON.parse(readFileSync(join(ROOT, 'data/products.json'), 'utf8'));

const lines = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];

for (const [path, prio, freq] of STATIC_PAGES) {
  lines.push(`  <url><loc>${DOMAIN}/${path}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`);
}

for (const p of products) {
  if (p.availability !== 'in_stock') continue;
  lines.push(`  <url><loc>${DOMAIN}/produkt.html?id=${encodeURIComponent(p.id)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
}
lines.push('</urlset>');
writeFileSync(join(ROOT, 'sitemap.xml'), lines.join('\n'));
console.log(`[sitemap] wrote ${lines.length - 2} URLs`);
