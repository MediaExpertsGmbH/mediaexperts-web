// Media Experts — page behaviour (chapter pill, Property Navigator story, contact form)
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sm = (p, a, b) => { const k = Math.max(0, Math.min(1, (p - a) / (b - a))); return k * k * (3 - 2 * k); };

  const UNITS = [
    { id: 'A-4.02', rooms: '3.5', area: '92 m²', balcony: '12 m²', floor: '4 · SW', price: 'CHF 1’290’000', deposit: 'CHF 129’000', status: 'AVAILABLE', cx: 42, cy: 43 },
    { id: 'A-3.02', rooms: '2.5', area: '64 m²', balcony: '8 m²', floor: '3 · S', price: 'CHF 890’000', deposit: 'CHF 89’000', status: 'AVAILABLE', cx: 42, cy: 53 },
    { id: 'B-2.05', rooms: '4.5', area: '118 m²', balcony: '16 m²', floor: '2 · W', price: 'CHF 1’640’000', deposit: 'CHF 164’000', status: 'WAITLIST', cx: 78, cy: 66 }
  ];

  const story = $('#navigator'), bld = $('#bld'), card = $('#card');
  const chap = $('#chap'), chapNum = $('#chap-num'), chapName = $('#chap-name');
  // status labels come from the page so every language can translate them
  const L = (k, d) => (card && card.dataset['l' + k]) || d;
  let unit = 0, p = 0, last = '';

  function fillUnit() {
    const u = UNITS[unit];
    for (const k of ['id', 'rooms', 'area', 'balcony', 'floor', 'price', 'deposit'])
      $$('.u-' + k).forEach(el => { el.textContent = u[k]; });
    bld.style.transformOrigin = u.cx + '% ' + u.cy + '%';
  }

  function render() {
    const u = UNITS[unit];
    const z = sm(p, 0.14, 0.3), c = sm(p, 0.3, 0.36);
    const step = p < 0.33 ? 0 : Math.min(5, 1 + Math.floor((p - 0.33) / 0.11));
    const hot = p < 0.06 ? 0 : p < 0.33 ? sm(p, 0.06, 0.12) : Math.max(0, 1 - (p - 0.33) / 0.05);
    const key = [z.toFixed(3), c.toFixed(3), step, hot.toFixed(3), unit].join();
    if (key === last) return; last = key;

    bld.style.transform = 'scale(' + (1 + 1.1 * z).toFixed(3) + ')';
    $$('.hot').forEach((b, i) => {
      const av = UNITS[i].status === 'AVAILABLE', sel = i === unit && p > 0.14;
      b.style.opacity = hot.toFixed(3);
      b.style.pointerEvents = hot > 0.3 ? 'auto' : 'none';
      b.style.background = av ? (sel ? 'rgba(127,212,107,.5)' : 'rgba(127,212,107,.22)') : (sel ? 'rgba(247,179,46,.5)' : 'rgba(247,179,46,.22)');
    });
    $('#ph-intro').hidden = !(p < 0.12);
    $('#ph-pick').hidden = !(p >= 0.12 && p < 0.33);
    $('#ph-steps').hidden = !(p >= 0.33);

    card.style.opacity = c.toFixed(3);
    card.style.transform = 'translateY(' + ((1 - c) * 40).toFixed(1) + 'px)';
    card.style.pointerEvents = c > 0.5 ? 'auto' : 'none';

    const st = $('#u-status');
    st.textContent = step >= 5 ? L('Reserved', 'RESERVED') : u.status === 'WAITLIST' ? L('Waitlist', 'WAITLIST') : L('Available', 'AVAILABLE');
    st.style.background = step >= 5 ? '#F04A55' : u.status === 'WAITLIST' ? '#F7B32E' : '#7FD46B';
    for (let k = 1; k <= 5; k++) $('#st' + k).hidden = k === 1 ? step > 1 : step !== k;

    $$('#steps .step').forEach((row, i) => {
      const n = i + 1, done = n < step || step === 5, cur = n === step && step < 5, mk = $('.mk', row);
      row.style.color = done || cur ? '#F4F2EF' : '#6A6560';
      mk.textContent = done ? '✓' : String(n);
      mk.style.borderColor = done || cur ? '#F04A55' : '#3A3633';
      mk.style.background = done ? '#F04A55' : 'transparent';
    });
    $$('#card .bar').forEach((b, i) => { b.style.background = i + 1 <= step ? '#F04A55' : '#3A3633'; });
  }

  function onScroll() {
    const mid = innerHeight * 0.5; let cur = null;
    $$('[data-chapter]').forEach(el => { if (el.getBoundingClientRect().top <= mid) cur = el; });
    if (cur) { chapNum.textContent = cur.dataset.chapter; chapName.textContent = cur.dataset.name; }
    chap.style.opacity = !cur || cur.dataset.chapter === '00' ? 0 : 1;
    const r = story.getBoundingClientRect();
    p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)));
    render();
  }

  $$('.hot').forEach(b => b.addEventListener('click', () => {
    unit = +b.dataset.i; fillUnit(); last = ''; render();
    const top = story.getBoundingClientRect().top + scrollY, span = story.offsetHeight - innerHeight;
    if (p < 0.33) scrollTo({ top: top + span * 0.34, behavior: 'smooth' });
  }));

  // contact form: opens the visitor's mail app with the message filled in
  let topic = 0;
  const topics = $$('.topic');
  topics.forEach(t => t.addEventListener('click', () => {
    topic = +t.dataset.i;
    topics.forEach((x, i) => {
      const on = i === topic;
      x.setAttribute('aria-pressed', on);
      x.style.background = on ? '#F4F2EF' : 'transparent';
      x.style.color = on ? '#0E0D0C' : '#F4F2EF';
      x.style.borderColor = on ? '#F4F2EF' : 'rgba(244,242,239,.24)';
    });
  }));
  $('#msg').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const body = `${f.get('message')}\n\n— ${f.get('name')}${f.get('company') ? ', ' + f.get('company') : ''}\n${f.get('email')}`;
    location.href = `mailto:info@mediaexperts.ch?subject=${encodeURIComponent('Website: ' + topics[topic].textContent)}&body=${encodeURIComponent(body)}`;
    $('#sent-name').textContent = String(f.get('name')).split(' ')[0];
    $('#form-wrap').hidden = true; $('#sent').hidden = false;
  });
  $('#reset').addEventListener('click', () => { $('#sent').hidden = true; $('#form-wrap').hidden = false; });

  // on phones the cables run behind the text: dim them in the reading-heavy chapters
  const narrow = matchMedia('(max-width: 720px)');
  const dims = $$('[data-cable]').map(el => [el, el.dataset.dim]);
  const applyDim = () => dims.forEach(([el, d]) => {
    const reading = ['ground', 'tower', 'skyline'].includes(el.dataset.cable);
    el.dataset.dim = narrow.matches && reading ? '.3' : d;
  });
  narrow.addEventListener('change', applyDim); applyDim();

  fillUnit();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
