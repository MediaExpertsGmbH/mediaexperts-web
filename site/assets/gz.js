// GroundZero live KPIs — same rule as rplx src/lib/groundzero/coverage.js:
// gz_stats() per-country totals, counted only for markets switched on in gz_landings.
// The numbers already in the page stay as the fallback if this request fails.
(() => {
  const API = 'https://hfubftjicdmlfssirfur.supabase.co/rest/v1';
  const KEY = 'sb_publishable_MkEvdB-9909NOzFzYbFrNA_9GzQMOoE'; // Supabase publishable (browser-safe) key, same one groundzero.live ships
  const CACHE = 'me-gz-coverage-v1';
  const lang = (document.documentElement.lang || 'en').slice(0, 2);
  const locale = { en: 'en-GB', de: 'de-CH', fr: 'fr-CH', it: 'it-CH' }[lang] || 'en-GB';
  const fmt = n => new Intl.NumberFormat(locale).format(n);

  // the template's market names; any new market falls back to the browser's own country name
  const NAMES = {
    en: { CZ: 'Czech Republic', CH: 'Switzerland', AE: 'Dubai', US: 'United States', DE: 'Germany', AT: 'Austria' },
    de: { CZ: 'Tschechien', CH: 'Schweiz', AE: 'Dubai', US: 'USA', DE: 'Deutschland', AT: 'Österreich' },
    fr: { CZ: 'République tchèque', CH: 'Suisse', AE: 'Dubaï', US: 'États-Unis', DE: 'Allemagne', AT: 'Autriche' },
    it: { CZ: 'Repubblica Ceca', CH: 'Svizzera', AE: 'Dubai', US: 'Stati Uniti', DE: 'Germania', AT: 'Austria' }
  };
  const WORDS = {
    en: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'],
    de: ['Eine', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn', 'Elf', 'Zwölf'],
    fr: ['Une', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix', 'Onze', 'Douze'],
    it: ['Una', 'Due', 'Tre', 'Quattro', 'Cinque', 'Sei', 'Sette', 'Otto', 'Nove', 'Dieci', 'Undici', 'Dodici']
  };
  let regionNames = null;
  try { regionNames = new Intl.DisplayNames([locale], { type: 'region' }); } catch (e) {}
  const nameOf = code => (NAMES[lang] || NAMES.en)[code] || (regionNames && regionNames.of(code)) || code;

  function coverage(stats, landings) {
    const on = new Set(landings.map(l => String(l.country || '').toUpperCase()).filter(Boolean));
    const markets = (stats.countries || [])
      .filter(c => on.has(String(c.country || '').toUpperCase()))
      .map(c => ({ country: String(c.country).toUpperCase(), permits: +c.projects || 0, units: +c.units || 0 }))
      .sort((a, b) => b.permits - a.permits);
    return {
      permits: markets.reduce((n, c) => n + c.permits, 0),
      units: markets.reduce((n, c) => n + c.units, 0),
      countries: on.size,
      markets
    };
  }

  function render(cov) {
    if (!cov || !cov.markets.length) return;
    const set = (k, v) => document.querySelectorAll(`[data-gz="${k}"]`).forEach(el => { el.textContent = v; });
    set('permits', fmt(cov.permits));
    set('units', fmt(cov.units));
    set('countries', fmt(cov.countries));
    const w = (WORDS[lang] || WORDS.en)[cov.countries - 1];
    set('count-word', w || fmt(cov.countries));

    const list = document.getElementById('gz-markets');
    if (!list) return;
    const tpl = list.querySelector('a');
    if (!tpl) return;
    const lp = list.dataset.lProjects || 'projects', lu = list.dataset.lUnits || 'units';
    const rows = cov.markets.map(m => {
      const a = tpl.cloneNode(true);
      a.children[0].textContent = nameOf(m.country);
      a.children[1].textContent = `${fmt(m.permits)} ${lp} · ${fmt(m.units)} ${lu}`;
      return a;
    });
    list.replaceChildren(...rows);
  }

  // show the last known numbers at once, then refresh
  try { render(JSON.parse(localStorage.getItem(CACHE))); } catch (e) {}

  const headers = { apikey: KEY, 'Content-Type': 'application/json' };
  const ctl = new AbortController();
  setTimeout(() => ctl.abort(), 8000);
  Promise.all([
    fetch(`${API}/rpc/gz_stats`, { method: 'POST', headers, body: '{}', signal: ctl.signal }).then(r => { if (!r.ok) throw r; return r.json(); }),
    fetch(`${API}/gz_landings?select=country&enabled=eq.true`, { headers, signal: ctl.signal }).then(r => { if (!r.ok) throw r; return r.json(); })
  ]).then(([stats, landings]) => {
    const cov = coverage(stats, landings);
    render(cov);
    try { localStorage.setItem(CACHE, JSON.stringify(cov)); } catch (e) {}
  }).catch(() => { /* keep the numbers already on the page */ });
})();
