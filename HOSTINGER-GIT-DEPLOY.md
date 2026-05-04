# Hostinger Git deploy – generaltrade.shop

## Stav nasadenia

- **GitHub repo (verejný):** https://github.com/branislavnemeth-source/generaltrade-shop
- **Branch:** `main`
- **Doména:** generaltrade.shop
- **Hosting:** Hostinger (hPanel)

---

## 1) Pripojenie repa v hPanel

1. Prihlás sa do **hPanel** → vyber hosting pre `generaltrade.shop`.
2. V ľavom menu otvor **Pokročilé → GIT** (alebo **Website → Git**).
3. Klikni **Vytvoriť nový repozitár** / **Create a new repository**.
4. Vyplň polia:
   - **Repozitár (URL):** `https://github.com/branislavnemeth-source/generaltrade-shop.git`
   - **Branch:** `main`
   - **Inštalačná cesta:** `public_html` (alebo `domains/generaltrade.shop/public_html`, podľa štruktúry tvojho účtu)
5. Klikni **Vytvoriť** – Hostinger naklonuje repo a nasadí súbory do `public_html`.

> Repo je **verejný**, takže netreba SSH kľúč ani token. Ak by si neskôr chcel privátny repo, v hPanel pri pripojení vygeneruj Deploy Key a pridaj ho v GitHub → Settings → Deploy keys.

---

## 2) Automatické nasadenie po push (webhook)

Po vytvorení repa hPanel zobrazí **Webhook URL** (vyzerá tak: `https://webhooks.hostinger.com/deploy/xxxxxxxx`).

1. Skopíruj túto Webhook URL.
2. Otvor GitHub repo → **Settings → Webhooks → Add webhook**.
3. Vyplň:
   - **Payload URL:** vlož skopírovanú Hostinger webhook URL
   - **Content type:** `application/json`
   - **Which events:** *Just the push event*
   - **Active:** ✔
4. **Add webhook**.

Od tejto chvíle: každý `git push origin main` → Hostinger automaticky stiahne zmeny.

---

## 3) Manuálne nasadenie (kedykoľvek)

Ak nechceš webhook, alebo si potrebuješ vynútiť update:

- hPanel → **GIT** → pri repe klikni **Spravovať → Pull / Deploy** (alebo „Force deploy").

---

## 4) Doména a SSL

1. **Pripojenie domény:** hPanel → **Domény** – `generaltrade.shop` musí smerovať na hosting account (A záznam / nameservery Hostingera).
2. **Document root** musí byť `public_html` (kam si nasadil repo).
3. **SSL:** hPanel → **SSL** → vyber doménu → **Inštalovať bezplatný SSL** (Let's Encrypt). Po vystavení zapni **Force HTTPS**.

> `.htaccess` v repe už obsahuje HTTPS redirect, gzip, cache, security headers a custom 404. Hostinger ho automaticky aplikuje.

---

## 5) Po prvom nasadení – overenie

Otvor v prehliadači:

- https://generaltrade.shop/ – domovská stránka
- https://generaltrade.shop/obchodne-podmienky.html
- https://generaltrade.shop/ochrana-osobnych-udajov.html
- https://generaltrade.shop/cookies.html
- https://generaltrade.shop/kontakt.html
- https://generaltrade.shop/robots.txt
- https://generaltrade.shop/sitemap.xml
- https://generaltrade.shop/ads.txt

---

## 6) Zostáva doplniť (placeholdery v kóde)

V repo je potrebné nahradiť ešte tieto hodnoty (sú v každom HTML):

| Placeholder | Kde nahradiť | Čím |
|---|---|---|
| `G-XXXXXXXXXX` | hlavička každého .html (`window.GA_MEASUREMENT_ID`) | reálne GA4 Measurement ID |
| `GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE` | `<meta name="google-site-verification" ...>` | verifikačný kód z GSC |

Po úprave: `git add . && git commit -m "Doplniť GA4 + GSC" && git push` → Hostinger to nasadí automaticky cez webhook.

---

## 7) Bežný workflow zmien

```bash
cd /home/user/workspace/generaltrade-shop

# úprava súborov...

git add .
git commit -m "popis zmeny"
git push
# → ak je webhook nastavený, web sa updatne za pár sekúnd
```
