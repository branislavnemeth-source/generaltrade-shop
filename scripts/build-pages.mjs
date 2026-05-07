#!/usr/bin/env node
/**
 * Build all HTML pages from a template + content map.
 * Static output: ready for Hostinger.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SITE = {
  name: 'Generaltrade Shop',
  tagline: 'Prírodná kozmetika a wellness',
  domain: 'https://generaltrade.shop',
  email: 'info@generaltrade.shop',
  phone: '+421 XXX XXX XXX', // configure on Hostinger
  business: {
    company: 'Ing. Branislav Németh – Generaltrade',
    ico: '51487446',
    address: 'Armádna 777/4, 911 01 Trenčín',
    register: 'Okresný úrad Trenčín, číslo živn. registra 840-24688',
  },
  payment: {
    holder: 'Branislav Németh',
    iban: 'LT54 3250 0672 8822 9312',
    bic: 'REVOLT21',
    bank: 'Revolut Bank UAB, Konstitucijos ave. 21B, 08130 Vilnius, Lithuania',
    correspondent: 'CHASDEFX',
  },
  shipping: {
    free_threshold: 60,
    gls: 3.50,
    packeta: 4.50,
  },
};

function head(title, description, canonical) {
  const t = title ? `${title} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const d = description || 'Generaltrade — slovenský e-shop s prírodnou kozmetikou, doplnkami zdravej výživy a wellness produktmi. Doprava zdarma nad 60 €.';
  const c = canonical || SITE.domain;
  return `<!doctype html>
<html lang="sk">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${t}</title>
  <meta name="description" content="${d}"/>
  <link rel="canonical" href="${c}"/>
  <meta name="theme-color" content="#3F6B45"/>
  <meta name="robots" content="index,follow"/>
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="${t}"/>
  <meta property="og:description" content="${d}"/>
  <meta property="og:url" content="${c}"/>
  <meta property="og:locale" content="sk_SK"/>
  <meta property="og:site_name" content="${SITE.name}"/>
  <meta property="og:image" content="${SITE.domain}/assets/og-image.svg"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg"/>
  <link rel="preconnect" href="https://rsms.me/"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="assets/styles.css"/>
  <script defer src="assets/main.js"></script>
</head>
<body>
  ${header()}
`;
}

function header() {
  return `<header class="site-header">
  <div class="header-top">
    <div class="container">
      <span>Doprava ZDARMA nad 60 € · Skladom z externého skladu · Expedícia 2–5 dní</span>
      <span><a href="kontakt.html">${SITE.email}</a></span>
    </div>
  </div>
  <div class="container">
    <div class="header-main">
      <a href="index.html" class="brand" aria-label="${SITE.name} – domov">
        <img src="assets/logo.svg" alt="${SITE.name}"/>
      </a>
      <button class="menu-toggle" aria-label="Otvoriť menu" type="button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
      <nav class="nav" aria-label="Hlavná navigácia">
        <a href="index.html">Domov</a>
        <a href="katalog.html">Katalóg</a>
        <a href="kategorie.html">Kategórie</a>
        <a href="o-nas.html">O nás</a>
        <a href="doprava-platba.html">Doprava a platba</a>
        <a href="kontakt.html">Kontakt</a>
      </nav>
      <div class="header-actions">
        <a href="kosik.html" class="cart-btn" aria-label="Košík">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.5 11h11l2-7H6.5"/></svg>
          <span class="cart-count" data-cart-count style="display:none">0</span>
        </a>
      </div>
    </div>
  </div>
</header>
<main>`;
}

function footer() {
  const yr = new Date().getFullYear();
  return `</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <img src="assets/logo.svg" alt="${SITE.name}" style="height:42px;filter:brightness(1.1) invert(.05)"/>
        <p class="text-small" style="margin-top:14px;max-width:36ch;color:var(--muted-2)">${SITE.tagline}. Slovenský e-shop s prírodnou kozmetikou a wellness produktmi. Tovar expedujeme z externého skladu.</p>
        <p class="text-small" style="color:var(--muted-2)">${SITE.business.company}<br>IČO: ${SITE.business.ico}<br>${SITE.business.address}</p>
      </div>
      <div>
        <h4>Obchod</h4>
        <ul>
          <li><a href="katalog.html">Katalóg produktov</a></li>
          <li><a href="kategorie.html">Kategórie</a></li>
          <li><a href="kosik.html">Košík</a></li>
          <li><a href="doprava-platba.html">Doprava a platba</a></li>
        </ul>
      </div>
      <div>
        <h4>Informácie</h4>
        <ul>
          <li><a href="o-nas.html">O nás</a></li>
          <li><a href="kontakt.html">Kontakt</a></li>
          <li><a href="faq.html">FAQ</a></li>
        </ul>
      </div>
      <div>
        <h4>Právne</h4>
        <ul>
          <li><a href="obchodne-podmienky.html">Obchodné podmienky</a></li>
          <li><a href="reklamacny-poriadok.html">Reklamačný poriadok</a></li>
          <li><a href="odstupenie-od-zmluvy.html">Odstúpenie od zmluvy</a></li>
          <li><a href="ochrana-osobnych-udajov.html">Ochrana osobných údajov</a></li>
          <li><a href="cookies.html">Cookies</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${yr} ${SITE.business.company}. Všetky práva vyhradené.</span>
      <span>Vytvorené v Slovensku · ${SITE.domain.replace('https://','')}</span>
    </div>
  </div>
</footer>
</body>
</html>`;
}

function legalDisclaimer() {
  return `<div class="legal-disclaimer"><strong>Upozornenie:</strong> Tento dokument predstavuje vzorovú šablónu pripravenú pre potreby tohto e-shopu. Pred ostrým spustením prevádzky odporúčame text dať preveriť právnemu/účtovnému poradcovi.</div>`;
}

function page(filename, title, description, body) {
  const canonical = `${SITE.domain}/${filename}`;
  const html = head(title, description, canonical) + body + footer();
  writeFileSync(join(ROOT, filename), html);
  console.log('  wrote', filename);
}

// -------------------- PAGES --------------------

// HOME
page('index.html',
  null,
  'Generaltrade Shop — slovenský e-shop s prírodnou kozmetikou, doplnkami zdravej výživy a wellness produktmi. Doprava zdarma nad 60 €. Expedícia z externého skladu.',
`<section class="hero">
  <div class="container hero-grid">
    <div>
      <p class="eyebrow">Prírodná kozmetika · Slovensko</p>
      <h1>Starostlivosť o telo z čistej prírody</h1>
      <p class="lede">Vyberáme prírodnú kozmetiku, mydlá, oleje a wellness doplnky pre každodenný rituál pohody. Tovar expedujeme z externého skladu nášho overeného partnera.</p>
      <div class="hero-cta">
        <a href="katalog.html" class="btn btn-primary btn-lg">Prezrieť katalóg</a>
        <a href="kategorie.html" class="btn btn-secondary btn-lg">Kategórie</a>
      </div>
      <div id="home-stats" class="grid grid-3" style="margin-top:36px;font-family:var(--serif);font-size:1.6rem"></div>
    </div>
    <div class="hero-art" aria-hidden="true">
      <svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="h1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7BA275"/>
            <stop offset="100%" stop-color="#3F6B45"/>
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="200" rx="58" ry="14" fill="#E6DCC7"/>
        <rect x="60" y="80" width="80" height="120" rx="14" fill="#F4ECDD" stroke="#B5A78A" stroke-width="1.5"/>
        <rect x="78" y="60" width="44" height="22" rx="4" fill="#3F6B45"/>
        <path d="M100 45c-12 8-18 16-18 28 0 10 8 16 18 16s18-6 18-16c0-12-6-20-18-28z" fill="url(#h1)"/>
        <text x="100" y="150" text-anchor="middle" font-family="Cormorant Garamond" font-size="14" fill="#3F6B45" font-style="italic">PANAKEIA</text>
        <text x="100" y="170" text-anchor="middle" font-family="Inter" font-size="9" fill="#7B6A52" letter-spacing="2">PRÍRODNÁ KOZMETIKA</text>
      </svg>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="flex-between" style="margin-bottom:24px">
      <div>
        <p class="eyebrow">Vybrali sme pre Vás</p>
        <h2>Najobľúbenejšie produkty</h2>
      </div>
      <a href="katalog.html" class="btn btn-secondary">Celý katalóg →</a>
    </div>
    <div id="featured-products" class="product-grid">
      <div class="skeleton" style="aspect-ratio:1/1"></div>
      <div class="skeleton" style="aspect-ratio:1/1"></div>
      <div class="skeleton" style="aspect-ratio:1/1"></div>
      <div class="skeleton" style="aspect-ratio:1/1"></div>
    </div>
  </div>
</section>

<section class="section" style="background:var(--paper);border-top:1px solid var(--line);border-bottom:1px solid var(--line)">
  <div class="container">
    <p class="eyebrow text-center">Prečo Generaltrade</p>
    <h2 class="text-center" style="margin-bottom:36px">Hodnota, ktorú prinášame</h2>
    <div class="feature-row">
      <div class="feature">
        <div class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 6 6 10 6 14a6 6 0 0012 0c0-4-2-8-6-12z"/></svg></div>
        <h3>Prírodné zloženie</h3>
        <p class="text-small text-muted">Zameriavame sa na produkty s prírodným zložením a transparentne uvádzame pôvod.</p>
      </div>
      <div class="feature">
        <div class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7l9-4 9 4v6c0 5-4 9-9 11-5-2-9-6-9-11V7z"/></svg></div>
        <h3>Doprava zdarma nad 60 €</h3>
        <p class="text-small text-muted">Pre objednávky nad 60 € hradíme dopravu kuriérom GLS aj cez Zásielkovňu.</p>
      </div>
      <div class="feature">
        <div class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
        <h3>Expedícia 2–5 dní</h3>
        <p class="text-small text-muted">Tovar je na externom sklade nášho partnera. Po platbe expedujeme zvyčajne do 2–5 prac. dní.</p>
      </div>
      <div class="feature">
        <div class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l3-3 4 4 8-8 3 3"/></svg></div>
        <h3>14 dní na vrátenie</h3>
        <p class="text-small text-muted">V súlade so slovenskou legislatívou máte 14 dní na odstúpenie od zmluvy bez udania dôvodu.</p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <p class="eyebrow">Kategórie</p>
    <h2>Prechádzajte podľa zamerania</h2>
    <div id="home-categories" class="feature-row" style="margin-top:24px"></div>
  </div>
</section>

<section class="section" style="background:var(--cream-2)">
  <div class="container" style="text-align:center;max-width:720px">
    <p class="eyebrow">Externý sklad</p>
    <h2>Transparentne o tom, ako predávame</h2>
    <p class="lede" style="margin:0 auto 24px">Tovar držíme na externom sklade overeného slovenského partnera. Po prijatí Vašej platby zabezpečíme expedíciu — zvyčajne do 2–5 pracovných dní. Vďaka tomu môžeme ponúkať široký sortiment bez navyšovania nákladov za skladovanie.</p>
    <a href="o-nas.html" class="btn btn-secondary">Viac o našej práci</a>
  </div>
</section>
`);

// CATALOG
page('katalog.html',
  'Katalóg produktov',
  'Prehľad všetkých produktov Generaltrade Shop — prírodná kozmetika, mydlá, oleje, wellness doplnky. Filtrujte podľa kategórie a dostupnosti.',
`<section class="section-sm">
  <div class="container">
    <p class="eyebrow">Katalóg</p>
    <h1>Všetky produkty</h1>
    <p class="lede">Prejdite si naše produkty alebo využite filter podľa kategórie a dostupnosti.</p>
  </div>
</section>
<section class="section-sm">
  <div class="container">
    <div class="catalog-grid">
      <aside id="catalog-side" class="cat-side"></aside>
      <div>
        <div id="catalog-toolbar" class="toolbar"></div>
        <div id="catalog-root"></div>
      </div>
    </div>
  </div>
</section>
`);

// CATEGORIES
page('kategorie.html',
  'Kategórie',
  'Prechádzajte produkty Generaltrade Shop podľa kategórií — prírodná kozmetika, výživové doplnky, telová starostlivosť, čaje a viac.',
`<section class="section-sm">
  <div class="container">
    <p class="eyebrow">Prehľad</p>
    <h1>Kategórie</h1>
    <p class="lede">Zvoľte kategóriu, ktorá Vás zaujíma a prejdite k produktom.</p>
  </div>
</section>
<section class="section-sm">
  <div class="container" id="all-categories"></div>
</section>
<script>
fetch('data/categories.json').then(r=>r.json()).then(cats => {
  const root = document.getElementById('all-categories');
  const grid = document.createElement('div');
  grid.className = 'feature-row';
  cats.forEach(c => {
    const a = document.createElement('a');
    a.className = 'feature';
    a.href = 'katalog.html?category=' + encodeURIComponent(c.id);
    a.innerHTML = '<div class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12c4 0 9-4 9-9"/></svg></div>' +
      '<h3>' + c.name + '</h3>' +
      '<p class="text-small text-muted">' + c.count + ' produktov · ' + c.in_stock + ' skladom</p>';
    grid.appendChild(a);
  });
  root.appendChild(grid);
});
</script>
`);

// PRODUCT
page('produkt.html',
  'Detail produktu',
  'Detail produktu z katalógu Generaltrade Shop.',
`<section class="section-sm">
  <div class="container">
    <a href="katalog.html" class="btn btn-ghost btn-sm" style="margin-bottom:18px">← Späť do katalógu</a>
    <div id="product-root" class="product-detail"></div>
  </div>
</section>
`);

// CART
page('kosik.html',
  'Košík',
  'Zhrnutie položiek vo vašom košíku v Generaltrade Shop.',
`<section class="section-sm">
  <div class="container">
    <p class="eyebrow">Krok 1 z 2</p>
    <h1>Váš košík</h1>
  </div>
</section>
<section class="section-sm">
  <div class="container">
    <div id="cart-root"></div>
  </div>
</section>
`);

// CHECKOUT
page('pokladna.html',
  'Pokladňa',
  'Dokončenie objednávky — kontaktné údaje, doprava a spôsob platby.',
`<section class="section-sm">
  <div class="container">
    <p class="eyebrow">Krok 2 z 2</p>
    <h1>Pokladňa</h1>
  </div>
</section>
<section class="section-sm">
  <div class="container">
    <div id="checkout-root"></div>
  </div>
</section>
`);

// O NAS
page('o-nas.html',
  'O nás',
  'O Generaltrade Shop — slovenský e-shop s prírodnou kozmetikou a wellness produktmi. Pôsobíme z Trenčína.',
`<section class="section">
  <div class="container prose">
    <p class="eyebrow">Príbeh</p>
    <h1>O Generaltrade</h1>
    <p class="lede">Generaltrade je rodinná značka so sídlom v Trenčíne, ktorá ponúka starostlivo vybrané prírodné a wellness produkty z overených zdrojov.</p>
    <p>Náš sortiment zahŕňa prírodnú kozmetiku, mydlá, telové oleje, čaje, výživové doplnky a doplnky pre každodennú starostlivosť o telo aj domácnosť. Všetky produkty pochádzajú zo skladu nášho slovenského partnera, vďaka čomu môžeme ponúkať rozsiahly katalog s rýchlou expedíciou.</p>

    <h2>Ako pracujeme</h2>
    <p>Tovar držíme na externom partnerskom sklade. Po prijatí Vašej objednávky a platby zabezpečíme expedíciu, zvyčajne do 2–5 pracovných dní. Tento model nám umožňuje ponúkať bohatý výber bez zbytočného navyšovania cien o skladovanie.</p>

    <h2>Naše princípy</h2>
    <ul>
      <li><strong>Transparentnosť.</strong> Otvorene informujeme o tom, že pracujeme s externým skladom.</li>
      <li><strong>Kvalitný výber.</strong> Zameriavame sa na produkty s prírodným zložením a slovenských/EU dodávateľov.</li>
      <li><strong>Férový obchod.</strong> Doprava zdarma nad 60 €, 14 dní na vrátenie tovaru.</li>
      <li><strong>Lokálne pôsobenie.</strong> Sídlime v Trenčíne, podnikateľ je zapísaný na Okresnom úrade Trenčín.</li>
    </ul>

    <h2>Kontakt</h2>
    <p>${SITE.business.company}<br>
    ${SITE.business.address}<br>
    IČO: ${SITE.business.ico}<br>
    ${SITE.business.register}</p>
    <p>E-mail: <a href="mailto:${SITE.email}">${SITE.email}</a></p>
    <p><a class="btn btn-primary" href="katalog.html">Prejsť do katalógu</a></p>
  </div>
</section>
`);

// KONTAKT
page('kontakt.html',
  'Kontakt',
  'Kontaktné údaje Generaltrade Shop — Trenčín, Slovensko.',
`<section class="section">
  <div class="container">
    <p class="eyebrow">Kontakt</p>
    <h1>Sme tu pre Vás</h1>
    <p class="lede">Najrýchlejšie nás zastihnete e-mailom. Odpovedáme zvyčajne do 24 hodín.</p>

    <div class="grid grid-2" style="margin-top:32px">
      <div class="feature">
        <h3>Prevádzkovateľ</h3>
        <p>${SITE.business.company}<br>
        ${SITE.business.address}<br>
        IČO: ${SITE.business.ico}<br>
        ${SITE.business.register}</p>
        <p>E-mail: <a href="mailto:${SITE.email}">${SITE.email}</a><br>
        Web: <a href="${SITE.domain}">${SITE.domain.replace('https://','')}</a></p>
        <p class="text-small text-muted">Nie sme platcami DPH (uvedené k dátumu prevádzky stránky — overte na faktúre).</p>
      </div>
      <div class="feature">
        <h3>Otváracie hodiny</h3>
        <p>E-shop je otvorený nepretržite. Spracovanie objednávok prebieha v pracovných dňoch.</p>
        <h4 style="margin-top:18px">Osobné prevzatie</h4>
        <p>Osobné prevzatie na adrese ${SITE.business.address} je možné <strong>po dohode</strong>. Kontaktujte nás vopred e-mailom.</p>
      </div>
    </div>

    <div class="notice" style="margin-top:24px"><strong>Tip:</strong> Pre informácie o objednávke uveďte v e-maily aj číslo objednávky (napr. GT-20250101-1234), zrýchli to riešenie.</div>
  </div>
</section>
`);

// DOPRAVA A PLATBA
page('doprava-platba.html',
  'Doprava a platba',
  'Spôsoby dopravy a platby v Generaltrade Shop. Doprava zdarma nad 60 €. Revolut, bankový prevod, platba kartou pripravujeme.',
`<section class="section">
  <div class="container prose">
    <p class="eyebrow">Doručenie</p>
    <h1>Doprava a platba</h1>
    <p class="lede">Tovar expedujeme z externého skladu nášho partnera, zvyčajne do 2–5 pracovných dní po pripísaní platby. Pre objednávky nad 60 € hradíme dopravu my.</p>

    <h2>Spôsoby doručenia</h2>
    <table>
      <thead><tr><th>Spôsob</th><th>Cena s DPH</th><th>Poznámka</th></tr></thead>
      <tbody>
        <tr><td>Kuriér GLS</td><td>3,50 €</td><td>Doručenie 1–3 prac. dni po expedícii</td></tr>
        <tr><td>Zásielkovňa — výdajné miesto</td><td>4,50 €</td><td>Vyzdvihnutie na zvolenom Z-Boxe alebo pobočke</td></tr>
        <tr><td>Osobné prevzatie (Trenčín)</td><td>po dohode</td><td>${SITE.business.address}, na základe predošlej dohody e-mailom</td></tr>
      </tbody>
    </table>
    <div class="notice" style="margin:18px 0"><strong>Doprava ZDARMA</strong> pre objednávky v hodnote nad 60 € s DPH (kuriér GLS aj Zásielkovňa).</div>

    <h2>Spôsoby platby</h2>
    <table>
      <thead><tr><th>Platba</th><th>Stav</th><th>Poznámka</th></tr></thead>
      <tbody>
        <tr><td>Revolut (IBAN)</td><td>Aktívna</td><td>Platba na Revolut účet, údaje obdržíte po objednávke</td></tr>
        <tr><td>Bankový prevod</td><td>Aktívna</td><td>SEPA prevod na účet, platobné údaje zašleme e-mailom</td></tr>
        <tr><td>Platba kartou online</td><td>Pripravujeme</td><td>Bude dostupná po aktivácii platobnej brány</td></tr>
      </tbody>
    </table>

    <h3>Platobné údaje — Revolut</h3>
    <table>
      <tbody>
        <tr><td>Príjemca</td><td>${SITE.payment.holder}</td></tr>
        <tr><td>IBAN</td><td><code>${SITE.payment.iban}</code></td></tr>
        <tr><td>BIC / SWIFT</td><td><code>${SITE.payment.bic}</code></td></tr>
        <tr><td>Banka</td><td>${SITE.payment.bank}</td></tr>
        <tr><td>Korešpondenčná banka (BIC)</td><td>${SITE.payment.correspondent}</td></tr>
      </tbody>
    </table>
    <p class="text-small text-muted">Ako variabilný symbol/poznámku uveďte číslo objednávky (napr. GT-…).</p>

    <h2>Externý sklad</h2>
    <p>Tovar nedržíme vo vlastnom sklade — je k dispozícii na externom sklade nášho partnera. Po prijatí Vašej platby zabezpečíme expedíciu. Bežná lehota expedície je 2–5 pracovných dní; v špičkách (Vianoce, akcie) môže byť dlhšia. Ak je niektorý produkt nedostupný, vopred Vás budeme kontaktovať.</p>

    <h2>Doručenie do zahraničia</h2>
    <p>Aktuálne doručujeme primárne v rámci Slovenskej republiky. Pre doručenie do ČR alebo iných krajín nás prosím kontaktujte vopred — dohodneme individuálne podmienky.</p>

    <h2>Reklamácia doručenia</h2>
    <p>Pri prevzatí zásielky skontrolujte obal. Ak je viditeľne poškodený, nahláste to ihneď kuriérovi a kontaktujte nás na <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
  </div>
</section>
`);

// OBCHODNE PODMIENKY
page('obchodne-podmienky.html',
  'Obchodné podmienky',
  'Všeobecné obchodné podmienky e-shopu Generaltrade Shop podľa slovenskej legislatívy.',
`<section class="section">
  <div class="container prose">
    <p class="eyebrow">Právne</p>
    <h1>Všeobecné obchodné podmienky</h1>
    ${legalDisclaimer()}
    <p>Účinnosť: ${new Date().toLocaleDateString('sk-SK')}.</p>

    <h2>1. Úvodné ustanovenia</h2>
    <p>Tieto všeobecné obchodné podmienky (ďalej len „VOP“) upravujú práva a povinnosti zmluvných strán vyplývajúce z kúpnej zmluvy uzatvorenej medzi predávajúcim a kupujúcim, ktorej predmetom je nákup a predaj tovaru prostredníctvom internetového obchodu predávajúceho na adrese <a href="${SITE.domain}">${SITE.domain.replace('https://','')}</a>.</p>

    <h3>1.1 Predávajúci</h3>
    <p>${SITE.business.company}<br>
    ${SITE.business.address}<br>
    IČO: ${SITE.business.ico}<br>
    ${SITE.business.register}<br>
    E-mail: <a href="mailto:${SITE.email}">${SITE.email}</a></p>
    <p>(ďalej len „predávajúci“)</p>

    <h3>1.2 Kupujúci</h3>
    <p>Kupujúcim je fyzická alebo právnická osoba, ktorá odoslala po vlastnom prihlásení sa elektronickú objednávku spracovanú systémom obchodu.</p>

    <h2>2. Objednávka a uzavretie zmluvy</h2>
    <p>Kupujúci si objednáva tovar prostredníctvom vyplnenia elektronického formulára objednávky. Po odoslaní objednávky systém zaznamená objednávku a kupujúci obdrží súhrn objednávky vrátane platobných pokynov.</p>
    <p>Kúpna zmluva je uzavretá záväzným potvrdením objednávky predávajúcim po overení dostupnosti tovaru a platnosti údajov.</p>

    <h2>3. Cena a platobné podmienky</h2>
    <p>Ceny uvedené v internetovom obchode sú konečné, vrátane DPH (ak sa uplatňuje). K cene tovaru sa pripočítava cena za prepravu podľa zvoleného spôsobu doručenia (viď stránka <a href="doprava-platba.html">Doprava a platba</a>).</p>
    <p>Pri objednávkach nad 60 € s DPH je doprava zdarma. Predávajúci nie je platcom DPH (ak je tomu inak, je to vždy uvedené na faktúre).</p>
    <p>Akceptované spôsoby platby: Revolut na uvedený IBAN, štandardný bankový prevod. Platba kartou online je v príprave a aktivuje sa po nasadení platobnej brány.</p>

    <h2>4. Dodanie tovaru</h2>
    <p>Tovar predávajúceho je expedovaný z externého skladu partnera. Štandardná lehota expedície je 2–5 pracovných dní od pripísania platby na účet predávajúceho. Doručenie kuriérom GLS prebieha 1–3 pracovné dni od expedície, doručenie cez Zásielkovňu podobne.</p>
    <p>Ak nie je možné tovar v uvedenej lehote dodať (napr. produkt nie je dostupný u dodávateľa), predávajúci kontaktuje kupujúceho a navrhne alternatívne riešenie alebo vráti zaplatenú sumu.</p>

    <h2>5. Odstúpenie od zmluvy</h2>
    <p>Kupujúci, ktorý je spotrebiteľom, má v súlade so zákonom č. 108/2024 Z. z. o ochrane spotrebiteľa právo odstúpiť od zmluvy bez uvedenia dôvodu do 14 dní odo dňa prevzatia tovaru. Podrobnosti, formulár a postup nájdete na stránke <a href="odstupenie-od-zmluvy.html">Odstúpenie od zmluvy</a>.</p>

    <h2>6. Reklamácia</h2>
    <p>Reklamačný poriadok je samostatným dokumentom, dostupný na <a href="reklamacny-poriadok.html">tejto stránke</a>. Predávajúci zodpovedá za vady tovaru pri prevzatí a počas záručnej doby 24 mesiacov.</p>

    <h2>7. Ochrana osobných údajov</h2>
    <p>Spracúvanie osobných údajov sa riadi <a href="ochrana-osobnych-udajov.html">Zásadami ochrany osobných údajov</a> v zmysle Nariadenia (EÚ) 2016/679 (GDPR) a zákona č. 18/2018 Z. z.</p>

    <h2>8. Riešenie sporov</h2>
    <p>Spotrebiteľ má právo obrátiť sa na orgán alternatívneho riešenia sporov (napr. Slovenská obchodná inšpekcia, <a href="https://www.soi.sk" target="_blank" rel="noopener">www.soi.sk</a>) alebo využiť online platformu RSO Európskej komisie: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.</p>

    <h2>9. Záverečné ustanovenia</h2>
    <p>Tieto VOP nadobúdajú platnosť dňom zverejnenia. Predávajúci si vyhradzuje právo VOP meniť. Vzťahy a prípadné spory vyplývajúce zo zmluvy sa riadia právnym poriadkom Slovenskej republiky.</p>

    <p class="text-small text-muted" style="margin-top:24px">Orgán dozoru: Slovenská obchodná inšpekcia, Inšpektorát SOI pre Trenčiansky kraj, Hurbanova 59, 911 01 Trenčín.</p>
  </div>
</section>
`);

// REKLAMACNY PORIADOK
page('reklamacny-poriadok.html',
  'Reklamačný poriadok',
  'Reklamačný poriadok Generaltrade Shop — záručná doba, postup pri reklamácii, kontaktné údaje.',
`<section class="section">
  <div class="container prose">
    <p class="eyebrow">Právne</p>
    <h1>Reklamačný poriadok</h1>
    ${legalDisclaimer()}
    <p>Účinnosť: ${new Date().toLocaleDateString('sk-SK')}.</p>

    <h2>1. Všeobecné ustanovenia</h2>
    <p>Tento reklamačný poriadok upravuje spôsob a podmienky reklamácie tovaru zakúpeného v internetovom obchode <a href="${SITE.domain}">${SITE.domain.replace('https://','')}</a>, ktorého prevádzkovateľom je ${SITE.business.company}, IČO: ${SITE.business.ico}.</p>

    <h2>2. Záručná doba</h2>
    <p>Záručná doba na tovar je 24 mesiacov, pokiaľ pri konkrétnom tovare nie je výslovne uvedená iná záručná doba (napr. dátum spotreby pri kozmetických produktoch). Záručná doba začína plynúť dňom prevzatia tovaru kupujúcim.</p>

    <h2>3. Vady tovaru</h2>
    <p>Predávajúci zodpovedá za vady, ktoré má tovar pri prevzatí kupujúcim. Pri použitom tovare nezodpovedá za vady vzniknuté ich použitím alebo opotrebením. Pri tovare predávanom za nižšiu cenu nezodpovedá za vadu, pre ktorú bola dojednaná nižšia cena.</p>

    <h2>4. Uplatnenie reklamácie</h2>
    <ol>
      <li>Reklamáciu uplatnite e-mailom na <a href="mailto:${SITE.email}">${SITE.email}</a> alebo poštou na adresu prevádzkovateľa.</li>
      <li>V reklamácii uveďte: meno, kontaktné údaje, číslo objednávky, popis vady, fotografie (ak je to možné).</li>
      <li>Tovar zašlite na adresu uvedenú v odpovedi predávajúceho — odporúčame doporučene a poistené. Tovar nezasielajte na dobierku.</li>
      <li>Predávajúci posúdi reklamáciu a najneskôr do 30 dní od jej uplatnenia ju vybaví.</li>
    </ol>

    <h2>5. Spôsob vybavenia reklamácie</h2>
    <p>Reklamáciu vybavíme jedným z nasledujúcich spôsobov: oprava, výmena, primerané zníženie ceny alebo odstúpenie od zmluvy a vrátenie peňazí.</p>

    <h2>6. Náklady spojené s reklamáciou</h2>
    <p>V prípade oprávnenej reklamácie hradí predávajúci náklady spojené s prepravou reklamovaného tovaru (po dohode). Pri neoprávnenej reklamácii nesie náklady kupujúci.</p>

    <h2>7. Vzor reklamačného listu</h2>
    <pre style="background:var(--cream-2);padding:14px;border-radius:8px;font-size:.85rem;white-space:pre-wrap;">Pre: ${SITE.business.company}, ${SITE.business.address}
E-mail: ${SITE.email}

Reklamácia tovaru
Číslo objednávky: ……………………
Dátum prijatia tovaru: ……………………
Predmet reklamácie (popis vady): ……………………
Požadovaný spôsob vybavenia: oprava / výmena / vrátenie peňazí

Meno a priezvisko: ……………………
Adresa: ……………………
Telefón: ……………………
E-mail: ……………………

Dátum a podpis: ……………………</pre>

    <h2>8. Mimosúdne riešenie sporov</h2>
    <p>Spotrebiteľ má právo obrátiť sa na orgán alternatívneho riešenia sporov: Slovenská obchodná inšpekcia (<a href="https://www.soi.sk" target="_blank" rel="noopener">soi.sk</a>) alebo platforma RSO: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.</p>
  </div>
</section>
`);

// ODSTUPENIE OD ZMLUVY
page('odstupenie-od-zmluvy.html',
  'Odstúpenie od zmluvy',
  'Odstúpenie od zmluvy a vrátenie tovaru — postup, formulár, lehoty (14 dní).',
`<section class="section">
  <div class="container prose">
    <p class="eyebrow">Právne</p>
    <h1>Odstúpenie od zmluvy / vrátenie tovaru</h1>
    ${legalDisclaimer()}
    <p>Účinnosť: ${new Date().toLocaleDateString('sk-SK')}.</p>

    <h2>1. Právo na odstúpenie</h2>
    <p>Spotrebiteľ má právo odstúpiť od kúpnej zmluvy bez uvedenia dôvodu v lehote 14 dní odo dňa prevzatia tovaru, v súlade so zákonom o ochrane spotrebiteľa pri zmluvách uzavretých na diaľku.</p>

    <h2>2. Ako odstúpiť</h2>
    <ol>
      <li>Vyplňte priložený formulár alebo zašlite jasné vyhlásenie o odstúpení e-mailom na <a href="mailto:${SITE.email}">${SITE.email}</a>.</li>
      <li>Tovar zašlite späť bez zbytočného odkladu, najneskôr do 14 dní od odstúpenia, na korešpondenčnú adresu, ktorú Vám zašleme.</li>
      <li>Tovar zasielajte v pôvodnom obale, nepoškodený a kompletný. Odporúčame doporučene a poistené.</li>
      <li>Predávajúci vráti peniaze vrátane nákladov na dopravu (najlacnejší zvolený spôsob) najneskôr do 14 dní od doručenia tovaru, alebo od preukázania, že bol tovar odoslaný späť.</li>
    </ol>

    <h2>3. Tovar, na ktorý sa odstúpenie nevzťahuje</h2>
    <ul>
      <li>Tovar uzavretý v ochrannom obale, ktorý nie je vhodný na vrátenie z dôvodu ochrany zdravia alebo z hygienických dôvodov, ak bol obal porušený.</li>
      <li>Tovar zhotovený podľa osobitných požiadaviek spotrebiteľa.</li>
      <li>Tovar, ktorý podlieha rýchlej skaze alebo zníženiu kvality.</li>
    </ul>

    <h2>4. Vzor formulára na odstúpenie od zmluvy</h2>
    <pre style="background:var(--cream-2);padding:14px;border-radius:8px;font-size:.85rem;white-space:pre-wrap;">Komu: ${SITE.business.company}, ${SITE.business.address}
E-mail: ${SITE.email}

Týmto oznamujem, že odstupujem od kúpnej zmluvy na tento tovar:
Názov tovaru / kód: ……………………
Číslo objednávky: ……………………
Dátum objednania: ……………………
Dátum prevzatia: ……………………

Meno a priezvisko spotrebiteľa: ……………………
Adresa spotrebiteľa: ……………………
IBAN pre vrátenie peňazí: ……………………

Dátum a podpis (ak je formulár v listinnej podobe): ……………………</pre>

    <h2>5. Náklady na vrátenie</h2>
    <p>Priame náklady na vrátenie tovaru znáša spotrebiteľ. Predávajúci vráti spotrebiteľovi cenu tovaru a poštovné rovnakým spôsobom, akým bola platba prijatá (alebo iným, ktorý spotrebiteľ navrhne, bez dodatočných poplatkov).</p>
  </div>
</section>
`);

// PRIVACY
page('ochrana-osobnych-udajov.html',
  'Ochrana osobných údajov',
  'Zásady spracúvania osobných údajov Generaltrade Shop podľa GDPR a zákona č. 18/2018 Z. z.',
`<section class="section">
  <div class="container prose">
    <p class="eyebrow">Právne</p>
    <h1>Ochrana osobných údajov</h1>
    ${legalDisclaimer()}
    <p>Účinnosť: ${new Date().toLocaleDateString('sk-SK')}.</p>

    <h2>1. Prevádzkovateľ</h2>
    <p>${SITE.business.company}<br>
    ${SITE.business.address}<br>
    IČO: ${SITE.business.ico}<br>
    Kontakt: <a href="mailto:${SITE.email}">${SITE.email}</a></p>

    <h2>2. Účel a právny základ spracúvania</h2>
    <ul>
      <li><strong>Plnenie zmluvy</strong> (čl. 6 ods. 1 písm. b GDPR): meno, adresa, e-mail, telefón, údaje o objednávke.</li>
      <li><strong>Plnenie zákonných povinností</strong> (čl. 6 ods. 1 písm. c GDPR): účtovné a daňové predpisy.</li>
      <li><strong>Oprávnený záujem</strong> (čl. 6 ods. 1 písm. f GDPR): zabezpečenie webu, prevencia podvodov, vybavenie prípadných reklamácií.</li>
      <li><strong>Súhlas</strong> (čl. 6 ods. 1 písm. a GDPR): zasielanie marketingových e-mailov, použitie analytických/reklamných cookies.</li>
    </ul>

    <h2>3. Doba uchovávania</h2>
    <p>Osobné údaje pre účely plnenia zmluvy uchovávame po dobu 10 rokov (zákonná povinnosť pre účtovné doklady). Pre marketingové účely uchovávame údaje do odvolania súhlasu.</p>

    <h2>4. Príjemcovia údajov</h2>
    <ul>
      <li>Prepravné spoločnosti (GLS, Zásielkovňa) — len v rozsahu nutnom na doručenie.</li>
      <li>Poskytovateľ hostingu (Hostinger Operations, UAB).</li>
      <li>Poskytovateľ platobných služieb (Revolut Bank UAB) — pri platbe.</li>
      <li>Účtovníctvo / daňový poradca — pri vedení účtovníctva.</li>
      <li>Externý partner skladu/dodávateľ — len v rozsahu nutnom pre expedíciu.</li>
    </ul>

    <h2>5. Cookies a analytické nástroje</h2>
    <p>Web používa technické súbory cookies nevyhnutné pre fungovanie. Analytické a reklamné cookies (vrátane Google AdSense, Google Analytics) používame iba s Vaším súhlasom. Podrobné informácie nájdete v <a href="cookies.html">zásadách cookies</a>.</p>
    <p>Pre používateľov v EHP odporúčame implementovať <strong>Google Consent Mode v2</strong> a CMP (Consent Management Platform) pred aktivovaním reklamy.</p>

    <h2>6. Práva dotknutej osoby</h2>
    <ul>
      <li>právo na prístup k osobným údajom;</li>
      <li>právo na opravu nesprávnych údajov;</li>
      <li>právo na vymazanie („právo byť zabudnutý“);</li>
      <li>právo na obmedzenie spracúvania;</li>
      <li>právo namietať proti spracúvaniu;</li>
      <li>právo na prenosnosť údajov;</li>
      <li>právo odvolať súhlas;</li>
      <li>právo podať sťažnosť na <a href="https://dataprotection.gov.sk" target="_blank" rel="noopener">Úrad na ochranu osobných údajov SR</a>.</li>
    </ul>
    <p>Žiadosti vybavujeme do 30 dní (s možnosťou predĺženia o 60 dní pri zložitejších požiadavkách).</p>

    <h2>7. Prenosy mimo EHP</h2>
    <p>Pri použití niektorých nástrojov (napr. Google) môže dochádzať k prenosu údajov mimo EHP. Tieto prenosy sa riadia primeranými zárukami (štandardné zmluvné doložky EÚ — SCCs).</p>

    <h2>8. Reklama tretích strán (Google AdSense)</h2>
    <p>Tretie strany vrátane spoločnosti Google môžu použiť cookies na zobrazovanie reklám založených na predchádzajúcich návštevách tejto a iných stránok. Reklamné cookies Google umožňujú spoločnosti Google a jej partnerom zobrazovať Vám personalizované reklamy. Personalizované reklamy si môžete deaktivovať v nastaveniach Google Ads (<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">google.com/settings/ads</a>) alebo v Aboutads.info (<a href="https://www.aboutads.info" target="_blank" rel="noopener">aboutads.info</a>).</p>
    <p>Viac informácií: <a href="https://support.google.com/adsense/answer/1348695?hl=sk" target="_blank" rel="noopener">Politika ochrany osobných údajov AdSense</a> a <a href="https://support.google.com/adsense/answer/48182?hl=sk" target="_blank" rel="noopener">Pravidlá AdSense</a>.</p>
  </div>
</section>
`);

// COOKIES
page('cookies.html',
  'Cookies',
  'Zásady používania cookies v Generaltrade Shop. Technické, analytické a reklamné cookies. Možnosť odvolať súhlas.',
`<section class="section">
  <div class="container prose">
    <p class="eyebrow">Právne</p>
    <h1>Zásady používania cookies</h1>
    ${legalDisclaimer()}
    <p>Účinnosť: ${new Date().toLocaleDateString('sk-SK')}.</p>

    <h2>1. Čo sú cookies</h2>
    <p>Cookies sú malé textové súbory, ktoré web ukladá do Vášho prehliadača a pri ďalších návštevách ich z neho číta. Slúžia na zapamätanie nastavení, štatistiky používania a v niektorých prípadoch aj na cielenie reklamy.</p>

    <h2>2. Aké cookies používame</h2>
    <table>
      <thead><tr><th>Typ</th><th>Účel</th><th>Doba</th><th>Súhlas</th></tr></thead>
      <tbody>
        <tr><td>Technické</td><td>Funkčnosť webu, košík, pamätanie preferencií zobrazenia</td><td>session</td><td>Nevyžaduje sa</td></tr>
        <tr><td>Analytické</td><td>Anonymizované štatistiky návštevnosti (napr. Google Analytics 4)</td><td>do 14 mesiacov</td><td>Vyžaduje sa</td></tr>
        <tr><td>Reklamné</td><td>Personalizovaná reklama (Google AdSense, retargeting)</td><td>do 13 mesiacov</td><td>Vyžaduje sa</td></tr>
      </tbody>
    </table>
    <p class="text-small text-muted">Generaltrade Shop aktuálne nepoužíva analytické ani reklamné cookies, kým nebude nasadený plnohodnotný CMP a Google Consent Mode v2. V banneri Vás budeme vždy informovať pred aktivovaním ktorejkoľvek nadštandardnej kategórie.</p>

    <h2>3. Reklama tretích strán (Google AdSense)</h2>
    <p>Po aktivácii Google AdSense bude platiť: tretie strany (vrátane Google) používajú cookies na zobrazovanie reklám založených na predchádzajúcich návštevách tejto a iných stránok. Reklamné cookies Google umožňujú spoločnosti Google a jej partnerom zobrazovať personalizované reklamy.</p>
    <p>Používatelia môžu personalizované reklamy deaktivovať v <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">nastaveniach reklám Google</a>, prípadne na <a href="https://www.aboutads.info" target="_blank" rel="noopener">aboutads.info</a>.</p>
    <p>Ďalšie informácie: <a href="https://support.google.com/adsense/answer/1348695?hl=sk" target="_blank" rel="noopener">Politika ochrany súkromia AdSense</a> a <a href="https://support.google.com/adsense/answer/48182?hl=sk" target="_blank" rel="noopener">Pravidlá AdSense</a>.</p>

    <h2>4. Ako spravovať cookies</h2>
    <p>Cookies môžete spravovať alebo odstrániť priamo v prehliadači. Návody nájdete tu:</p>
    <ul>
      <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a></li>
      <li><a href="https://support.mozilla.org/sk/kb/cookies-informacie-ktore-uchovavaju-internetove" target="_blank" rel="noopener">Mozilla Firefox</a></li>
      <li><a href="https://support.apple.com/sk-sk/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Safari</a></li>
      <li><a href="https://support.microsoft.com/sk-sk/microsoft-edge" target="_blank" rel="noopener">Microsoft Edge</a></li>
    </ul>

    <h2>5. Odvolanie súhlasu</h2>
    <p>Súhlas s analytickými a reklamnými cookies môžete kedykoľvek odvolať vymazaním cookies v prehliadači, alebo cez CMP banner po jeho nasadení.</p>
  </div>
</section>
`);

// FAQ
page('faq.html',
  'Časté otázky (FAQ)',
  'Najčastejšie otázky o nakupovaní v Generaltrade Shop — doprava, platba, externý sklad, vrátenie tovaru.',
`<section class="section">
  <div class="container prose">
    <p class="eyebrow">FAQ</p>
    <h1>Časté otázky</h1>

    <h2>Ako rýchlo dostanem tovar?</h2>
    <p>Tovar expedujeme z externého skladu nášho partnera, zvyčajne do 2–5 pracovných dní od pripísania platby. Doručenie kuriérom GLS trvá ďalších 1–3 pracovné dni.</p>

    <h2>Prečo „externý sklad“?</h2>
    <p>Spolupracujeme so slovenským dodávateľom prírodnej kozmetiky. Tovar držíme u neho, čím vieme ponúkať široký výber bez zbytočných nákladov na vlastné skladovanie.</p>

    <h2>Aké spôsoby platby akceptujete?</h2>
    <p>Aktuálne Revolut (na IBAN) a štandardný bankový prevod. Platba kartou online je v príprave a aktivuje sa po nasadení platobnej brány.</p>

    <h2>Je možné platiť na dobierku?</h2>
    <p>V tejto chvíli platbu na dobierku neponúkame. Ak by ste mali záujem o iný spôsob, kontaktujte nás e-mailom — vieme nájsť individuálne riešenie.</p>

    <h2>Posielate aj mimo Slovenska?</h2>
    <p>Aktuálne primárne v rámci SR. Pre dodanie do ČR alebo iných krajín sa nám prosím ozvite e-mailom — dohodneme individuálne podmienky.</p>

    <h2>Môžem si tovar prevziať osobne?</h2>
    <p>Áno, po dohode v Trenčíne (Armádna 777/4). Kontaktujte nás vopred, aby sme tovar pripravili.</p>

    <h2>Kedy je doprava zdarma?</h2>
    <p>Pri objednávke nad 60 € s DPH neplatíte za dopravu kuriérom GLS ani Zásielkovňou.</p>

    <h2>Môžem tovar vrátiť?</h2>
    <p>Áno, máte zákonné právo odstúpiť od zmluvy do 14 dní od prevzatia tovaru. Postup nájdete v <a href="odstupenie-od-zmluvy.html">samostatnom dokumente</a>.</p>

    <h2>Ako prebieha reklamácia?</h2>
    <p>Reklamáciu zašlite e-mailom na <a href="mailto:${SITE.email}">${SITE.email}</a> spolu s číslom objednávky a popisom vady. Detailný postup je v <a href="reklamacny-poriadok.html">reklamačnom poriadku</a>.</p>

    <h2>Sú produkty originálne?</h2>
    <p>Áno, všetky produkty pochádzajú od nášho overeného slovenského dodávateľa, ktorý odoberá tovar priamo od výrobcov či oficiálnych distribútorov.</p>
  </div>
</section>
`);

// 404
page('404.html',
  'Stránka nenájdená',
  'Stránka, ktorú hľadáte, neexistuje.',
`<section class="section">
  <div class="container text-center" style="padding:80px 20px">
    <p class="eyebrow">404</p>
    <h1>Stránku sa nepodarilo nájsť</h1>
    <p class="lede" style="margin:0 auto 24px">Adresa, na ktorú ste prišli, neexistuje alebo bola presunutá.</p>
    <a href="index.html" class="btn btn-primary">Späť na úvod</a>
    <a href="katalog.html" class="btn btn-secondary" style="margin-left:8px">Prejsť do katalógu</a>
  </div>
</section>
`);

console.log('Done.');
