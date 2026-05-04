# Generaltrade Licencie – generaltrade.shop

Slovenský affiliate storefront pre digitálne licencie (Windows, Office, Steam, VMware) nasadený na **Hostinger** doménu **generaltrade.shop**.

## Prevádzkovateľ

- **Obchodné meno:** Ing. Branislav Németh – Generaltrade
- **Miesto podnikania:** Armádna 777/4, 911 01 Trenčín, Slovenská republika
- **IČO:** 51 487 446
- **Živnostenský register:** Okresný úrad Trenčín, č. 840-24688
- **Telefón:** +421 903 760 844
- **E‑mail:** info@generaltrade.shop

## Štruktúra

```
.
├── index.html                      # domovská stránka
├── obchodne-podmienky.html         # OP
├── ochrana-osobnych-udajov.html    # GDPR
├── cookies.html                    # cookies + tabuľka
├── kontakt.html                    # kontakt + impressum
├── 404.html                        # vlastná chybová stránka
├── ads.txt                         # Google AdSense
├── robots.txt
├── sitemap.xml
├── .htaccess                       # Apache config (HTTPS, gzip, cache, security)
└── assets/
    ├── styles.css
    ├── main.js                     # cookie banner, theme toggle
    ├── analytics.js                # GA4 (consent-aware)
    ├── logo.svg / logo.png
    ├── logo-mark.svg / logo-mark.png
    ├── favicon.svg / .ico + multi-size PNG
    ├── apple-touch-icon.png
    └── og-image.svg / og-image.png  # 1200×630
```

## Lokálny náhľad

```bash
python3 -m http.server 8080
# alebo
npx serve .
```

Otvor `http://localhost:8080`.

## Nasadenie cez Git na Hostinger

V hPanel → **Website → Git** vyber tento repozitár, branch `main` a deploy path `public_html`. Pri každom `git push` sa zmeny automaticky nahrajú.

Detailný návod je v [README-NASADENIE.md](./README-NASADENIE.md).

## TODO pred ostrým spustením

- [ ] Doplniť reálne **GA4 Measurement ID** (nahradiť `G-XXXXXXXXXX` vo všetkých HTML)
- [ ] Doplniť **Search Console verifikačný kód** (nahradiť `GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE`)
- [ ] V hPanel zapnúť **Free SSL** pre `generaltrade.shop`
- [ ] Po overení v Search Console odoslať `sitemap.xml`

## Licencie a značky

Logá, dizajn a texty © Ing. Branislav Németh – Generaltrade. Názvy produktov tretích strán (Microsoft, Steam, EA, Ubisoft) patria ich vlastníkom.
