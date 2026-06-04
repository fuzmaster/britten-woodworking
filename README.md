# Britten Woodworking

Marketing site for **Britten Woodworking** — Michael Britten, a Connecticut woodworker with 30+ years of experience in 18th-century reproduction cabinetry, architectural millwork, paneling, shutters, and storm doors.

**Live site:** [www.brittenwoodworking.com](https://www.brittenwoodworking.com)

---

## Stack

Deliberately minimal — this is a brochure site, not an app.

- **HTML + CSS + a small `site.js`** — no framework, no bundler, no build step
- **Netlify** — hosting + edge headers + form processing
- **Netlify Forms** — three contact forms (general, services, weatherstrip booking) with honeypot spam protection
- **Google Fonts** — Playfair Display + Lora (typography only; no tracking)
- **JSON-LD structured data** — `LocalBusiness`, `Service`, `AggregateRating`/`Review` schema for SEO

No database. No backend. No auth. No JavaScript framework. No build pipeline. Edit a file, push to `main`, Netlify deploys it.

---

## Project structure

```
.
├── index.html              # Home — hero slideshow, who-we-are, testimonials, process
├── about.html              # Michael's bio
├── work.html               # Portfolio category index
├── services.html           # Services overview + form
├── testimonials.html       # Reviews (Google + Facebook)
├── contact.html            # Contact form
├── weatherstrip.html       # Weatherstrip installation landing page
├── thank-you.html          # Post-form confirmation (noindex)
├── privacy.html            # Privacy notice
├── projects/               # One page per portfolio category
│   ├── cabinetry.html
│   ├── corner-cabinetry.html
│   ├── entryways.html
│   ├── moldings.html
│   ├── paneling.html
│   ├── shutters.html
│   ├── stairway.html
│   └── storm-doors.html
├── images/                 # Photo assets, organised by category
├── styles.css              # Full design system (tokens, components, layout)
├── site.js                 # Nav, dropdowns, lightbox, slideshow, scroll reveals
├── netlify.toml            # Security headers + cache control
├── _redirects              # Pretty-URL rewrites
├── sitemap.xml             # Search engine index
└── robots.txt
```

---

## Design system

Single source of truth lives in `styles.css`. The visual register is **editorial print** — warm near-black surfaces (`#171410`), oxidized brass accent (`#B8864E`), Playfair Display headings + Lora body. Headings carry a brand tic: italic `<em>` for the second beat of a two-part title.

See the in-file comments at the top of `styles.css` for the token vocabulary (`--color-*`, `--space-*`, `--text-*`, `--font-*`).

---

## Local development

No tooling required. Open any `.html` file in a browser, or run a static server:

```bash
# Python 3
python -m http.server 8000

# Node
npx serve .
```

Then visit `http://localhost:8000`.

`site.js` includes a `rewriteRootRelativeUrlsForFileProtocol()` helper so `file://` previews resolve `/images/...` paths correctly — but a local HTTP server is closer to production.

---

## Deployment

Push to `origin/main` → Netlify auto-deploys (~30 s for a build of this size).

`netlify.toml` applies on every response:

| Header                      | Value                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| `Content-Security-Policy`   | self + Google Fonts; `unsafe-inline` permitted for JSON-LD + per-page `<style>` blocks |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload`                   |
| `X-Frame-Options`           | `DENY`                                                           |
| `X-Content-Type-Options`    | `nosniff`                                                        |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                |
| `Permissions-Policy`        | camera, microphone, geolocation, payment, USB all disabled       |

Static assets under `/images/*` cache `immutable` for 1 year; `styles.css` and `site.js` cache 1 day with `must-revalidate`; HTML uses the Netlify default so deploys ship instantly.

---

## Contact forms

Three forms, all routed through **Netlify Forms**:

| Form name              | Page                | Purpose                          |
| ---------------------- | ------------------- | -------------------------------- |
| `contact`              | `/contact`          | General contact / project inquiry |
| `services-contact`     | `/services`         | Services overview inquiry         |
| `weatherstrip-contact` | `/door-weatherstrip-installation` | Weatherstrip booking |

All three carry a `bot-field` honeypot — bots that auto-fill every field get silently dropped before reaching the inbox. Submissions land in the Netlify dashboard and forward to `michaelspikebritten@gmail.com`.

---

## SEO

- Per-page `<title>`, `<meta name="description">`, Open Graph, and canonical URL
- `sitemap.xml` lists every public page (16 entries)
- `robots.txt` allows everything except `/thank-you`
- JSON-LD on `/`, `/contact`, `/services`, `/testimonials`, `/about` (LocalBusiness, ContactPage, Service, Review, Person)
- Pretty URLs (`/about` instead of `/about.html`) served via Netlify's auto pretty-URL behavior

---

## Built by

Designed and built by **[Jacob Britten](https://jacobbritten.com)** for Michael Britten.

If this work is useful to you, consider [Ko-fi](https://ko-fi.com/jacobbritten) or [PayPal](https://www.paypal.com/donate/?hosted_button_id=47A4JJ4WNBY9U).

---

## License

Site content (copy, photography, brand assets) © Britten Woodworking. All rights reserved.

Site structure, CSS, and JavaScript code are provided as-is for reference. Reach out before reusing wholesale.
