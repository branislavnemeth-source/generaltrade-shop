# Generaltrade Licencie – návod na nasadenie

Balík obsahuje statický web pripravený na nasadenie na **Hostinger** doménu **generaltrade.shop**.

## Štruktúra

```
generaltrade-shop/
├── index.html                       # domov
├── obchodne-podmienky.html          # OP
├── ochrana-osobnych-udajov.html     # GDPR
├── cookies.html                     # cookies + tabuľka
├── kontakt.html                     # kontakt
├── 404.html                         # vlastná chybová stránka
├── robots.txt
├── sitemap.xml
├── .htaccess                        # HTTPS redirect, gzip, cache, security headers
└── assets/
    ├── styles.css                   # globálny štýl (modrá + zlatá)
    ├── main.js                      # téma, cookie banner
    ├── analytics.js                 # GA4 (consent-aware)
    ├── logo.svg / logo.png          # horizontálne logo
    ├── logo-mark.svg / .png         # samostatný shield
    ├── favicon.svg / .ico
    ├── favicon-16/32/192/512.png
    ├── apple-touch-icon.png
    ├── og-image.svg / og-image.png  # 1200×630
```

## 1. Nasadenie na Hostinger

1. Prihlás sa do **hPanel → File Manager** a otvor priečinok `public_html` pre doménu `generaltrade.shop`.
2. Vymaž predvolený `default.php` / `index.html`, ak tam nejaký je.
3. **Nahraj všetky súbory a priečinok `assets/`** z tohto balíka priamo do `public_html` (nie do podpriečinka).
4. Skontroluj, že `.htaccess` sa nahral (je skrytý súbor – v File Manageri zapni „Show hidden files").
5. V hPanel zapni **SSL certifikát** pre doménu (Hosting → SSL → Free SSL → Install). Po inštalácii bude HTTPS redirect z `.htaccess` fungovať.

### Alternatíva – cez FTP

```
host:    ftp.generaltrade.shop  (alebo údaje z hPanel → FTP účty)
zložka:  public_html/
```

## 2. Affiliate odkazy

Affiliate URL je integrované všade v navigácii a v produktových kartách:

```
https://www.gamersoutlet.net/?tracking=cZfxnjmBhNuS6JaYQco7JESCFtaOSTsiP3LDaichhBrY3t8kxBkCtdm9ec71AJWi
```

Pre produktové stránky sú odkazy nasmerované na konkrétne URL partnera (`/windows-11-pro`, `/office-2021-pro-plus`, `/steam`, `/vmware-workstation-pro`). Ak konkrétne sub-URL u Gamers Outlet neexistujú, partner ich automaticky presmeruje na hľadanie/domov a tracking parameter sa zachová.

Všetky externé tlačidlá majú správny `rel="sponsored noopener noreferrer"` a `target="_blank"` v zmysle Google guideline pre affiliate.

## 3. Google Analytics 4 (GA4)

V každom HTML je vložené:

```html
<script>
  window.GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
</script>
<script async src="/assets/analytics.js"></script>
```

**Čo doplniť:**
1. V [analytics.google.com](https://analytics.google.com) vytvor účet → Property → Web data stream pre `https://generaltrade.shop`.
2. Skopíruj **Measurement ID** v tvare `G-XXXXXXXXXX`.
3. V každom HTML súbore (index, obchodne-podmienky, ochrana-osobnych-udajov, cookies, kontakt) nahraď `G-XXXXXXXXXX` svojim reálnym ID. Hľadaj cez Find & Replace.
4. GA4 sa načíta **iba po súhlase** používateľa v cookie banneri (consent-aware) – súlad s GDPR.

## 4. Google Search Console

V každom HTML je vložený meta tag:

```html
<meta name="google-site-verification" content="GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE" />
```

**Postup:**
1. V [search.google.com/search-console](https://search.google.com/search-console) pridaj property typu **URL prefix**: `https://generaltrade.shop/`.
2. Vyber metódu overenia **HTML tag** a skopíruj hodnotu z `content="..."`.
3. Nahraď `GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE` reálnym kódom – stačí v `index.html` (Google overí jednu stránku), ale pre istotu nahraď vo všetkých.
4. Po overení odošli sitemapu: `https://generaltrade.shop/sitemap.xml`.

## 5. Doplnenie identifikačných údajov prevádzkovateľa

V právnych dokumentoch sú miesta, kde treba doplniť reálne údaje (IČO, DIČ, sídlo, prípadne registráciu):

- `obchodne-podmienky.html` → bod **1. Úvodné ustanovenia a prevádzkovateľ**
- `ochrana-osobnych-udajov.html` → bod **1. Prevádzkovateľ a kontakt**
- `kontakt.html` → sekcia **Pred ostrým spustením doplň**

Hľadaj v texte slovo „doplň" – tam sú placeholdery.

## 6. Cookie banner

- Nevyžaduje žiadnu konfiguráciu, beží automaticky.
- Ukladá súhlas do `localStorage` pod kľúčom `gt-cookie-consent`.
- Používateľ môže súhlas zmeniť kliknutím na link **Zmeniť nastavenia cookies** na stránke `/cookies.html`.
- Bez súhlasu sa GA4 vôbec nenačíta.

## 7. SEO checklist pred indexáciou

- [ ] Vlož reálne GA4 Measurement ID
- [ ] Vlož Search Console verifikačný kód a over property
- [ ] Pošli sitemap.xml v Search Console
- [ ] V hPanel zapni Free SSL
- [ ] Skontroluj, že `https://generaltrade.shop` sa otvára a `http://` sa redirectuje
- [ ] Otestuj na [PageSpeed Insights](https://pagespeed.web.dev) a [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [ ] Preverenie OG obrázku na [opengraph.xyz](https://www.opengraph.xyz)

## 8. Vizuálne assety – súbory

- **Logo (horizontálne):** `assets/logo.png` (720×192) a vektorová verzia `assets/logo.svg`
- **Logo (mark/avatar):** `assets/logo-mark.png` (512×512) a `assets/logo-mark.svg`
- **Favicon:** `assets/favicon.ico` (multi-size 16/32/48/64) + PNG verzie + SVG
- **Apple Touch Icon:** `assets/apple-touch-icon.png` (180×180)
- **Open Graph obrázok:** `assets/og-image.png` (1200×630) – pre Facebook, LinkedIn, Twitter

Vizuálny štýl: **prémiová tmavá modrá (#0b1f48 / #1d3a78) so zlatým akcentom (#d4a64a / #f7d27a)**.
