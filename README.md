# Generaltrade Shop

Slovenský e-shop s prírodnou kozmetikou pre doménu **[generaltrade.shop](https://generaltrade.shop)**.

Statický web (HTML / CSS / vanilla JS) pripravený pre nasadenie cez **Hostinger Git deploy**. Produkty sú importované z RSS Google Merchant feedu Panakeia.sk a obohatené o vlastnú maržu **+40 %** (zaokrúhlenie na 2 desatinné miesta).

---

## Quickstart

```bash
npm install               # nemáme runtime deps, len engines check
npm run feed              # stiahnutie feedu z panakeia.sk a vygenerovanie data/*.json
npm run pages             # vygenerovanie HTML stránok
npm run sitemap           # sitemap.xml zo statických + produkt stránok
npm run build             # = feed + pages + sitemap (full build)
npm run dev               # lokálny náhľad na :4173
npm test                  # smoke test, že data/products.json nie je prázdny
```

Po každej zmene feedu (prepojenie s `cron`-om alebo manuálne) spusťte `npm run build`, commitnite výstup do `main` a Hostinger sa nasadí automaticky.

---

## Architektúra

| Časť                | Popis                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `index.html`, … HTML | Statické stránky generované zo šablóny v `scripts/build-pages.mjs`.                           |
| `assets/styles.css` | Dizajnový systém (warm cream + sage + terracotta).                                            |
| `assets/main.js`    | Frontend logika: katalóg, košík (in-memory), pokladňa, cookie banner, toast.                  |
| `data/products.json`| Importované produkty (zdroj: Panakeia feed, +40 % markup).                                    |
| `data/categories.json` | Vyderivované kategórie a počty produktov.                                                  |
| `data/feed-meta.json`  | Metadáta posledného importu (počty, dátum).                                                |
| `scripts/import-feed.mjs` | Stiahne XML, zparsuje `<item>` tagy, aplikuje markup, slugifikuje.                      |
| `scripts/build-pages.mjs` | Generuje všetky HTML stránky vrátane právnych dokumentov.                               |
| `scripts/build-sitemap.mjs` | Vygeneruje `sitemap.xml` zo statických + produktových URL.                            |
| `.htaccess`         | Hostinger / Apache: HTTPS redirect, gzip, cache, security headers.                            |

### Cenová politika

`final = round(feed_price * 1.40, 2)`  — komentované v `scripts/import-feed.mjs#applyMarkup`.
Zákazník v UI vidí len konečnú cenu (vrátane DPH, ak relevantné). Marža je zdokumentovaná v tomto README, nikdy nie v zákazníckom UI.

### Produktové fotografie

Každý produkt používa **skutočnú fotografiu z dodávateľského feedu** — pole `g:image_link` z RSS Google Merchant feedu (CDN myshoptet.com). URL sa importujú do `data/products.json#image` a renderujú v katalógu, detaile produktu aj v košíku. Generované/placeholder obrázky sa nikdy nepoužívajú ako primárne — slúžia výhradne ako fallback (písmenková mozaika), ak sa konkrétna URL nepodarí načítať. Pri pravidelnom `npm run feed` sa fotografie automaticky aktualizujú spolu s ostatnými údajmi.

### Externý sklad

Tovar sa fyzicky nachádza u nášho dodávateľa (Panakeia). Storefront komunikuje:
- badge **Externý sklad · expedícia 2–5 dní** v detaile produktu,
- upozornenie v košíku a pokladni,
- vysvetľujúca sekcia v **Doprava a platba**, **O nás** a **FAQ**,
- nedostupné produkty (out of stock) majú badge „Nedostupné" a tlačidlo *Pridať do košíka* sa nezobrazuje.

---

## Hostinger deployment

Hostinger podporuje **Git Deploy** zo súkromných aj verejných repozitárov:

1. **Hostinger hPanel** → **Websites** → vybraná doména `generaltrade.shop`.
2. **Advanced** → **Git** → *Create new repository*.
3. Vyplňte:
   - Repository: `https://github.com/branislavnemeth-source/generaltrade-shop.git`
   - Branch: `main`
   - Install path: `public_html` (alebo iný document root domény)
4. *Save & deploy*. Hostinger naklonuje repozitár a obsah dá do `public_html`.
5. Pre auto-deploy pri každom pushnutí: skopírujte **Webhook URL**, otvorte v GitHub repo:
   `Settings → Webhooks → Add webhook` → URL z Hostingeru, content type `application/json`, event: *Just the push event*.

### DNS

Doména `generaltrade.shop` musí smerovať na Hostinger. V správcovi DNS:
```
A     @       <Hostinger IPv4>
A     www     <Hostinger IPv4>
AAAA  @       <Hostinger IPv6>      (voliteľné)
CNAME www     generaltrade.shop.
```
SSL certifikát Hostinger generuje automaticky cez **Let's Encrypt**. Po nasadení cez `.htaccess` presmerujeme HTTP → HTTPS.

### E-mail

Použitá kontaktná schránka je `postmaster@generaltrade.sk`. Ak chcete používať schránku priamo na doméne `generaltrade.shop`, vytvorte ju cez **Hostinger → Emails** a upravte `SITE.email` v `scripts/build-pages.mjs`.
- v päte stránok,
- v právnych dokumentoch (kontakt, reklamácie, GDPR),
- v pokladni pri inštrukciách.

Ak chcete posielať potvrdenia objednávky automaticky, integrujte SMTP/transactional poskytovateľa (Mailtrap, SendGrid, Brevo). Aktuálne pokladňa zobrazí inštrukcie iba na obrazovke a vyzve používateľa k úhrade.

---

## Aktualizácia produktov

```bash
npm run feed               # natiahne aktuálny feed
npm run pages              # nepovinné, ale odporúčané (regeneruje OG/title atď.)
npm run sitemap            # regeneruje sitemap.xml
git add data/ sitemap.xml
git commit -m "feed: refresh $(date -I)"
git push
```

Tip: na Hostinger CRON joby je možné nastaviť automatický pull + npm run feed. Náhradou je **GitHub Actions** schedule (uložiť výstup späť do repo).

---

## Platobné údaje

V pokladni a v dokumente *Doprava a platba* sa pre platbu cez Revolut zobrazujú tieto údaje:

- Príjemca: **Branislav Németh**
- IBAN: `LT54 3250 0672 8822 9312`
- BIC / SWIFT: `REVOLT21`
- Banka: Revolut Bank UAB, Konstitucijos ave. 21B, 08130 Vilnius, Lithuania
- Korešpondenčná banka (BIC): `CHASDEFX`

Bankový prevod, Revolut aj **platba kartou** sú v objednávkovom formulári aktívne. Bez API kľúčov konkrétneho poskytovateľa však web zatiaľ nevykonáva automatickú online autorizáciu karty; karta je pripravená pre platobný link alebo doplnenie brány typu Stripe / GP Webpay / Besteron.

---

## Google AdSense — checklist

Pred žiadosťou o AdSense:

- [ ] Doména je live na HTTPS (cez `.htaccess`).
- [ ] Vyplnené stránky **O nás**, **Kontakt**, **Obchodné podmienky**, **Reklamačný poriadok**, **Odstúpenie od zmluvy**, **Ochrana osobných údajov**, **Cookies**, **FAQ**, **Doprava a platba** — všetky sú generované v tomto repe.
- [ ] Sitemap nasadený a odoslaný v **Google Search Console**.
- [ ] `robots.txt` povoľuje indexáciu.
- [x] Cookie banner je zapnutý ako základný CMP režim s voľbou „iba nevyhnutné“ / „súhlasím so všetkým“.
- [x] Google Consent Mode v2 je inicializovaný s predvoleným odmietnutím reklamného a analytického súhlasu, súhlasy sa aktualizujú až po voľbe používateľa.
- [ ] V `ads.txt` doplňte riadok publishera po schválení.
- [ ] Privacy / Cookies odkazujú na:
  - <https://support.google.com/adsense/answer/1348695?hl=sk>
  - <https://support.google.com/adsense/answer/48182?hl=sk>
  - <https://www.google.com/settings/ads>
  - <https://www.aboutads.info>
- [ ] V obchode nie sú zakázané typy obsahu (žiadne adult, hate, atď.).
- [ ] Žiadne falošné kliknutia, žiadne klamlivé umiestnenia reklamy. Reklama bude oddelená od UI ovládacích prvkov.

---

## Právna kontrola

Všetky právne dokumenty sú **vzorové texty**, pripravené ako šablóna pre slovenský B2C e-shop. **Pred ostrým spustením** ich dajte preveriť právnemu/účtovnému poradcovi:

- VOP (zákon č. 108/2024 Z. z.)
- Reklamačný poriadok
- Odstúpenie od zmluvy + vzorový formulár
- GDPR / Zásady ochrany osobných údajov
- Cookies (špecifiká AdSense ak budete reklamu nasadzovať)

Zmeny robte v `scripts/build-pages.mjs` (sú tam ako šablónové reťazce) a regenerujte cez `npm run pages`.

---

## Ďalšie kroky / TODO

- [x] Karta je odblokovaná v `PAYMENT_METHODS`; doplňte API/redirect integráciu konkrétnej platobnej brány pre automatické spracovanie.
- [ ] Nasadenie e-mailového odosielača objednávok (SMTP) — momentálne pokladňa zobrazí inštrukcie, neodosiela e-mail.
- [x] Základný CMP banner pre EHP + Google Consent Mode v2.
- [ ] Cron / GitHub Action pre automatický `npm run feed && commit`.
- [ ] Pridanie vlastných produktových fotiek (zatiaľ sú obrázky linkované z CDN dodávateľa).
- [ ] Google Search Console + sitemap submission.
- [x] Telefónne číslo doplnené: `+421 903 760 844`.
