/* =========================================================
   TRISTAN PLASSARD — PORTFOLIO · interactions
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const DATA = window.PORTFOLIO_DATA || { longform: [], reels: [] };

  /* ---------- Formatting ---------- */
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const fmtK = n => n >= 1e6 ? +(n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? +(n / 1e3).toFixed(1) + 'K' : Math.round(n).toLocaleString('en-US');
  const fmtFull = n => Math.round(n).toLocaleString('en-US');
  const fmtDur = s => `${Math.floor(s / 60)}:${pad(Math.round(s % 60))}`;
  const fmtDate = d => d ? d.split('-').reverse().join('.') : '—';
  const sum = (arr, k) => arr.reduce((a, v) => a + (v[k] || 0), 0);
  const easeInOut = t => -(Math.cos(Math.PI * t) - 1) / 2; // soft start, soft stop
  // scroll progress (0–1) → position across n steps that rests on each one:
  // hold on 0, glide to 1, hold on 1 … hold on n-1
  const HOLD = .7;
  const steppedProgress = (p, n) => {
    let t = Math.min(1, Math.max(0, p)) * (n * HOLD + n - 1);
    for (let i = 0; i < n - 1; i++) {
      if (t <= HOLD) return i;
      t -= HOLD;
      if (t <= 1) return i + easeInOut(t);
      t -= 1;
    }
    return n - 1;
  };
  const stepRest = (k, n) => (k * (HOLD + 1) + HOLD / 2) / (n * HOLD + n - 1); // progress that rests on step k
  const mk = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };

  const PLAT_NAME = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube' };
  const PLAT_SHORT = { instagram: 'IG', tiktok: 'TT', youtube: 'YT' };
  const reelUrl = r => r.platform === 'tiktok' ? `https://www.tiktok.com/@bcd.design/video/${r.id}` : `https://www.instagram.com/reel/${r.id}/`;
  const ytThumb = (id, q = 'maxresdefault') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;

  const LF = DATA.longform || [];
  const REELS_ALL = DATA.reels || [];
  // the reels section shows the five best performers (likes + comments + shares);
  // the numbers section still counts every reel
  const reelScore = r => (r.likes || 0) + (r.comments || 0) + (r.shares || 0);
  const REELS = [...REELS_ALL].sort((a, b) => reelScore(b) - reelScore(a)).slice(0, 5);
  const ALL = [...LF.map(v => ({ ...v, platform: 'youtube' })), ...REELS_ALL];
  const statsDate = fmtDate(DATA.statsDate);

  /* =========================================================
     BUILD FROM data.js
     ========================================================= */

  /* ---------- Long-form list ---------- */
  $('#lfTotal').textContent = `${LF.length} videos · ${fmtK(sum(LF, 'views'))} views`;
  $('#lfList').innerHTML = LF.map((v, i) => `
    <li class="lf-item" data-i="${i}" tabindex="0" role="button" aria-label="Show ${v.title.replace(/"/g, '&quot;')}">
      <div class="lf-thumb"><img src="${ytThumb(v.id, 'mqdefault')}" alt="" loading="lazy"><span>${fmtDur(v.duration)}</span></div>
      <div><small class="lbl">${pad(i + 1)} — ${v.tag}</small><b>${v.title}</b><span class="cap">${fmtK(v.views)} views · ${fmtDate(v.date)}</span></div>
    </li>`).join('');

  /* ---------- Reels list ---------- */
  $('#reelsTotal').textContent = `Top ${REELS.length} · ${fmtK(sum(REELS, 'likes'))} likes`;
  $('#rlList').innerHTML = REELS.map((r, i) => {
    const [n, unit] = r.views != null ? [r.views, 'views'] : [r.likes, 'likes'];
    return `
    <li class="lf-item rl-item" data-i="${i}" data-p="${r.platform}" tabindex="0" role="button" aria-label="Show ${r.title.replace(/"/g, '&quot;')}">
      <div class="lf-thumb rl-thumb">${r.cover ? `<img src="${r.cover}" alt="" loading="lazy">` : ''}<span>${PLAT_SHORT[r.platform]}</span></div>
      <div><small class="lbl">${pad(i + 1)} — ${r.tag}</small><b>${r.title}</b><span class="cap">${fmtK(n)} ${unit} · ${fmtDate(r.date)}</span></div>
    </li>`;
  }).join('');
  const reelEls = $$('.rl-item');

  /* ---------- Numbers: chart, table, split, engagement ---------- */
  $('#tmDate').textContent = statsDate;
  const byLikes = [...ALL].sort((a, b) => b.likes - a.likes);
  const maxLikes = byLikes.length ? byLikes[0].likes : 1;
  $('#tmLikesSub').textContent = `${ALL.length} tracked videos, sorted by likes`;
  const tmBars = $('#tmBars');
  byLikes.forEach((v, i) => {
    const row = mk('div', null, 'tm-row');
    row.tabIndex = 0; row.dataset.i = i;
    row.setAttribute('role', 'listitem');
    row.setAttribute('aria-label', `${v.title}, ${PLAT_NAME[v.platform]}: ${fmtFull(v.likes)} likes`);
    const name = mk('div', null, 'tm-name');
    name.append(mk('small', PLAT_SHORT[v.platform]), mk('span', v.title));
    const track = mk('div', null, 'tm-track');
    const bar = mk('i', null, 'tm-bar');
    bar.style.setProperty('--w', (v.likes / maxLikes * 80) + '%');
    track.append(bar, mk('span', fmtFull(v.likes), 'tm-val'));
    row.append(name, track);
    tmBars.append(row);
  });

  // tooltip: value first, then the details (textContent only)
  const tmTip = $('#tmTip'), tmFig = $('#tmLikes');
  const showTip = row => {
    const v = byLikes[+row.dataset.i];
    tmTip.replaceChildren(mk('b', `${fmtFull(v.likes)} likes`), mk('span', v.title, 'tt-title'));
    [['Platform', PLAT_NAME[v.platform]], ['Views', v.views != null ? fmtFull(v.views) : 'Not public'],
     ['Comments', v.comments != null ? fmtFull(v.comments) : '—'], ['Published', fmtDate(v.date)]]
      .forEach(([k, val]) => { const r = mk('div', null, 'tt-row'); r.append(mk('span', k), mk('span', val)); tmTip.append(r); });
    const fr = tmFig.getBoundingClientRect(), rr = row.getBoundingClientRect();
    let y = rr.bottom - fr.top + 6;
    if (y + tmTip.offsetHeight > fr.height - 8) y = rr.top - fr.top - tmTip.offsetHeight - 6;
    tmTip.style.left = Math.max(0, Math.min(rr.left - fr.left + rr.width * .42, fr.width - tmTip.offsetWidth)) + 'px';
    tmTip.style.top = y + 'px';
    tmTip.classList.add('is-on');
  };
  const hideTip = () => tmTip.classList.remove('is-on');
  $$('.tm-row').forEach(r => {
    r.addEventListener('pointerenter', () => showTip(r));
    r.addEventListener('focus', () => showTip(r));
    r.addEventListener('pointerleave', hideTip);
    r.addEventListener('blur', hideTip);
  });

  // table view — the accessible twin of the chart
  const tbl = mk('table', null, 'tm-table');
  const thead = tbl.createTHead().insertRow();
  [['#'], ['Video'], ['Platform'], ['Likes', 'num'], ['Comments', 'num'], ['Views', 'num'], ['Published']].forEach(([t, c]) => {
    const th = mk('th', t, c); th.scope = 'col'; thead.append(th);
  });
  const tbody = tbl.createTBody();
  byLikes.forEach((v, i) => {
    const r = tbody.insertRow();
    [[pad(i + 1)], [v.title], [PLAT_NAME[v.platform]], [fmtFull(v.likes), 'num'],
     [v.comments != null ? fmtFull(v.comments) : '—', 'num'], [v.views != null ? fmtFull(v.views) : '—', 'num'], [fmtDate(v.date)]]
      .forEach(([t, c]) => r.append(mk('td', t, c)));
  });
  $('#tmTable').append(tbl);
  $('#tmToggle').addEventListener('click', e => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', on);
    e.currentTarget.textContent = on ? 'Chart view' : 'Table view';
    $('#tmTable').hidden = !on; tmBars.hidden = on; hideTip();
    hasGsap && ScrollTrigger.refresh();
  });

  const plats = ['instagram', 'tiktok', 'youtube'].map(p => {
    const vs = ALL.filter(v => v.platform === p), withViews = vs.filter(v => v.views != null);
    return { p, n: vs.length, likes: sum(vs, 'likes'), views: sum(withViews, 'views'), likesWithViews: sum(withViews, 'likes'), nViews: withViews.length };
  }).filter(s => s.n);
  const totLikes = sum(plats, 'likes') || 1;
  $('#tmSplit').innerHTML = plats.map(s => {
    const pct = s.likes / totLikes * 100;
    return `<div class="split-row">
      <div class="split-top"><span class="lbl">${PLAT_NAME[s.p]} · ${pad(s.n)} videos</span><span><b>${pct.toFixed(1)}%</b><small>${fmtFull(s.likes)} likes</small></span></div>
      <div class="split-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct.toFixed(1)}" aria-label="${PLAT_NAME[s.p]} share of likes"><i style="--w:${Math.max(pct, .8)}%"></i></div>
    </div>`;
  }).join('');
  $('#tmEng').innerHTML = plats.filter(s => s.views > 0).map(s => `<div class="eng-tile"><span class="lbl">${PLAT_NAME[s.p]}</span>
      <b data-rate="${(s.likesWithViews / s.views * 100).toFixed(2)}">${(s.likesWithViews / s.views * 100).toFixed(1)}%</b>
      <small>${pad(s.nViews)} videos · ${fmtK(s.views)} views</small></div>`).join('');

  /* ---------- Services: real numbers ---------- */
  const SVC_STATS = { lfViews: fmtK(sum(LF, 'views')), allLikes: fmtK(sum(ALL, 'likes')) };
  $$('[data-stat]').forEach(b => {
    b.textContent = SVC_STATS[b.dataset.stat] || '—';
    if (b.dataset.stat === 'allLikes') b.nextElementSibling.textContent = `Likes across ${ALL.length} tracked videos`;
  });

  /* ---------- Clock ---------- */
  const clock = $('#clock');
  const tick = () => (clock.textContent = 'Paris ' + new Date().toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour12: false }));
  tick(); setInterval(tick, 1000);

  /* =========================================================
     LONG-FORM PLAYER
     ========================================================= */
  const lfPlayer = $('#lfPlayer'), lfScreen = $('#lfScreen'), lfPoster = $('#lfPoster');
  const lfItems = $$('.lf-item');
  const lfShown = { views: 0, likes: 0, runtime: 0 };
  let lfIndex = -1;

  lfPoster.addEventListener('error', () => {
    if (!lfPoster.src.includes('hqdefault')) lfPoster.src = ytThumb(LF[lfIndex].id, 'hqdefault');
  });
  const stopLf = () => { const f = $('iframe', lfScreen); f && f.remove(); lfPlayer.classList.remove('is-playing'); };
  const fillLf = v => {
    lfPoster.src = ytThumb(v.id);
    $('#lfTag').textContent = v.tag;
    $('#lfTitle').textContent = v.title;
    $('#lfDur').textContent = fmtDur(v.duration);
    $('#lfStats [data-k="date"]').textContent = fmtDate(v.date);
    $('#lfExt').href = `https://www.youtube.com/watch?v=${v.id}`;
    lfPlayer.setAttribute('aria-label', `Play ${v.title}`);
  };
  const renderLfStats = o => {
    $('#lfStats [data-k="views"]').textContent = fmtFull(o.views);
    $('#lfStats [data-k="likes"]').textContent = fmtFull(o.likes);
    $('#lfStats [data-k="duration"]').textContent = fmtDur(o.runtime);
  };
  const tweenLfStats = v => {
    if (!hasGsap || reduced) { renderLfStats({ views: v.views, likes: v.likes, runtime: v.duration }); return; }
    gsap.to(lfShown, { views: v.views, likes: v.likes, runtime: v.duration, duration: 1, ease: 'power3.out', overwrite: true, onUpdate: () => renderLfStats(lfShown) });
  };
  const selectLf = (i, animate = true) => {
    if (i === lfIndex || !LF[i]) return;
    lfIndex = i;
    lfItems.forEach((el, j) => el.classList.toggle('is-active', j === i));
    stopLf();
    const v = LF[i];
    if (!animate || !hasGsap || reduced) { fillLf(v); tweenLfStats(v); return; }
    gsap.timeline()
      .to([...$$('.lf-overlay > *', lfPlayer), lfPoster], { opacity: 0, duration: .25, ease: 'power2.in' })
      .add(() => fillLf(v))
      .to(lfPoster, { opacity: 1, duration: .8, ease: 'power2.out' })
      .to($$('.lf-overlay > *', lfPlayer), { opacity: 1, duration: .6, ease: 'power2.out' }, '<.1');
    tweenLfStats(v);
  };
  const playLf = () => {
    if (lfPlayer.classList.contains('is-playing') || !LF[lfIndex]) return;
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${LF[lfIndex].id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.title = LF[lfIndex].title;
    lfScreen.appendChild(f);
    lfPlayer.classList.add('is-playing');
  };
  const onKey = fn => e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
  lfItems.forEach(el => {
    el.addEventListener('click', () => selectLf(+el.dataset.i));
    el.addEventListener('keydown', onKey(() => selectLf(+el.dataset.i)));
  });
  lfPlayer.addEventListener('click', playLf);
  lfPlayer.addEventListener('keydown', onKey(playLf));
  selectLf(0, false);

  /* =========================================================
     LIGHTBOX (reels)
     ========================================================= */
  const lb = $('#lightbox'), lbFrame = $('#lbFrame');
  let lenis = null, lastFocus = null;
  const openLightbox = r => {
    const h = Math.min(innerHeight * .8, 760);
    const w = Math.min(r.platform === 'tiktok' ? 340 : 420, innerWidth - 40);
    const src = r.platform === 'tiktok' ? `https://www.tiktok.com/embed/v2/${r.id}` : `https://www.instagram.com/reel/${r.id}/embed/`;
    lbFrame.innerHTML = `<iframe src="${src}" width="${w}" height="${h}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="${r.title.replace(/"/g, '&quot;')}"></iframe>`;
    $('#lbTitle').textContent = `${PLAT_NAME[r.platform]} — ${r.title}`;
    $('#lbExt').href = reelUrl(r);
    $('#lbExt').textContent = `Open on ${PLAT_NAME[r.platform]} ↗`;
    lastFocus = document.activeElement;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-modal');
    lenis && lenis.stop();
    $('.lb-close', lb).focus({ preventScroll: true });
  };
  const closeLightbox = () => {
    if (!lb.classList.contains('is-open')) return;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-modal');
    setTimeout(() => (lbFrame.innerHTML = ''), 500);
    lenis && lenis.start();
    lastFocus && lastFocus.focus({ preventScroll: true });
  };
  $$('[data-close]', lb).forEach(el => el.addEventListener('click', closeLightbox));
  addEventListener('keydown', e => e.key === 'Escape' && closeLightbox());

  /* =========================================================
     REELS PLAYER — same layout as long-form, plays in the lightbox
     ========================================================= */
  const rlPlayer = $('#rlPlayer'), rlPoster = $('#rlPoster');
  const RL_KEYS = ['views', 'likes', 'comments', 'shares'];
  const rlShown = { views: 0, likes: 0, comments: 0, shares: 0 };
  let rlIndex = -1;

  const fillRl = r => {
    rlPoster.src = r.cover || '';
    $('#rlTag').textContent = r.tag;
    $('#rlPlat').textContent = PLAT_NAME[r.platform];
    $('#rlTitle').textContent = r.title;
    $('#rlIndex').textContent = `Reel ${pad(rlIndex + 1)} / ${pad(REELS.length)}`;
    $('#rlStats [data-k="date"] dd').textContent = fmtDate(r.date);
    RL_KEYS.forEach(k => ($(`#rlStats [data-k="${k}"]`).hidden = r[k] == null));
    $('#rlExt').href = reelUrl(r);
    $('#rlExt').firstChild.textContent = `Watch on ${PLAT_NAME[r.platform]} `;
    rlPlayer.setAttribute('aria-label', `Play ${r.title}`);
  };
  const renderRlStats = o => RL_KEYS.forEach(k => ($(`#rlStats [data-k="${k}"] dd`).textContent = fmtFull(o[k])));
  const tweenRlStats = r => {
    const to = Object.fromEntries(RL_KEYS.map(k => [k, r[k] || 0]));
    if (!hasGsap || reduced) { renderRlStats(to); return; }
    gsap.to(rlShown, { ...to, duration: 1, ease: 'power3.out', overwrite: true, onUpdate: () => renderRlStats(rlShown) });
  };
  const selectRl = (i, animate = true) => {
    if (i === rlIndex || !REELS[i]) return;
    rlIndex = i;
    reelEls.forEach((el, j) => el.classList.toggle('is-active', j === i));
    const r = REELS[i];
    if (!animate || !hasGsap || reduced) { fillRl(r); tweenRlStats(r); return; }
    gsap.timeline()
      .to([...$$('.lf-overlay > *', rlPlayer), rlPoster, '#rlTitle'], { opacity: 0, duration: .25, ease: 'power2.in' })
      .add(() => fillRl(r))
      .to(rlPoster, { opacity: 1, duration: .8, ease: 'power2.out' })
      .to([...$$('.lf-overlay > *', rlPlayer), '#rlTitle'], { opacity: 1, duration: .6, ease: 'power2.out' }, '<.1');
    tweenRlStats(r);
  };
  reelEls.forEach(el => {
    el.addEventListener('click', () => selectRl(+el.dataset.i));
    el.addEventListener('keydown', onKey(() => selectRl(+el.dataset.i)));
  });
  const playRl = () => REELS[rlIndex] && openLightbox(REELS[rlIndex]);
  rlPlayer.addEventListener('click', playRl);
  rlPlayer.addEventListener('keydown', onKey(playRl));
  selectRl(0, false);


  /* ---------- Contact: copy the email ---------- */
  const mail = $('#mailBtn');
  mail.addEventListener('click', () => {
    navigator.clipboard && navigator.clipboard.writeText(mail.dataset.mail);
    mail.classList.add('is-copied');
    setTimeout(() => mail.classList.remove('is-copied'), 1800);
  });

  /* ---------- About: the visor lifts with the scroll (image sequence on a canvas) ---------- */
  const visor = (() => {
    const cv = $('#visor'), ctx = cv.getContext('2d');
    const N = 53, DIR = 'assets/visor/';
    const frames = [], hiStart = new Image(), hiEnd = new Image();
    const ok = img => img && img.complete && img.naturalWidth > 0;
    let want = 0, shown = null, started = false;
    // the two resting states get sharper stills; the frames in between are lighter
    const pick = i => {
      if (i === 0 && ok(hiStart)) return hiStart;
      if (i === N - 1 && ok(hiEnd)) return hiEnd;
      for (let d = 0; d < N; d++) for (const j of [i - d, i + d]) if (ok(frames[j])) return frames[j];
      return ok(hiStart) ? hiStart : null;
    };
    const draw = (i, force) => {
      want = i;
      const img = pick(i);
      if (!img || (img === shown && !force)) return;
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      shown = img;
    };
    const fit = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
      draw(want, true);
    };
    const load = () => {
      if (started) return;
      started = true;
      for (let i = 0; i < N; i++) {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => Math.abs(i - want) < 3 && draw(want);
        im.src = `${DIR}f${pad(i)}.jpg`;
        frames[i] = im;
      }
    };
    hiStart.onload = () => draw(want);
    hiEnd.onload = () => want === N - 1 && draw(want);
    hiStart.src = DIR + 'start.jpg';
    hiEnd.src = DIR + 'end.jpg';
    new ResizeObserver(fit).observe(cv);
    addEventListener('load', load);

    const state = $('#visorState'), bar = $('#visorBar');
    // p: 0 → 1 over the scroll; the lift plays across most of it, then holds on the open eyes
    const set = p => {
      const f = easeInOut(Math.min(1, Math.max(0, (p - .04) / .8)));
      draw(Math.round(f * (N - 1)));
      bar.style.setProperty('--p', Math.min(1, p / .86).toFixed(3));
      const up = p >= .86;
      state.classList.toggle('is-up', up);
      state.textContent = up ? 'Visor up.' : 'Scroll to lift the visor';
    };
    return { set, load };
  })();

  /* ---------- Services: one lap of the Bugatti circuit, one stage per stop ---------- */
  const lap = (() => {
    const line = $('#trackLine'), bike = $('#trackBike');
    const L = line.getTotalLength(), LAP_KM = 4.185;
    const pins = $$('.lap-pt'), stages = $$('.svc-stop'), tabs = $$('.svc-index button');
    const dist = $('#lapDist'), bar = $('#lapBar');
    line.style.strokeDasharray = L;
    // where each stop sits along the lap (nearest point of the path to its pin); the ride ends back on the line
    const at = pins.map(pin => {
      if (pin.classList.contains('lap-pt--start')) return 0;
      const tx = parseFloat(pin.style.getPropertyValue('--x')) * 7.1, ty = parseFloat(pin.style.getPropertyValue('--y')) * 10.4;
      let best = 0, bestD = Infinity;
      for (let d = 0; d <= L; d += 3) {
        const pt = line.getPointAtLength(d), dd = (pt.x - tx) ** 2 + (pt.y - ty) ** 2;
        if (dd < bestD) { bestD = dd; best = d; }
      }
      return best / L;
    }).concat(1);
    const N = at.length; // five stages + the finish line
    // the bike rides from stop to stop and rests on each; the stage on the right changes when it arrives
    const set = p => {
      const s = steppedProgress(p, N), i = Math.min(N - 1, Math.floor(s + 1e-4));
      const q = i === N - 1 ? 1 : at[i] + (at[i + 1] - at[i]) * (s - i);
      line.style.strokeDashoffset = L * (1 - q);
      const pt = line.getPointAtLength(L * q);
      bike.setAttribute('cx', pt.x); bike.setAttribute('cy', pt.y);
      const pinNow = i === N - 1 ? 0 : i;
      pins.forEach((el, k) => { el.classList.toggle('is-on', k <= i); el.classList.toggle('is-current', k === pinNow); });
      [stages, tabs].forEach(list => list.forEach((el, k) => el.classList.toggle('is-on', k === i)));
      const done = i === N - 1;
      dist.textContent = done ? 'Lap complete.' : `${(q * LAP_KM).toFixed(3)} km`;
      dist.classList.toggle('is-up', done);
      bar.style.setProperty('--p', q.toFixed(3));
    };
    set(0);
    return { set, tabs, restOn: k => stepRest(k, N) };
  })();

  /* ---------- Path: the timeline turns like a lens focus ring ---------- */
  const path = (() => {
    const scale = $('#lensScale'), grip = $('#lensGrip'), steps = $$('.path-step');
    const N = steps.length, GAP = 30; // degrees between two experiences on the ring
    const items = [];
    const add = (parent, el, a, fade, center) => { parent.append(el); items.push({ el, a, fade, center, shown: true }); return el; };
    for (let a = 0; a < 360; a += 3) add(scale, mk('i', null, 'lens-tick' + (a % GAP === 0 ? ' is-major' : a % 15 === 0 ? ' is-mid' : '')), a, 1.2);
    const marks = steps.map((st, i) => add(scale, mk('span', st.dataset.mark, 'lens-mark'), i * GAP, 3, true));
    for (let a = 0; a < 360; a += 2.5) add(grip, mk('i'), a, 1);
    let R = 0, rot = 0, cur = -1, pinned = 0;
    // each marking sits on a cylinder: x = R·sin, squeezed and dimmed by cos as it turns away
    const render = () => {
      for (const it of items) {
        const f = (((it.a - rot) % 360) + 540) % 360 - 180;
        if (Math.abs(f) >= 90) { if (it.shown) { it.el.style.opacity = 0; it.shown = false; } continue; }
        const r = f * Math.PI / 180, c = Math.cos(r);
        it.el.style.transform = `translate3d(${(R * Math.sin(r)).toFixed(1)}px,0,0) scaleX(${c.toFixed(3)})${it.center ? ' translateX(-50%)' : ''}`;
        it.el.style.opacity = (c ** it.fade).toFixed(3);
        it.shown = true;
      }
    };
    const set = p => {
      pinned = p;
      const s = steppedProgress(p, N);
      rot = s * GAP;
      render();
      const i = Math.round(s);
      if (i !== cur) {
        cur = i;
        steps.forEach((el, k) => el.classList.toggle('is-on', k === i));
        marks.forEach((el, k) => el.classList.toggle('is-on', k === i));
      }
    };
    // on the way in, the ring turns the last few degrees into place
    const approach = p => { if (pinned > 0) return; rot = -(1 - p) * 24; render(); };
    new ResizeObserver(() => { R = scale.clientWidth / 2; render(); }).observe(scale);
    R = scale.clientWidth / 2;
    set(0);
    return { set, approach };
  })();

  /* ---------- Quote: split into words so they can light up one by one ---------- */
  const quoteText = $('#quoteText');
  quoteText.innerHTML = quoteText.textContent.trim().split(/\s+/)
    .map(w => `<span class="qw${/^(bikes|video)\b/i.test(w) ? ' quote-hi' : ''}">${w}</span>`).join(' ');

  /* ---------- Background grid: slow parallax + cursor light ---------- */
  const bg = $('.bg');
  if (!reduced) {
    // the grid layers start one cell above the viewport and drift up at a fraction of the scroll
    let c = 80, gy = 0, py = -999, raf = 0;
    const light = () => bg.style.setProperty('--cy', py + c - gy + 'px');
    const moveGrid = () => {
      raf = 0;
      c = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell')) || 80;
      gy = -((scrollY * .18) % c);
      bg.style.setProperty('--gy', gy + 'px');
      light();
    };
    addEventListener('scroll', () => { raf || (raf = requestAnimationFrame(moveGrid)); }, { passive: true });
    addEventListener('resize', moveGrid);
    moveGrid();
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      addEventListener('pointermove', e => {
        py = e.clientY;
        bg.style.setProperty('--cx', e.clientX + 'px');
        light();
        bg.classList.add('is-lit');
      }, { passive: true });
      document.addEventListener('pointerleave', () => bg.classList.remove('is-lit'));
    }
  }

  /* ---------- Fallback without GSAP (offline) ---------- */
  if (!hasGsap) {
    visor.load(); visor.set(1);
    document.documentElement.classList.add('no-gsap');
    $('#loader').remove();
    lap.set(1);
    $$('[data-count]').forEach(b => (b.textContent = b.dataset.count));
    $$('.skill b').forEach(b => (b.textContent = b.dataset.value));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll (Lenis) ---------- */
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { duration: 1.6 }) : target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));

  /* =========================================================
     LOADER — FX3 viewfinder: boot → focus → REC → rack focus onto the home page
     ========================================================= */
  const hero = $('.hero');
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.load('600 100px "Inter Tight"').then(() => document.fonts.ready) : Promise.resolve(),
    new Promise(r => setTimeout(r, 2500))
  ]).catch(() => {});
  document.body.classList.add('is-loading');
  lenis && lenis.stop();

  // lens barrel distance marks (non-linear, like a real lens), subject at 1.2 m
  const DIST = [[0, .3], [.16, .5], [.27, .7], [.37, 1], [.5, 1.5], [.59, 2], [.7, 3], [.82, 5], [1, Infinity]];
  const SUBJECT = .42;
  const FSTOPS = [16, 14, 13, 11, 10, 9, 8, 7.1, 6.3, 5.6, 5, 4.5, 4, 3.5, 3.2, 2.8, 2.5, 2.2, 2, 1.8, 1.6, 1.4];
  $('#ldScale').insertAdjacentHTML('afterbegin', DIST.map(([x], i) => {
    let h = `<i class="ld-tick is-major" style="left:${x * 100}%"></i>`;
    if (i < DIST.length - 1) for (let k = 1; k < 4; k++) h += `<i class="ld-tick" style="left:${(x + (DIST[i + 1][0] - x) * k / 4) * 100}%"></i>`;
    return h;
  }).join(''));
  $('#ldNums').innerHTML = DIST.map(([x, d]) => `<span style="left:${x * 100}%">${d === Infinity ? '∞' : d}</span>`).join('');
  const distAt = fp => {
    for (let i = 1; i < DIST.length; i++) {
      const [x0, d0] = DIST[i - 1], [x1, d1] = DIST[i];
      if (fp > x1) continue;
      const t = (fp - x0) / (x1 - x0);
      return d1 === Infinity ? d0 / Math.max(1e-3, 1 - t) : d0 + (d1 - d0) * t;
    }
    return Infinity;
  };

  // histogram: a dark frame with a white subject, shifted by the exposure error
  const HB = 30, ldBars = $('#ldBars');
  ldBars.innerHTML = '<i></i>'.repeat(HB);
  const hBars = [...ldBars.children];
  const bell = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
  const histo = sh => hBars.forEach((b, j) => {
    const x = j / (HB - 1);
    const h = .9 * bell(x, .17 + sh, .1) + .32 * bell(x, .48 + sh, .15) + .6 * bell(x, .95 + sh, .03) + .03;
    b.style.transform = `scaleY(${Math.min(1, h * (.9 + Math.random() * .2)).toFixed(3)})`;
  });

  const ld = { fp: 1, stop: 0, pct: 0 };
  const ldLogo = $('#ldLogo'), ldPeak = $('#ldPeak'), ldMark = $('#ldMark'), ldDof = $('#ldDof');
  const ldF = $('#ldF'), ldEv = $('#ldEv'), ldDist = $('#ldDist'), ldPct = $('#ldPct');
  let peaking = true;
  const renderVF = () => {
    const st = Math.round(ld.stop), f = FSTOPS[st], ev = (st - (FSTOPS.length - 1)) / 3;
    const blur = Math.min(20, Math.abs(ld.fp - SUBJECT) * 38);
    ldLogo.style.filter = `blur(${blur.toFixed(2)}px) brightness(${Math.pow(2, ev / 2.4).toFixed(3)})`;
    ldLogo.style.transform = `scale(${(1 + (ld.fp - SUBJECT) * .09).toFixed(4)})`; // focus breathing
    if (peaking) ldPeak.style.opacity = Math.max(0, 1 - blur / 2.2).toFixed(3);
    ldMark.style.left = ld.fp * 100 + '%';
    const dof = 1 + f * .55; // depth of field narrows as the iris opens
    const dl = Math.max(0, ld.fp * 100 - dof), dr = Math.min(100, ld.fp * 100 + dof);
    ldDof.style.left = dl + '%'; ldDof.style.width = dr - dl + '%';
    ldF.textContent = 'F' + f;
    ldEv.textContent = ev > -.05 ? '±0.0' : '−' + Math.abs(ev).toFixed(1);
    const d = distAt(ld.fp);
    ldDist.textContent = d > 99 ? '∞' : d.toFixed(1) + ' M';
    ldPct.textContent = pad(Math.round(ld.pct), 3);
    histo(ev * .03);
  };
  renderVF();

  const ldAf = $('#ldAf'), ldState = $('#ldState'), ldTc = $('#ldTc'), tc = { f: 0 };
  const setTc = () => { const fr = Math.floor(tc.f); ldTc.textContent = `00:00:${pad(Math.floor(fr / 25))}:${pad(fr % 25)}`; };

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    // power on: the panel opens from a scanline
    .fromTo('#ldVf', { clipPath: 'inset(49.6% 0% 49.6% 0%)', filter: 'brightness(2.4)' },
      { clipPath: 'inset(0% 0% 0% 0%)', filter: 'brightness(1)', duration: .7, ease: 'expo.inOut', clearProps: 'clipPath,filter' })
    .from('.ld-corners', { opacity: 0, scale: 1.04, duration: .8 }, .3)
    .from('.ld-thirds', { opacity: 0, duration: 1 }, .35)
    .from('.ld-top > *, .ld-bottom > *', { opacity: 0, y: (i, el) => (el.closest('.ld-top') ? -8 : 8), duration: .7, stagger: .05 }, .35)
    .from('.ld-subject, .ld-focus', { opacity: 0, duration: .6, stagger: .1 }, .4)
    // AF acquires the subject while the lens hunts, the iris opens and the meter settles
    .fromTo(ldAf, { '--af': Math.round(Math.min(innerWidth, innerHeight) * .22) + 'px', opacity: 0 },
      { '--af': '22px', opacity: 1, duration: 1.5, ease: 'expo.inOut' }, .45)
    .to(ld, { keyframes: [
      { fp: .3, duration: .6, ease: 'power3.inOut' },
      { fp: .55, duration: .35, ease: 'power2.inOut' },
      { fp: .38, duration: .3, ease: 'power2.inOut' },
      { fp: .44, duration: .2, ease: 'power2.inOut' },
      { fp: SUBJECT, duration: .15, ease: 'power2.out' }
    ], onUpdate: renderVF }, .45)
    .to(ld, { stop: FSTOPS.length - 1, duration: 1.45, ease: 'power2.inOut', onUpdate: renderVF }, .5)
    .to(ld, { pct: 100, duration: 1.55, ease: 'power1.inOut', onUpdate: renderVF }, .45)
    .addPause(2.05, () => fontsReady.then(() => intro.play()))
    // focus confirmed
    .addLabel('lock', 2.1)
    .add(() => {
      peaking = false;
      ldAf.classList.add('is-lock'); $('#ldAfTag').textContent = 'AF LOCK';
      ldState.textContent = 'FOCUS LOCKED'; ldState.classList.add('is-lock');
    }, 'lock')
    .to(ldAf, { '--af': '14px', duration: .45 }, 'lock')
    .fromTo(ldAf, { opacity: .25 }, { opacity: 1, duration: .06, repeat: 4, yoyo: true, ease: 'none' }, 'lock')
    .fromTo(ldPeak, { opacity: 1 }, { opacity: 0, duration: .7, ease: 'power2.out' }, 'lock')
    // rolling
    .addLabel('rec', 'lock+=.25')
    .add(() => { $('#ldRecTag').classList.add('is-rec'); $('#ldRec').textContent = 'REC'; }, 'rec')
    .fromTo('#ldRecFrame', { opacity: 0 }, { keyframes: { opacity: [1, .25, 1] }, duration: .25, ease: 'none' }, 'rec')
    .to(tc, { f: 30, duration: 1.2, ease: 'none', onUpdate: setTc }, 'rec')
    // rack focus: the focus plane leaves the logo and lands on the home page
    .addLabel('rack', 'rec+=.45')
    .add(() => {
      ldAf.classList.remove('is-lock'); $('#ldAfTag').textContent = 'MF';
      ldState.classList.remove('is-lock'); ldState.textContent = 'RACK FOCUS';
    }, 'rack')
    .to(ld, { fp: 1, duration: .8, ease: 'power2.in', onUpdate: renderVF }, 'rack')
    .to(ldAf, { '--af': '64px', opacity: 0, duration: .6, ease: 'power2.in' }, 'rack')
    .addLabel('open', 'rack+=.3')
    .add(() => { document.body.classList.remove('is-loading'); lenis && lenis.start(); }, 'open')
    .to('#loader', { opacity: 0, filter: 'blur(12px)', duration: .8, ease: 'power2.inOut' }, 'open')
    .set('#loader', { display: 'none' }, 'open+=.8')
    .fromTo(hero, { filter: 'blur(16px)' }, { filter: 'blur(0px)', duration: 1.6, ease: 'power3.out', clearProps: 'filter' }, 'open')
    .from(bg, { opacity: 0, duration: 1.8, ease: 'power2.out' }, 'open+=.2')
    // the name rises line by line, then the rest of the page settles in
    .from('.hn', { yPercent: 105, duration: 1.4, stagger: .12 }, 'open+=.2')
    .from('.hero-top > *, .hero-bottom > *', { opacity: 0, y: 12, duration: .9, stagger: .06 }, 'open+=.6')
    .from('.nav', { opacity: 0, duration: 1 }, 'open+=.7');
  if (reduced) {
    intro.progress(1);
    $('#loader').style.display = 'none';
    document.body.classList.remove('is-loading');
  }

  /* =========================================================
     SCROLL
     ========================================================= */

  // calm reveals: fade + small rise, staggered within a batch
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%', once: true,
    onEnter: els => els.forEach((el, i) => {
      el.style.setProperty('--d', (i * .08).toFixed(2) + 's');
      el.classList.add('is-in');
      setTimeout(() => el.style.removeProperty('--d'), 1600);
    })
  });

  // progress rail + nav state
  const rail = $('#railFill'), nav = $('#nav');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => (rail.style.height = self.progress * 100 + '%') });
  ScrollTrigger.create({ start: 80, end: 'max', onToggle: self => nav.classList.toggle('is-scrolled', self.isActive) });
  $$('[data-link]').forEach(a => {
    const sec = $(a.getAttribute('href'));
    sec && ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: self => a.classList.toggle('is-active', self.isActive) });
  });

  // hero: the name drifts up and fades as the page scrolls away
  gsap.to('.hero-name', { yPercent: -14, opacity: .2, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Numbers ---------- */
  ScrollTrigger.create({ trigger: '.figures', start: 'top 85%', once: true, onEnter: () => $$('[data-count]').forEach(b => {
    const o = { v: 0 };
    gsap.to(o, { v: +b.dataset.count, duration: 2, ease: 'power3.out', onUpdate: () => (b.textContent = Math.round(o.v)) });
  }) });
  gsap.timeline({ scrollTrigger: { trigger: '.tm-panels', start: 'top 80%' }, defaults: { ease: 'expo.out' } })
    .from('.tm-bar', { scaleX: 0, duration: 1.2, stagger: .04 }, .2)
    .from('.split-meter i', { scaleX: 0, duration: 1.2, stagger: .1 }, .3);

  /* ---------- Quote: the words light up as the section scrolls into place ---------- */
  if (!reduced) {
    gsap.fromTo('#quoteText .qw', { opacity: .14 }, { opacity: 1, ease: 'none', stagger: .08,
      scrollTrigger: { trigger: '#quoteText', start: 'top 85%', end: 'center 62%', scrub: .6 } });
    gsap.fromTo('#quoteText', { y: 40 }, { y: 0, ease: 'none',
      scrollTrigger: { trigger: '.quote', start: 'top bottom', end: 'center center', scrub: .6 } });
  }

  /* ---------- Scroll-driven scenes: progress follows the scroll with a little inertia,
     so the hand-off from plain scrolling to the scene (and back) feels soft ---------- */
  const scrubbed = (vars, set) => {
    const o = { p: 0 };
    return gsap.to(o, { p: 1, ease: 'none', onUpdate: () => set(o.p), scrollTrigger: { scrub: .8, ...vars } });
  };
  const trackBase = $('.track-base'), baseL = trackBase.getTotalLength();
  trackBase.style.strokeDasharray = baseL;

  /* ---------- Path: scroll turns the ring, one experience at a time under the index ---------- */
  if (!reduced) {
    scrubbed({ trigger: '.path', start: 'top bottom', end: 'top top' }, path.approach);
    scrubbed({ trigger: '.path-pin', start: 'top top', end: '+=300%', pin: true, refreshPriority: 2 }, path.set);
  }

  /* ---------- Services: the lap is ridden on scroll, stopping at each stage ---------- */
  let svcST = null;
  if (reduced) lap.set(1);
  else ScrollTrigger.matchMedia({
    // desktop: the circuit draws itself in on the way, then the section holds while the lap is ridden
    '(min-width: 1100px) and (min-height: 640px)': () => {
      gsap.fromTo(trackBase, { strokeDashoffset: baseL }, { strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: '.services', start: 'top 85%', end: 'top top', scrub: .8 } });
      svcST = scrubbed({ trigger: '.svc-pin', start: 'top top', end: '+=360%', pin: true, refreshPriority: 1 }, lap.set).scrollTrigger;
      return () => { svcST = null; };
    },
    // smaller screens: the stages are listed; the lap follows the reading
    '(max-width: 1099px), (max-height: 639px)': () => {
      gsap.fromTo(trackBase, { strokeDashoffset: baseL }, { strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: '.lap-track', start: 'top bottom', end: 'top 75%', scrub: .8 } });
      scrubbed({ trigger: '.svc-stops', start: 'top 70%', end: 'bottom 60%' }, lap.set);
    }
  });
  // the stage index jumps the ride to that stop
  lap.tabs.forEach((b, k) => b.addEventListener('click', () => {
    if (!svcST) return;
    const y = svcST.start + (svcST.end - svcST.start) * lap.restOn(k);
    lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: 'smooth' });
  }));

  /* ---------- About: scroll lifts the visor ---------- */
  if (reduced) visor.set(1);
  else ScrollTrigger.matchMedia({
    // desktop: the helmet settles in on the way, then the section holds while the visor lifts
    '(min-width: 1100px) and (min-height: 640px)': () => {
      gsap.fromTo('#visor', { scale: .9, opacity: .4 }, { scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'top top', scrub: .8 } });
      scrubbed({ trigger: '.about-pin', start: 'top top', end: '+=130%', pin: true, refreshPriority: 3 }, visor.set);
    },
    // smaller screens: it plays as the picture crosses the screen
    '(max-width: 1099px), (max-height: 639px)': () => {
      gsap.fromTo('#visor', { scale: .92, opacity: .4 }, { scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '.about-media', start: 'top bottom', end: 'top 70%', scrub: .8 } });
      scrubbed({ trigger: '.about-media', start: 'top 80%', end: 'center 40%' }, visor.set);
    }
  });

  /* ---------- Kit: skill values count up with their bars ---------- */
  $$('.skill').forEach((s, i) => {
    const b = $('b', s), o = { v: 0 };
    ScrollTrigger.create({ trigger: s, start: 'top 88%', once: true, onEnter: () =>
      gsap.to(o, { v: +b.dataset.value, duration: 1.6, delay: .25 + i * .08, ease: 'power3.out', onUpdate: () => (b.textContent = Math.round(o.v)) }) });
  });

  /* ---------- Kit: blueprints draw themselves ---------- */
  $$('.bp-card').forEach(card => {
    const draw = $$('.bp-draw > *', card), dims = $$('.bp-dims path', card);
    const texts = $$('.bp-dims text', card), rows = $$('.bp-row', card);
    gsap.set([...draw, ...dims], { strokeDashoffset: 1 });
    gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 80%' } })
      .from(card, { opacity: 0, y: 26, duration: 1, ease: 'expo.out' })
      .to(draw, { strokeDashoffset: 0, duration: 1.4, stagger: .08, ease: 'power2.inOut' }, '<.2')
      .to(dims, { strokeDashoffset: 0, duration: .8, stagger: .15, ease: 'power2.out' }, '-=.6')
      .from(texts, { opacity: 0, duration: .5, stagger: .1 }, '<.3')
      .from(rows, { opacity: 0, duration: .5, stagger: .03 }, '<');
    // hovering a spec highlights the matching part of the drawing
    rows.forEach(r => {
      if (!r.dataset.part) return;
      const parts = $$(`.bp-part[data-part="${r.dataset.part}"]`, card);
      r.addEventListener('pointerenter', () => parts.forEach(p => p.classList.add('is-hi')));
      r.addEventListener('pointerleave', () => parts.forEach(p => p.classList.remove('is-hi')));
    });
  });

  /* =========================================================
     SECTION SNAPPING — never leave the visitor between two sections.
     Each section is a "zone" where the page may rest (its top, or anywhere
     inside it if it's taller than the screen / pinned). When scrolling stops
     outside a zone, the page glides to the nearest one in the scroll direction.
     ========================================================= */
  if (lenis) {
    const sections = $$('main > section');
    let idle = null, snapping = false, touching = false;

    const zones = () => {
      const vh = innerHeight, max = ScrollTrigger.maxScroll(window), y0 = scrollY;
      const zs = sections.map(sec => {
        const top = Math.min(sec.getBoundingClientRect().top + y0, max);
        return { start: top, end: Math.min(max, Math.max(top, top + sec.offsetHeight - vh)) };
      });
      zs[zs.length - 1].end = max;
      return zs;
    };
    const snapTarget = (y, dir) => {
      const zs = zones();
      if (zs.some(z => y >= z.start - 2 && y <= z.end + 2)) return null; // resting inside a section: fine
      let prev = null, next = null;
      for (const z of zs) {
        if (z.end < y) prev = z;
        else if (z.start > y && !next) next = z;
      }
      if (!prev) return next ? next.start : null;
      if (!next) return prev.end;
      const f = (y - prev.end) / (next.start - prev.end);
      return dir > 0 ? (f > .15 ? next.start : prev.end) : (f < .85 ? prev.end : next.start);
    };
    const check = () => {
      if (snapping || touching || lenis.isStopped || lb.classList.contains('is-open')) return;
      const y = scrollY, t = snapTarget(y, lenis.direction || 1);
      if (t == null || Math.abs(t - y) < 3) return;
      const dur = Math.min(1.1, .55 + Math.abs(t - y) / 1600);
      snapping = true;
      lenis.scrollTo(t, { duration: dur, easing: x => 1 - Math.pow(1 - x, 4) });
      setTimeout(() => (snapping = false), dur * 1000 + 120);
    };
    lenis.on('scroll', () => { clearTimeout(idle); idle = setTimeout(check, 130); });
    addEventListener('touchstart', () => { touching = true; clearTimeout(idle); }, { passive: true });
    addEventListener('touchend', () => { touching = false; clearTimeout(idle); idle = setTimeout(check, 260); }, { passive: true });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
