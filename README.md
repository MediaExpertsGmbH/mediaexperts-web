# Media Experts GmbH — website

New site for **mediaexperts.ch**, ported from the Claude Design "Website v2" template into plain HTML/CSS/JS (no runtime, no build step, no framework).

## Context
- Media Experts GmbH (Zurich, since 2018) started as a software studio. The service business is discontinued.
- The company now builds **GroundZero** (groundzero.live) and **RPLX** (rplx.app). Custom work is mentioned only as "Selected engagements on request".
- Contact: **info@mediaexperts.ch**, **Bahnhofstrasse 10, 8001 Zürich**. **No phone numbers.**

## Structure
- `site/index.html`: English (source page). Five chapters: Intro, GroundZero, RPLX Property Navigator (scroll story), RPLX features, Markets, Company + office photo, Contact.
- `site/de/`, `site/fr/`, `site/it/`: **generated** by `build-lang.py`. Never edit them by hand: edit the English page, add new text to the `TEXT` table in `build-lang.py`, then run `python3 build-lang.py` (it lists any English text without a translation).
- `site/impressum.html`: legal notice in DE/EN/FR/IT.
- `site/assets/cinema-cables.js`: the animated cable canvas, which morphs per chapter via `data-cable` attributes.
- `site/assets/app.js`: chapter pill, Property Navigator steps, unit picking, contact form (opens the visitor's mail app), dimmed cables on phones.
- `site/assets/gz.js`: loads the GroundZero KPIs live (Supabase `gz_stats()` + enabled `gz_landings`, the same rule as rplx `src/lib/groundzero/coverage.js`). The numbers in the HTML are the fallback.
- `site/assets/me.css`: hover states, 3D walkthrough animation, language menu, phone layout.
- `email/autoresponder.html` + `.txt`: branded auto-reply for info@mediaexperts.ch (EN lead, DE/FR/IT short versions). Its images load from `https://mediaexperts.ch/assets/email/`, so they show once the site is deployed.

Preview: `python3 -m http.server 8765 --directory site`, then open http://localhost:8765

## Deploy (Infomaniak web hosting)
The server pulls this repo; the website root is the `site/` folder. DE/FR/IT pages are committed, so the server only needs git.

First time (SSH into the hosting):
```bash
cd ~/sites
git clone https://github.com/MediaExpertsGmbH/mediaexperts-web.git
```
Then in the Infomaniak Manager set the site's root folder to `sites/mediaexperts-web/site`.

Every update:
```bash
cd ~/sites/mediaexperts-web && git pull --ff-only
```

Editing: change `site/index.html` (English), run `python3 build-lang.py`, commit and push, then pull on the server.
`site/.htaccess` forces HTTPS, redirects www to mediaexperts.ch and serves `404.html`.

## Open items
- **Fonts:** Red Hat Display/Mono load from Google Fonts, and the privacy note says so. Self-host them to drop that.
- **Product example:** the buyer "Anna Keller", unit prices and the CHF figures are illustrative; the Impressum says so.
