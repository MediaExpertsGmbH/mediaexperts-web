# Media Experts GmbH — website

New site for **mediaexperts.ch**, ported from the Claude Design "Website v2" template into plain HTML/CSS/JS (no runtime, no build step, no framework).

## Context
- Media Experts GmbH (Zurich, since 2018) started as a software studio. The service business is discontinued.
- The company now builds **GroundZero** (groundzero.live) and **RPLX** (rplx.app). Custom work is mentioned only as "Selected engagements on request".
- Contact: **info@mediaexperts.ch**, **Bahnhofstrasse 10, 8001 Zürich**. **No phone numbers.**

## Structure
The repo root **is** the website root: clone it straight into the hosting's site folder.
- `index.html`: English (source page). Chapters: Intro, GroundZero, RPLX Property Navigator (scroll story), RPLX features, Markets, Company + office photo, Contact.
- `de/`, `fr/`, `it/`: **generated** by `build-lang.py`. Edit the English page, add new text to the `TEXT` table in `build-lang.py`, run `python3 build-lang.py`, and commit the result.
- `impressum.html`: legal notice in DE/EN/FR/IT. `404.html`: not-found page.
- `assets/cinema-cables.js`: animated cable canvas (morphs per chapter via `data-cable`).
- `assets/app.js`: chapter pill, Property Navigator steps, unit picking, contact form, dimmed cables on phones.
- `assets/gz.js`: live GroundZero KPIs (Supabase `gz_stats()` + enabled `gz_landings`, same rule as rplx `src/lib/groundzero/coverage.js`). The numbers in the HTML are the fallback.
- `assets/me.css`: hover states, 3D walkthrough, language menu, phone layout.
- `.htaccess`: HTTPS, www → mediaexperts.ch, 404 page, caching. It also blocks `.git`, `README.md`, `build-lang.py` and `email/` from the web.
- `email/autoresponder.html` + `.txt`: branded auto-reply for info@mediaexperts.ch. Its images load from `https://mediaexperts.ch/assets/email/`.

Preview locally: `python3 -m http.server 8765`, then open http://localhost:8765

## Deploy (Infomaniak web hosting)
The site's main folder on the server is a clone of this repo. First time, in that (empty) folder:
```bash
git clone https://github.com/MediaExpertsGmbH/mediaexperts-web.git .
```
Every update:
```bash
git pull --ff-only
```

## Open items
- **Fonts:** Red Hat Display/Mono load from Google Fonts, and the privacy note says so. Self-host them to drop that.
- **Product example:** the buyer "Anna Keller", unit prices and the CHF figures are illustrative; the Impressum says so.
