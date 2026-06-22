/* ===================================================================
   Generaltrade Shop — Frontend Application
   Vanilla JS, sandbox-safe. Cart held in-memory only.
   Products loaded from /data/products.json (built by scripts/import-feed.mjs).
   =================================================================== */

(function () {
  'use strict';

  // -------------------- Constants --------------------
  const FREE_SHIPPING_THRESHOLD = 60.00;
  const SHIPPING_GLS = 3.50;
  const SHIPPING_PACKETA = 4.50;
  const PERSONAL_PICKUP_NOTE = 'po dohode';

  const PAYMENT_METHODS = [
    {
      id: 'revolut',
      title: 'Revolut',
      desc: 'Platba na Revolut účet (IBAN). Po objednávke obdržíte platobné údaje.',
      ready: true,
    },
    {
      id: 'transfer',
      title: 'Bankový prevod',
      desc: 'Štandardný SEPA prevod na náš účet. Údaje vám zašleme v potvrdení objednávky.',
      ready: true,
    },
    {
      id: 'card',
      title: 'Platba kartou',
      desc: 'Platba kartou cez aktivovanú platobnú bránu alebo platobný link po odoslaní objednávky.',
      ready: true,
    },
  ];

  // -------------------- State --------------------
  const CART_STORAGE_KEY = 'gt_cart';
  function saveCartToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(App.cart));
    } catch (e) {
      // Storage unavailable (private mode / disabled) — keep cart in memory only.
    }
  }
  function loadCartFromStorage() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        App.cart = parsed
          .filter((l) => l && typeof l.id === 'string')
          .map((l) => ({ id: l.id, qty: Math.max(1, Math.min(99, parseInt(l.qty, 10) || 1)) }));
      }
    } catch (e) {
      // Ignore corrupted / unavailable storage.
    }
  }

  const App = window.App = {
    products: [],
    categories: [],
    meta: null,
    cart: [],
    loaded: false,
  };

  // -------------------- Utils --------------------
  function formatPrice(n) {
    return new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(n);
  }
  function el(tag, props = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in props) {
      if (k === 'class') e.className = props[k];
      else if (k === 'html') e.innerHTML = props[k];
      else if (k === 'text') e.textContent = props[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), props[k]);
      else if (props[k] != null) e.setAttribute(k, props[k]);
    }
    for (const c of [].concat(children)) {
      if (c == null) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }
  function getQuery() {
    return Object.fromEntries(new URL(location.href).searchParams.entries());
  }
  function setQuery(obj, replace = true) {
    const url = new URL(location.href);
    for (const k in obj) {
      if (obj[k] === '' || obj[k] == null) url.searchParams.delete(k);
      else url.searchParams.set(k, obj[k]);
    }
    if (replace) history.replaceState(null, '', url);
    else history.pushState(null, '', url);
  }

  // -------------------- Data load --------------------
  async function loadData() {
    if (App.loaded) return;
    try {
      const [pRes, cRes, mRes] = await Promise.all([
        fetch('data/products.json', { cache: 'no-cache' }),
        fetch('data/categories.json', { cache: 'no-cache' }),
        fetch('data/feed-meta.json', { cache: 'no-cache' }),
      ]);
      App.products = await pRes.json();
      App.categories = await cRes.json();
      App.meta = await mRes.json();
      App.loaded = true;
    } catch (err) {
      console.error('Failed to load product data', err);
      App.products = []; App.categories = []; App.meta = null;
    }
  }

  // -------------------- Cart --------------------
  function cartTotalQty() {
    return App.cart.reduce((s, l) => s + l.qty, 0);
  }
  function cartGetProduct(id) {
    return App.products.find((p) => p.id === id);
  }
  function cartAdd(id, qty = 1) {
    const p = cartGetProduct(id);
    if (!p) return;
    if (p.availability !== 'in_stock') return;
    const line = App.cart.find((l) => l.id === id);
    if (line) line.qty += qty; else App.cart.push({ id, qty });
    saveCartToStorage();
    refreshCartBadge();
    flashToast(`Pridané: ${p.title}`);
  }
  function cartUpdate(id, qty) {
    const line = App.cart.find((l) => l.id === id);
    if (!line) return;
    line.qty = Math.max(1, Math.min(99, qty));
    saveCartToStorage();
    refreshCartBadge();
  }
  function cartRemove(id) {
    App.cart = App.cart.filter((l) => l.id !== id);
    saveCartToStorage();
    refreshCartBadge();
  }
  function cartClear() { App.cart = []; saveCartToStorage(); refreshCartBadge(); }
  function cartSubtotal() {
    return App.cart.reduce((s, l) => {
      const p = cartGetProduct(l.id); if (!p) return s;
      return s + (p.price * l.qty);
    }, 0);
  }
  function shippingCost(method, subtotal) {
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
    if (method === 'gls') return SHIPPING_GLS;
    if (method === 'packeta') return SHIPPING_PACKETA;
    if (method === 'pickup') return 0;
    return SHIPPING_GLS;
  }
  function refreshCartBadge() {
    const n = cartTotalQty();
    document.querySelectorAll('[data-cart-count]').forEach((b) => {
      b.textContent = n;
      b.style.display = n > 0 ? 'inline-flex' : 'none';
    });
  }

  // -------------------- Toast --------------------
  let toastTimer = null;
  function flashToast(msg) {
    let t = document.getElementById('app-toast');
    if (!t) {
      t = el('div', { id: 'app-toast', style: 'position:fixed;bottom:24px;right:24px;background:#2A2118;color:#FAF6EE;padding:14px 18px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.18);font-size:.9rem;font-weight:500;z-index:200;opacity:0;transition:opacity .25s ease, transform .25s ease;transform:translateY(8px);max-width:300px' });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; }, 1800);
  }

  // -------------------- Components --------------------
  function productCard(p) {
    const inStock = p.availability === 'in_stock';
    const card = el('article', { class: 'product-card', 'data-id': p.id });
    const imgWrap = el('div', { class: 'img-wrap' });
    if (p.image) {
      const img = el('img', { loading: 'lazy', alt: p.title, src: p.image, referrerpolicy: 'no-referrer' });
      img.onerror = () => { imgWrap.innerHTML = `<div class="img-fallback">${(p.title[0]||'•').toUpperCase()}</div>`; };
      imgWrap.appendChild(img);
    } else {
      imgWrap.innerHTML = `<div class="img-fallback">${(p.title[0]||'•').toUpperCase()}</div>`;
    }
    const badges = el('div', { class: 'badges' });
    badges.appendChild(el('span', { class: inStock ? 'badge badge-stock' : 'badge badge-out', text: inStock ? 'Skladom' : 'Nedostupné' }));
    imgWrap.appendChild(badges);

    const body = el('div', { class: 'body' });
    body.appendChild(el('div', { class: 'cat-line', text: p.category.name }));
    body.appendChild(el('h3', { text: p.title }));
    const meta = el('div', { class: 'meta' });
    meta.appendChild(el('div', { class: 'price', text: formatPrice(p.price) }));
    if (inStock) {
      const addBtn = el('button', {
        class: 'btn btn-primary add btn-sm',
        type: 'button',
        text: 'Do košíka',
        onclick: (e) => { e.preventDefault(); e.stopPropagation(); cartAdd(p.id); }
      });
      meta.appendChild(addBtn);
    } else {
      meta.appendChild(el('span', { class: 'text-tiny text-muted', text: 'Externý sklad' }));
    }
    body.appendChild(meta);
    if (p.affiliate_url) {
      const affBtn = el('a', {
        class: 'btn btn-secondary btn-sm btn-block aff-btn',
        href: p.affiliate_url,
        target: '_blank',
        rel: 'nofollow sponsored noopener',
        text: 'Kúpiť na Panakeia',
        style: 'margin-top:8px',
        onclick: (e) => { e.stopPropagation(); }
      });
      body.appendChild(affBtn);
    }
    card.appendChild(imgWrap);
    card.appendChild(body);

    const link = el('a', { href: `produkt.html?id=${encodeURIComponent(p.id)}`, class: 'cover-link', 'aria-label': p.title });
    card.appendChild(link);
    return card;
  }

  // -------------------- Pages --------------------
  async function renderHomeFeatured() {
    await loadData();
    const featured = document.getElementById('featured-products');
    if (!featured) return;
    const inStock = App.products.filter((p) => p.availability === 'in_stock');
    // Pick a varied selection (first available from top categories)
    const seen = new Set();
    const pick = [];
    for (const p of inStock) {
      if (!seen.has(p.category.id)) { seen.add(p.category.id); pick.push(p); }
      if (pick.length >= 8) break;
    }
    if (pick.length < 8) {
      for (const p of inStock) { if (!pick.includes(p)) pick.push(p); if (pick.length >= 8) break; }
    }
    featured.innerHTML = '';
    pick.forEach((p) => featured.appendChild(productCard(p)));

    // Categories preview
    const catBox = document.getElementById('home-categories');
    if (catBox) {
      catBox.innerHTML = '';
      App.categories.slice(0, 8).forEach((c) => {
        const a = el('a', { href: `katalog.html?category=${encodeURIComponent(c.id)}`, class: 'feature' }, [
          el('div', { class: 'ic', html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12c4 0 9-4 9-9"/></svg>' }),
          el('h3', { text: c.name }),
          el('p', { class: 'text-muted text-small', text: `${c.count} produktov · ${c.in_stock} skladom` }),
        ]);
        catBox.appendChild(a);
      });
    }

    // Stats
    if (App.meta) {
      const st = document.getElementById('home-stats');
      if (st) {
        st.innerHTML = `
          <div><strong>${App.meta.item_count}</strong><br><span class="text-muted text-small">produktov v katalógu</span></div>
          <div><strong>${App.meta.in_stock}</strong><br><span class="text-muted text-small">aktuálne skladom</span></div>
          <div><strong>${App.categories.length}</strong><br><span class="text-muted text-small">kategórií</span></div>
        `;
      }
    }
  }

  async function renderCatalog() {
    const root = document.getElementById('catalog-root');
    if (!root) return;
    await loadData();
    const q = getQuery();
    const search = (q.q || '').toLowerCase();
    const category = q.category || '';
    const onlyStock = q.stock !== 'all';
    const sort = q.sort || 'relevance';
    const page = Math.max(1, parseInt(q.page || '1', 10));
    const PER = 24;

    let list = App.products.slice();
    if (category) list = list.filter((p) => p.category.id === category);
    if (search) list = list.filter((p) => p.title.toLowerCase().includes(search) || (p.description||'').toLowerCase().includes(search));
    if (onlyStock) list = list.filter((p) => p.availability === 'in_stock');
    if (sort === 'price-asc') list.sort((a,b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a,b) => b.price - a.price);
    else if (sort === 'name') list.sort((a,b) => a.title.localeCompare(b.title, 'sk'));
    else { /* relevance: keep feed order, in_stock first */
      list.sort((a,b) => (a.availability === 'in_stock' ? -1 : 1) - (b.availability === 'in_stock' ? -1 : 1));
    }
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / PER));
    const safePage = Math.min(page, pages);
    const slice = list.slice((safePage - 1) * PER, safePage * PER);

    // Sidebar
    const side = document.getElementById('catalog-side');
    if (side) {
      const ul = el('ul', { class: 'cat-list' });
      ul.appendChild(el('li', {}, [el('a', { href: 'katalog.html', class: !category ? 'active' : '' }, [
        document.createTextNode('Všetky kategórie'),
        el('span', { class: 'num', text: String(App.products.length) })
      ])]));
      App.categories.forEach((c) => {
        ul.appendChild(el('li', {}, [el('a', {
          href: `katalog.html?category=${encodeURIComponent(c.id)}`,
          class: category === c.id ? 'active' : ''
        }, [
          document.createTextNode(c.name),
          el('span', { class: 'num', text: String(c.count) })
        ])]));
      });
      side.innerHTML = '';
      side.appendChild(el('h4', { text: 'Kategórie' }));
      side.appendChild(ul);
    }

    // Toolbar
    const tb = document.getElementById('catalog-toolbar');
    if (tb) {
      tb.innerHTML = '';
      const filters = el('div', { class: 'filters' });
      const searchInput = el('input', { type: 'search', placeholder: 'Hľadať produkt…', value: search });
      searchInput.addEventListener('input', debounce((e) => { setQuery({ q: e.target.value, page: 1 }); renderCatalog(); }, 300));
      filters.appendChild(searchInput);

      const sortSel = el('select', {}, [
        el('option', { value: 'relevance', text: 'Predvolené' }),
        el('option', { value: 'price-asc', text: 'Cena: od najnižšej' }),
        el('option', { value: 'price-desc', text: 'Cena: od najvyššej' }),
        el('option', { value: 'name', text: 'Názov A–Z' }),
      ]);
      sortSel.value = sort;
      sortSel.addEventListener('change', (e) => { setQuery({ sort: e.target.value, page: 1 }); renderCatalog(); });
      filters.appendChild(sortSel);

      const stockLbl = el('label', { class: 'flex gap-8', style: 'font-size:.9rem;color:var(--ink-soft);align-items:center' });
      const stockChk = el('input', { type: 'checkbox', style: 'width:auto' });
      stockChk.checked = onlyStock;
      stockChk.addEventListener('change', () => { setQuery({ stock: stockChk.checked ? '' : 'all', page: 1 }); renderCatalog(); });
      stockLbl.appendChild(stockChk);
      stockLbl.appendChild(document.createTextNode('Iba skladom'));
      filters.appendChild(stockLbl);

      tb.appendChild(filters);
      tb.appendChild(el('div', { class: 'count', text: `${total} produktov` }));
    }

    // Grid
    root.innerHTML = '';
    if (slice.length === 0) {
      root.appendChild(el('div', { class: 'empty', html: '<h3>Žiadne produkty</h3><p class="text-muted">Skúste odstrániť filter alebo iné kľúčové slovo.</p>' }));
      return;
    }
    const grid = el('div', { class: 'product-grid' });
    slice.forEach((p) => grid.appendChild(productCard(p)));
    root.appendChild(grid);

    // Pagination
    if (pages > 1) {
      const pag = el('div', { class: 'pagination' });
      for (let i = 1; i <= pages; i++) {
        if (pages > 8 && i > 2 && i < pages - 1 && Math.abs(i - safePage) > 1) {
          if (i === 3) pag.appendChild(el('span', { class: 'text-muted', style: 'padding:8px', text: '…' }));
          continue;
        }
        const url = new URL(location.href);
        url.searchParams.set('page', String(i));
        pag.appendChild(el('a', { href: url.toString(), class: i === safePage ? 'active' : '', text: String(i) }));
      }
      root.appendChild(pag);
    }
  }

  function debounce(fn, ms) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  async function renderProductDetail() {
    const root = document.getElementById('product-root');
    if (!root) return;
    await loadData();
    const id = getQuery().id;
    const p = id ? cartGetProduct(id) : null;
    if (!p) {
      root.innerHTML = '<div class="empty"><h3>Produkt nebol nájdený</h3><p><a class="btn btn-primary" href="katalog.html">Späť do katalógu</a></p></div>';
      return;
    }

    // Update document title
    document.title = `${p.title} · Generaltrade Shop`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = (p.short_description || p.title).slice(0, 160);

    const inStock = p.availability === 'in_stock';
    const gallery = el('div', { class: 'product-gallery' });
    if (p.image) {
      const img = el('img', { src: p.image, alt: p.title, referrerpolicy: 'no-referrer' });
      img.onerror = () => { gallery.innerHTML = `<div class="img-fallback" style="padding:48px;font-size:3rem;color:var(--muted-2)">${(p.title[0]||'•').toUpperCase()}</div>`; };
      gallery.appendChild(img);
    }

    const info = el('div', { class: 'product-info' });
    info.appendChild(el('div', { class: 'cat-line text-small text-muted', text: p.category.path.join(' › ') }));
    info.appendChild(el('h1', { text: p.title }));
    if (p.brand) info.appendChild(el('div', { class: 'text-muted', text: 'Značka: ' + p.brand }));

    const priceLine = el('div', { class: 'price-line' });
    priceLine.appendChild(el('span', { class: 'price', text: formatPrice(p.price) }));
    priceLine.appendChild(el('span', { class: 'vat', text: 'Cena s DPH' }));
    info.appendChild(priceLine);

    const stockRow = el('div', { class: 'stock-row' });
    stockRow.appendChild(el('span', { class: inStock ? 'badge badge-stock' : 'badge badge-out', text: inStock ? 'Skladom' : 'Aktuálne nedostupné' }));
    stockRow.appendChild(el('span', { class: 'badge badge-info', text: 'Externý sklad · expedícia 2–5 dní' }));
    info.appendChild(stockRow);

    if (inStock) {
      const ctaRow = el('div', { class: 'flex gap-16', style: 'align-items:center;flex-wrap:wrap;margin-bottom:24px' });
      const qty = el('div', { class: 'qty-control' });
      const minus = el('button', { type: 'button', text: '−' });
      const input = el('input', { type: 'number', min: '1', max: '99', value: '1' });
      const plus = el('button', { type: 'button', text: '+' });
      minus.onclick = () => { input.value = Math.max(1, parseInt(input.value || '1', 10) - 1); };
      plus.onclick = () => { input.value = Math.min(99, parseInt(input.value || '1', 10) + 1); };
      qty.appendChild(minus); qty.appendChild(input); qty.appendChild(plus);
      ctaRow.appendChild(qty);
      const addBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', text: 'Pridať do košíka' });
      addBtn.onclick = () => cartAdd(p.id, parseInt(input.value || '1', 10));
      ctaRow.appendChild(addBtn);
      if (p.affiliate_url) {
        const affBtn = el('a', {
          class: 'btn btn-secondary btn-lg aff-btn',
          href: p.affiliate_url,
          target: '_blank',
          rel: 'nofollow sponsored noopener',
          text: 'Kúpiť na Panakeia'
        });
        ctaRow.appendChild(affBtn);
      }
      info.appendChild(ctaRow);
    } else {
      info.appendChild(el('div', { class: 'notice warn', html: '<strong>Aktuálne nedostupné.</strong> Pre informácie o opätovnom naskladnení nás kontaktujte.' }));
    }

    info.appendChild(el('div', { class: 'notice', html: '<strong>Externý sklad.</strong> Tovar expedujeme z partnerského skladu, doručenie zvyčajne 2–5 pracovných dní po prijatí platby.' }));

    if (p.description) {
      const desc = el('div', { class: 'desc' });
      desc.appendChild(el('h3', { text: 'Popis produktu' }));
      desc.appendChild(el('p', { html: (p.description || '').replace(/\n/g, '<br>') }));
      info.appendChild(desc);
    }

    if (p.gtin || p.brand) {
      const tbl = el('table', { class: 'cart-table', style: 'margin-top:24px' });
      const tbody = el('tbody');
      if (p.brand) tbody.appendChild(el('tr', {}, [el('td', { text: 'Značka' }), el('td', { text: p.brand })]));
      if (p.gtin)  tbody.appendChild(el('tr', {}, [el('td', { text: 'GTIN/EAN' }), el('td', { text: p.gtin })]));
      tbody.appendChild(el('tr', {}, [el('td', { text: 'Kód produktu' }), el('td', { text: p.id })]));
      tbody.appendChild(el('tr', {}, [el('td', { text: 'Stav' }), el('td', { text: 'Nový' })]));
      tbl.appendChild(tbody);
      info.appendChild(tbl);
    }

    root.innerHTML = '';
    root.appendChild(gallery);
    root.appendChild(info);
  }

  async function renderCart() {
    const root = document.getElementById('cart-root');
    if (!root) return;
    await loadData();

    function paint() {
      root.innerHTML = '';
      if (App.cart.length === 0) {
        root.appendChild(el('div', { class: 'empty', html: '<h3>Košík je prázdny</h3><p class="text-muted">Pridajte produkty z katalógu, aby ste mohli pokračovať.</p><p style="margin-top:18px"><a class="btn btn-primary" href="katalog.html">Pokračovať v nákupe</a></p>' }));
        return;
      }
      const tbl = el('table', { class: 'cart-table' });
      const thead = el('thead', {}, [el('tr', {}, [
        el('th', { text: 'Produkt' }),
        el('th', { text: 'Cena' }),
        el('th', { text: 'Množstvo' }),
        el('th', { text: 'Spolu' }),
        el('th', { text: '' }),
      ])]);
      const tbody = el('tbody');
      App.cart.forEach((line) => {
        const p = cartGetProduct(line.id); if (!p) return;
        const row = el('tr');
        const tdProd = el('td');
        tdProd.appendChild(el('div', { class: 'flex gap-16', style: 'align-items:center;flex-wrap:wrap' }, [
          p.image ? el('img', { class: 'ci-img', src: p.image, alt: p.title, referrerpolicy: 'no-referrer' }) : el('div', { class: 'ci-img' }),
          el('div', { class: 'ci-title' }, [
            el('a', { href: `produkt.html?id=${encodeURIComponent(p.id)}`, text: p.title, style: 'color:var(--ink);font-weight:500' }),
            el('div', { class: 'text-tiny text-muted', text: p.category.name })
          ])
        ]));
        row.appendChild(tdProd);
        row.appendChild(el('td', { text: formatPrice(p.price) }));

        const qtyTd = el('td');
        const qtyCtl = el('div', { class: 'qty-control' });
        const minus = el('button', { type: 'button', text: '−' });
        const input = el('input', { type: 'number', min: '1', max: '99', value: String(line.qty) });
        const plus = el('button', { type: 'button', text: '+' });
        minus.onclick = () => { cartUpdate(p.id, line.qty - 1); paint(); };
        plus.onclick = () => { cartUpdate(p.id, line.qty + 1); paint(); };
        input.addEventListener('change', () => { cartUpdate(p.id, parseInt(input.value || '1', 10)); paint(); });
        qtyCtl.appendChild(minus); qtyCtl.appendChild(input); qtyCtl.appendChild(plus);
        qtyTd.appendChild(qtyCtl);
        row.appendChild(qtyTd);

        row.appendChild(el('td', { text: formatPrice(p.price * line.qty), style: 'font-weight:600' }));
        const rmTd = el('td');
        rmTd.appendChild(el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Odstrániť', onclick: () => { cartRemove(p.id); paint(); } }));
        row.appendChild(rmTd);
        tbody.appendChild(row);
      });
      tbl.appendChild(thead); tbl.appendChild(tbody);
      root.appendChild(tbl);

      const subtotal = cartSubtotal();
      const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

      const summary = el('div', { class: 'flex-between', style: 'margin-top:24px;align-items:flex-start' });
      const left = el('div', {});
      left.appendChild(el('div', { class: 'notice', html: '<strong>Externý sklad:</strong> Tovar expedujeme od dodávateľa po prijatí platby. Bežná lehota doručenia 2–5 pracovných dní.' }));
      if (remaining > 0) {
        left.appendChild(el('div', { class: 'notice warn', style: 'margin-top:12px', html: `<strong>Doprava zdarma</strong> nad 60 € — pridajte ešte ${formatPrice(remaining)} a poštovné neplatíte.` }));
      } else {
        left.appendChild(el('div', { class: 'notice', style: 'margin-top:12px', html: '<strong>Doprava zdarma!</strong> Vaša objednávka je nad 60 €.' }));
      }
      summary.appendChild(left);

      const totals = el('div', { class: 'summary', style: 'min-width:280px;position:static' });
      totals.appendChild(el('div', { class: 'row' }, [el('span', { text: 'Medzisúčet' }), el('span', { text: formatPrice(subtotal) })]));
      totals.appendChild(el('div', { class: 'row' }, [el('span', { text: 'Doprava' }), el('span', { text: subtotal >= FREE_SHIPPING_THRESHOLD ? formatPrice(0) : 'od ' + formatPrice(SHIPPING_GLS) })]));
      totals.appendChild(el('div', { class: 'row total' }, [el('span', { text: 'Spolu (s DPH)' }), el('span', { text: formatPrice(subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_GLS)) })]));
      totals.appendChild(el('a', { href: 'pokladna.html', class: 'btn btn-primary btn-block btn-lg', style: 'margin-top:16px', text: 'Pokračovať k pokladni' }));
      totals.appendChild(el('a', { href: 'katalog.html', class: 'btn btn-ghost btn-block', style: 'margin-top:8px', text: 'Pokračovať v nákupe' }));
      summary.appendChild(totals);

      root.appendChild(summary);
    }
    paint();
  }

  async function renderCheckout() {
    const root = document.getElementById('checkout-root');
    if (!root) return;
    await loadData();

    function paint() {
      root.innerHTML = '';
      if (App.cart.length === 0) {
        root.appendChild(el('div', { class: 'empty', html: '<h3>Košík je prázdny</h3><p><a class="btn btn-primary" href="katalog.html">Naspäť do katalógu</a></p>' }));
        return;
      }
      const grid = el('div', { class: 'checkout-grid' });

      // Form column
      const form = el('form', { id: 'checkout-form', autocomplete: 'on' });
      form.appendChild(el('h2', { text: 'Kontaktné a doručovacie údaje' }));
      form.appendChild(formField('Meno a priezvisko *', 'text', 'name', '', { required: true }));
      form.appendChild(el('div', { class: 'form-row cols-2' }, [
        formField('E-mail *', 'email', 'email', '', { required: true }),
        formField('Telefón *', 'tel', 'phone', '', { required: true }),
      ]));
      form.appendChild(formField('Ulica a číslo *', 'text', 'street', '', { required: true }));
      form.appendChild(el('div', { class: 'form-row cols-2' }, [
        formField('Mesto *', 'text', 'city', '', { required: true }),
        formField('PSČ *', 'text', 'zip', '', { required: true }),
      ]));
      form.appendChild(formField('Krajina', 'text', 'country', 'Slovensko'));
      form.appendChild(formField('Poznámka k objednávke', 'textarea', 'note', ''));

      form.appendChild(el('h2', { style: 'margin-top:32px', text: 'Doprava' }));
      const shipGroup = el('div', { class: 'radio-group' });
      [
        { id: 'gls', label: 'Kuriér GLS', desc: 'Doručenie 1–3 pracovné dni po expedícii.', price: SHIPPING_GLS },
        { id: 'packeta', label: 'Zásielkovňa — výdajné miesto', desc: 'Vyzdvihnutie na zvolenom výdajnom mieste.', price: SHIPPING_PACKETA },
        { id: 'pickup', label: 'Osobné prevzatie (Trenčín)', desc: 'Po dohode na adrese Armádna 777/4, 911 01 Trenčín.', price: 0, note: PERSONAL_PICKUP_NOTE },
      ].forEach((s, i) => {
        const lbl = el('label', { class: 'radio-card' + (i === 0 ? ' selected' : '') });
        const inp = el('input', { type: 'radio', name: 'shipping', value: s.id, ...(i === 0 ? { checked: 'checked' } : {}) });
        const info = el('div', { class: 'info' }, [
          el('div', { class: 'ttl', text: s.label }),
          el('div', { class: 'text-small text-muted', text: s.desc }),
        ]);
        const priceTag = el('div', { class: 'price-tag', text: s.price === 0 ? (s.note || 'Zadarmo') : formatPrice(s.price) });
        lbl.appendChild(inp); lbl.appendChild(info); lbl.appendChild(priceTag);
        shipGroup.appendChild(lbl);
      });
      form.appendChild(shipGroup);

      form.appendChild(el('h2', { style: 'margin-top:32px', text: 'Spôsob platby' }));
      const payGroup = el('div', { class: 'radio-group' });
      PAYMENT_METHODS.forEach((m, i) => {
        const lbl = el('label', { class: 'radio-card' + (i === 0 ? ' selected' : '') + (!m.ready ? ' disabled' : '') });
        const inp = el('input', { type: 'radio', name: 'payment', value: m.id, ...(i === 0 ? { checked: 'checked' } : {}), ...(!m.ready ? { disabled: 'disabled' } : {}) });
        const info = el('div', { class: 'info' }, [
          el('div', { class: 'ttl', text: m.title + (!m.ready ? ' — pripravujeme' : '') }),
          el('div', { class: 'text-small text-muted', text: m.desc }),
        ]);
        lbl.appendChild(inp); lbl.appendChild(info);
        payGroup.appendChild(lbl);
      });
      form.appendChild(payGroup);

      form.appendChild(el('h2', { style: 'margin-top:32px', text: 'Súhlasy' }));
      const consents = el('div', { class: 'form-row' });
      consents.appendChild(checkboxField('terms', 'Súhlasím s <a href="obchodne-podmienky.html" target="_blank">obchodnými podmienkami</a> a beriem na vedomie <a href="ochrana-osobnych-udajov.html" target="_blank">spracovanie osobných údajov</a>.', true));
      consents.appendChild(checkboxField('marketing', 'Mám záujem dostávať občasné novinky e-mailom (dobrovoľné).', false));
      form.appendChild(consents);

      const submitBox = el('div', { style: 'margin-top:24px' });
      const submitBtn = el('button', { class: 'btn btn-primary btn-lg btn-block', type: 'submit', text: 'Odoslať objednávku' });
      submitBox.appendChild(submitBtn);
      submitBox.appendChild(el('p', { class: 'text-tiny text-muted', style: 'margin-top:8px;text-align:center', text: 'Odoslaním získate prehľad o objednávke a inštrukcie na úhradu.' }));
      form.appendChild(submitBox);

      // Summary
      const summary = el('aside', { class: 'summary' });
      summary.appendChild(el('h3', { text: 'Sumár objednávky' }));
      App.cart.forEach((line) => {
        const p = cartGetProduct(line.id); if (!p) return;
        summary.appendChild(el('div', { class: 'row' }, [
          el('span', { text: `${p.title} × ${line.qty}`, style: 'font-size:.88rem;flex:1;padding-right:12px' }),
          el('span', { text: formatPrice(p.price * line.qty), style: 'font-weight:600' })
        ]));
      });
      const subtotal = cartSubtotal();
      summary.appendChild(el('hr'));
      summary.appendChild(el('div', { class: 'row', id: 'sum-sub' }, [el('span', { text: 'Medzisúčet' }), el('span', { text: formatPrice(subtotal) })]));
      const shipRow = el('div', { class: 'row', id: 'sum-ship' }, [el('span', { text: 'Doprava' }), el('span', { text: formatPrice(shippingCost('gls', subtotal)) })]);
      summary.appendChild(shipRow);
      const totalRow = el('div', { class: 'row total' }, [el('span', { text: 'Spolu' }), el('span', { id: 'sum-total', text: formatPrice(subtotal + shippingCost('gls', subtotal)) })]);
      summary.appendChild(totalRow);
      summary.appendChild(el('div', { class: 'notice', style: 'margin-top:18px', html: '<strong>Externý sklad.</strong> Doručenie 2–5 prac. dní od pripísania platby.' }));

      grid.appendChild(form);
      grid.appendChild(summary);
      root.appendChild(grid);

      // Behaviour: ship method changes total
      form.querySelectorAll('input[name="shipping"]').forEach((i) => {
        i.addEventListener('change', () => {
          form.querySelectorAll('label.radio-card').forEach((l) => {
            const r = l.querySelector('input[name="shipping"]');
            if (r) l.classList.toggle('selected', r.checked);
          });
          const ship = shippingCost(i.value, subtotal);
          shipRow.querySelector('span:last-child').textContent = ship === 0 ? (i.value === 'pickup' ? PERSONAL_PICKUP_NOTE : formatPrice(0)) : formatPrice(ship);
          summary.querySelector('#sum-total').textContent = formatPrice(subtotal + ship);
        });
      });
      form.querySelectorAll('input[name="payment"]').forEach((i) => {
        i.addEventListener('change', () => {
          form.querySelectorAll('label.radio-card').forEach((l) => {
            const r = l.querySelector('input[name="payment"]');
            if (r) l.classList.toggle('selected', r.checked);
          });
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        if (!data.terms) { flashToast('Potvrďte prosím obchodné podmienky.'); return; }
        renderOrderConfirmation(data);
      });
    }

    function renderOrderConfirmation(data) {
      const subtotal = cartSubtotal();
      const ship = shippingCost(data.shipping, subtotal);
      const orderId = 'GT-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(Math.random()*9000+1000);

      root.innerHTML = '';
      const card = el('div', { class: 'summary', style: 'max-width:760px;margin:0 auto;position:static' });
      card.appendChild(el('h2', { text: 'Ďakujeme za objednávku!' }));
      card.appendChild(el('p', { html: `Vašu objednávku <strong>${orderId}</strong> sme zaregistrovali. Prosím, dokončite úhradu podľa nižšie uvedených inštrukcií. Po pripísaní platby tovar expedujeme z externého skladu (zvyčajne 2–5 pracovných dní).` }));
      card.appendChild(el('div', { class: 'notice warn', html: '<strong>Pozor:</strong> objednávka zatiaľ nie je odoslaná na e-mail (e-mail nie je nakonfigurovaný). Uložte si prosím tieto údaje alebo nás kontaktujte.' }));

      const tbl = el('table', { class: 'cart-table', style: 'margin:18px 0' });
      const tbody = el('tbody');
      App.cart.forEach((line) => {
        const p = cartGetProduct(line.id); if (!p) return;
        tbody.appendChild(el('tr', {}, [
          el('td', { text: `${p.title} × ${line.qty}`, style: 'max-width:none' }),
          el('td', { text: formatPrice(p.price * line.qty), style: 'text-align:right;font-weight:600' })
        ]));
      });
      tbody.appendChild(el('tr', {}, [el('td', { text: 'Doprava' }), el('td', { text: ship === 0 ? (data.shipping === 'pickup' ? PERSONAL_PICKUP_NOTE : formatPrice(0)) : formatPrice(ship), style: 'text-align:right' })]));
      tbody.appendChild(el('tr', {}, [el('td', { html: '<strong>Spolu k úhrade</strong>' }), el('td', { html: `<strong>${formatPrice(subtotal + ship)}</strong>`, style: 'text-align:right' })]));
      tbl.appendChild(tbody);
      card.appendChild(tbl);

      // Payment instructions
      const pay = data.payment || 'revolut';
      const payBox = el('div', { class: 'desc', style: 'background:var(--cream-2);padding:18px;border-radius:8px' });
      if (pay === 'revolut') {
        payBox.innerHTML = `
          <h3 style="text-transform:uppercase;letter-spacing:.12em;font-size:.85rem;color:var(--muted);margin-bottom:10px">Platobné údaje — Revolut</h3>
          <p>Sumu <strong>${formatPrice(subtotal + ship)}</strong> uhraďte na účet:</p>
          <table class="cart-table"><tbody>
            <tr><td>Príjemca</td><td><strong>Branislav Németh</strong></td></tr>
            <tr><td>IBAN</td><td><code>LT54 3250 0672 8822 9312</code></td></tr>
            <tr><td>BIC / SWIFT</td><td><code>REVOLT21</code></td></tr>
            <tr><td>Banka</td><td>Revolut Bank UAB, Konstitucijos ave. 21B, 08130 Vilnius, Lithuania</td></tr>
            <tr><td>Variabilný symbol / poznámka</td><td><strong>${orderId}</strong></td></tr>
            <tr><td>Suma</td><td><strong>${formatPrice(subtotal + ship)}</strong></td></tr>
          </tbody></table>
          <p class="text-small text-muted" style="margin-top:12px">Korešpondenčná banka (BIC): CHASDEFX. Po pripísaní platby Vám zašleme potvrdenie a expedujeme tovar.</p>`;
      } else if (pay === 'transfer') {
        payBox.innerHTML = `
          <h3 style="text-transform:uppercase;letter-spacing:.12em;font-size:.85rem;color:var(--muted);margin-bottom:10px">Bankový prevod</h3>
          <p>Platobné údaje na bankový prevod Vám zašleme do 24 hodín na e-mail. Suma na úhradu: <strong>${formatPrice(subtotal + ship)}</strong>, variabilný symbol: <strong>${orderId}</strong>.</p>
          <p class="text-small text-muted">Pre rýchlejšie spracovanie môžete použiť aj možnosť Revolut.</p>`;
      } else {
        payBox.innerHTML = `<h3>Platba kartou</h3><p>Objednávka bola zaevidovaná so spôsobom platby kartou. Úhradu dokončíte cez aktivovanú platobnú bránu alebo platobný link po potvrdení objednávky. Ak sa platobný link nezobrazí automaticky, kontaktujte nás a uveďte číslo objednávky <strong>${orderId}</strong>.</p>`;
      }
      card.appendChild(payBox);

      const actions = el('div', { class: 'flex gap-16', style: 'margin-top:24px;flex-wrap:wrap' });
      actions.appendChild(el('button', { class: 'btn btn-secondary', type: 'button', text: 'Vytlačiť stránku', onclick: () => window.print() }));
      actions.appendChild(el('a', { href: 'index.html', class: 'btn btn-primary', text: 'Späť na úvod', onclick: () => cartClear() }));
      card.appendChild(actions);

      root.appendChild(card);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    paint();
  }

  function formField(label, type, name, value, opts = {}) {
    const wrap = el('div', { class: 'field' });
    wrap.appendChild(el('label', { text: label, for: 'f-' + name }));
    let input;
    if (type === 'textarea') {
      input = el('textarea', { id: 'f-' + name, name, rows: '3' });
      input.value = value || '';
    } else {
      input = el('input', { id: 'f-' + name, name, type, value: value || '' });
    }
    if (opts.required) input.required = true;
    wrap.appendChild(input);
    return wrap;
  }
  function checkboxField(name, html, required) {
    const wrap = el('label', { class: 'flex gap-8', style: 'align-items:flex-start;font-size:.88rem;line-height:1.5;color:var(--ink-soft)' });
    const inp = el('input', { type: 'checkbox', name, value: '1', style: 'width:auto;margin-top:4px' });
    if (required) inp.required = true;
    wrap.appendChild(inp);
    wrap.appendChild(el('span', { html }));
    return wrap;
  }

  // -------------------- CMP cookie banner + Google Consent Mode v2 --------------------
  function getCookie(name) {
    return document.cookie.split('; ').find((row) => row.startsWith(name + '='))?.split('=')[1] || '';
  }
  function setCookie(name, value, days) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
  }
  function updateConsent(mode) {
    const granted = mode === 'all';
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: granted ? 'granted' : 'denied',
        ad_user_data: granted ? 'granted' : 'denied',
        ad_personalization: granted ? 'granted' : 'denied',
        analytics_storage: granted ? 'granted' : 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
      });
    }
  }
  function initCookieBanner() {
    const saved = getCookie('gt_cmp');
    if (saved) {
      updateConsent(saved === 'all' ? 'all' : 'essential');
      return;
    }
    const b = el('div', { class: 'cookie-banner show', id: 'cookie-banner' });
    b.appendChild(el('p', { html: 'Používame technické cookies pre fungovanie e-shopu. Analytické a reklamné cookies pre Google služby/AdSense zapneme iba po Vašom súhlase cez Consent Mode v2. Viac v <a href="cookies.html">zásadách cookies</a>.' }));
    const acts = el('div', { class: 'actions' });
    acts.appendChild(el('button', { class: 'btn btn-secondary btn-sm', type: 'button', text: 'Iba nevyhnutné', onclick: () => { setCookie('gt_cmp', 'essential', 180); updateConsent('essential'); b.remove(); } }));
    acts.appendChild(el('button', { class: 'btn btn-primary btn-sm', type: 'button', text: 'Súhlasím so všetkým', onclick: () => { setCookie('gt_cmp', 'all', 180); updateConsent('all'); b.remove(); } }));
    b.appendChild(acts);
    document.body.appendChild(b);
  }

  // -------------------- Header behaviour --------------------
  function initHeader() {
    const tog = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    if (tog && nav) tog.addEventListener('click', () => nav.classList.toggle('open'));
    loadCartFromStorage();
    refreshCartBadge();
  }

  // -------------------- Boot --------------------
  document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initCookieBanner();

    if (document.getElementById('featured-products')) renderHomeFeatured();
    if (document.getElementById('catalog-root'))     renderCatalog();
    if (document.getElementById('product-root'))     renderProductDetail();
    if (document.getElementById('cart-root'))        renderCart();
    if (document.getElementById('checkout-root'))    renderCheckout();
  });

  // Expose minimal API for tests
  window.GT = { App, cartAdd, cartClear, formatPrice };
})();
