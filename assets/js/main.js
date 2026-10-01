/* =========================================================
   main.js — data/*.js 의 내용을 화면으로 옮깁니다.
   외부 라이브러리 없음. 파일을 더블클릭해도 그대로 동작합니다.
   ========================================================= */
(function () {
  'use strict';

  var D = window.HONOR || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* HTML 특수문자 escape — 데이터에 들어온 값을 그대로 넣을 때 사용 */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* 내용이 비었을 때 보여줄 자리 */
  function emptyBox(msg) {
    return '<p class="empty">' + esc(msg || '준비 중입니다.') + '</p>';
  }

  /* ── 입장 연출 ───────────────────────────────────── */
  function initCurtain() {
    var curtain = $('#curtain');
    var unlock = function () { document.body.classList.remove('is-loading'); };
    var reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!curtain || reduced) {
      if (curtain) curtain.classList.add('is-done');
      unlock();
      return;
    }
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      curtain.classList.add('is-done');
      unlock();
    };
    curtain.addEventListener('animationend', function (e) {
      if (e.animationName === 'curtainLift') finish();
    });
    setTimeout(finish, 3200);          // 애니메이션이 막혀도 반드시 풀립니다
    curtain.addEventListener('click', finish);
  }

  /* ── 상단 바 · 진행 표시 · 섹션 점 ───────────────── */
  function initChrome() {
    var bar = $('#topbar');
    var nav = $('.topbar__nav');
    var btn = $('#navToggle');
    var prog = $('#progress').firstElementChild;
    var toTop = $('#toTop');

    // 섹션 점 — data-nav 가 붙은 섹션만
    var sections = $$('section[data-nav]');
    $('#dots').innerHTML = sections.map(function (s) {
      return '<a class="dot" href="#' + s.id + '"><span>' + esc(s.dataset.nav) + '</span></a>';
    }).join('');
    var dots = $$('.dot');

    var onScroll = function () {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

      bar.classList.toggle('is-stuck', y > 40);
      toTop.classList.toggle('is-on', y > window.innerHeight);

      var mid = y + window.innerHeight * 0.4;
      var active = 0;
      sections.forEach(function (s, i) { if (s.offsetTop <= mid) active = i; });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === active); });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
    $$('.topbar__nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 스크롤 등장 ─────────────────────────────────── */
  function initReveal() {
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* 탭 전환 — 아카이브와 소식이 함께 씁니다 */
  function bindTabs(scope, onShow) {
    $$('.archive__tab', scope).forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('.archive__tab', scope).forEach(function (t) {
          t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false');
        });
        $$('.archive__panel', scope).forEach(function (p) { p.classList.remove('is-active'); });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        var id = tab.dataset.panel;
        if (onShow) onShow(id);
        $('#' + id).classList.add('is-active');
      });
    });
  }

  /* ─────────────────────────────────────────────────
     아너 소사이어티란
     ───────────────────────────────────────────────── */
  function renderAbout() {
    var a = D.about;
    if (!a) return;

    $('#nationalFigures').innerHTML = a.national.figures.map(function (f) {
      return '<div class="figure">' +
        '<span class="figure__value">' + esc(f.value) + '<small>' + esc(f.unit) + '</small></span>' +
        '<span class="figure__label">' + esc(f.label) + '</span></div>';
    }).join('');
    $('#nationalNote').textContent = a.national.asOf + ' · 출처: ' + a.national.source;

    $('#pillars').innerHTML = a.pillars.map(function (p) {
      return '<article class="pillar reveal"><span class="pillar__num">' + esc(p.num) + '</span>' +
        '<h3>' + esc(p.title) + '</h3><p>' + esc(p.body) + '</p></article>';
    }).join('');

    $('#timeline').innerHTML = a.timeline.map(function (t) {
      return '<li><span class="timeline__year">' + esc(t.year) + '</span>' +
        '<span class="timeline__body">' + esc(t.body) + '</span></li>';
    }).join('');

    /* 가입 안내 */
    $('#ways').innerHTML = a.ways.map(function (w) {
      return '<article class="way' + (w.accent ? ' way--accent' : '') + '"' +
        (w.badge ? ' data-badge="' + esc(w.badge) + '"' : '') + '>' +
        '<h3 class="way__title">' + esc(w.title) + '</h3>' +
        '<p class="way__amount">' + esc(w.amount) + ' <span>' + esc(w.unit) + '</span></p>' +
        '<p class="way__desc">' + esc(w.desc) + '</p></article>';
    }).join('');

    $('#joinSteps').innerHTML = a.steps.map(function (s) {
      return '<li><span class="steps__n">' + s.n + '</span><strong>' + esc(s.title) + '</strong>' +
        '<em>' + esc(s.body) + '</em></li>';
    }).join('');

    $('#taxList').innerHTML = a.tax.items.map(function (t) {
      return '<div><dt>' + esc(t.label) + '</dt><dd>' + esc(t.value) + '</dd></div>';
    }).join('');
    $('#taxNote').textContent = a.tax.note;
  }

  /* ─────────────────────────────────────────────────
     차트 공통 (손으로 그리는 SVG)
     ───────────────────────────────────────────────── */
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  var W = 1000, H = 420, PAD = { t: 32, r: 28, b: 52, l: 66 };
  var PLOT = { w: W - PAD.l - PAD.r, h: H - PAD.t - PAD.b };

  function axes(svg, rows, max, suffix, dark) {
    var labelColor = dark ? '#a89c8c' : '#6b6155';
    var gridColor = dark ? 'rgba(201,161,88,.2)' : 'rgba(201,161,88,.22)';
    var ticks = 4;
    for (var i = 0; i <= ticks; i++) {
      var y = PAD.t + PLOT.h - (PLOT.h / ticks) * i;
      svg.appendChild(el('line', { x1: PAD.l, x2: PAD.l + PLOT.w, y1: y, y2: y,
        stroke: gridColor, 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: PAD.l - 12, y: y + 4, 'text-anchor': 'end',
        fill: labelColor, 'font-size': 13, 'font-family': 'Noto Sans KR, sans-serif' },
        Math.round(max / ticks * i) + (suffix || '')));
    }
    var step = PLOT.w / rows.length;
    rows.forEach(function (r, i) {
      svg.appendChild(el('text', { x: PAD.l + step * i + step / 2, y: PAD.t + PLOT.h + 26,
        'text-anchor': 'middle', fill: labelColor,
        'font-size': 13, 'font-family': 'Noto Sans KR, sans-serif' }, String(r.year)));
    });
    return step;
  }

  function lineChart(host, rows, key, opt) {
    opt = opt || {};
    var vals = rows.map(function (r) { return r[key]; });
    var round = opt.round || 20;
    var max = Math.ceil(Math.max.apply(null, vals) / round) * round;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': opt.label || '' });
    var step = axes(svg, rows, max, opt.suffix, opt.dark);

    var pts = rows.map(function (r, i) {
      return [PAD.l + step * i + step / 2, PAD.t + PLOT.h - (r[key] / max) * PLOT.h];
    });
    var gid = 'g_' + key + (opt.dark ? '_d' : '');
    var grad = el('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.appendChild(el('stop', { offset: '0%',   'stop-color': '#c9a158', 'stop-opacity': '.45' }));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': '#c9a158', 'stop-opacity': '0' }));
    var defs = el('defs'); defs.appendChild(grad); svg.appendChild(defs);

    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ');
    svg.appendChild(el('path', { d: line + ' L' + pts[pts.length - 1][0] + ',' + (PAD.t + PLOT.h) +
      ' L' + pts[0][0] + ',' + (PAD.t + PLOT.h) + ' Z', fill: 'url(#' + gid + ')' }));
    svg.appendChild(el('path', { d: line, fill: 'none', stroke: '#c9a158', 'stroke-width': 2.5 }));

    rows.forEach(function (r, i) {
      var p = pts[i], g = el('g');
      g.appendChild(el('circle', { cx: p[0], cy: p[1], r: 5,
        fill: opt.dark ? '#13100d' : '#f7f3ec', stroke: '#c9a158', 'stroke-width': 2 }));
      g.appendChild(el('text', { x: p[0], y: p[1] - 16, 'text-anchor': 'middle',
        fill: opt.dark ? '#efe8dc' : '#231d16',
        'font-size': 14, 'font-family': 'Noto Serif KR, serif', 'font-weight': 900 }, r[key]));
      g.appendChild(el('title', {}, opt.tip ? opt.tip(r) : (r.year + ': ' + r[key])));
      svg.appendChild(g);
    });
    host.innerHTML = ''; host.appendChild(svg);
  }

  function barChart(host, rows, key, opt) {
    opt = opt || {};
    var max = Math.ceil(Math.max.apply(null, rows.map(function (r) { return r[key]; })) / 5) * 5;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opt.label || '' });
    var step = axes(svg, rows, max, '', opt.dark);
    var bw = Math.min(46, step * 0.5);

    rows.forEach(function (r, i) {
      var h = (r[key] / max) * PLOT.h;
      var x = PAD.l + step * i + step / 2 - bw / 2;
      var y = PAD.t + PLOT.h - h;
      var g = el('g');
      g.appendChild(el('rect', { x: x, y: y, width: bw, height: h,
        fill: i === rows.length - 1 ? '#e2231a' : '#c9a158',
        opacity: i === rows.length - 1 ? '.92' : '.78' }));
      g.appendChild(el('text', { x: x + bw / 2, y: y - 12, 'text-anchor': 'middle',
        fill: opt.dark ? '#efe8dc' : '#231d16',
        'font-size': 14, 'font-family': 'Noto Serif KR, serif', 'font-weight': 900 }, r[key]));
      g.appendChild(el('title', {}, opt.tip ? opt.tip(r) : (r.year + ': ' + r[key])));
      svg.appendChild(g);
    });
    svg.appendChild(el('text', { x: PAD.l, y: 16, fill: opt.dark ? '#a89c8c' : '#6b6155',
      'font-size': 13, 'font-family': 'Noto Sans KR, sans-serif' }, opt.unit || ''));
    host.innerHTML = ''; host.appendChild(svg);
  }

  /* ─────────────────────────────────────────────────
     나눔의 결과
     ───────────────────────────────────────────────── */
  function renderImpact() {
    var m = D.impact;
    if (!m) return;

    lineChart($('#chartImpact'), m.byYear, 'amount', {
      round: 20, suffix: '', dark: true, label: '연도별 배분 총액',
      tip: function (r) { return r.year + '년 배분 ' + r.amount + '억원 · 지원 기관 ' + r.orgs + '곳'; }
    });

    var top = Math.max.apply(null, m.fields.map(function (f) { return f.pct; }));
    $('#impactFields').innerHTML = m.fields.map(function (f) {
      return '<li class="bar">' +
        '<span class="bar__name">' + esc(f.name) + '</span>' +
        '<span class="bar__track"><span class="bar__fill" style="--w:' +
          (f.pct / top * 100) + '%"></span></span>' +
        '<span class="bar__pct">' + f.pct + '%</span></li>';
    }).join('');

    $('#impactPrograms').innerHTML = m.programs.map(function (p) {
      return '<article class="program reveal">' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<p class="program__target">' + esc(p.target) + '</p>' +
        '<p class="program__body">' + esc(p.body) + '</p></article>';
    }).join('');

    var src = m.asOf + ' · 지원 기관 ' + m.orgs.total + '곳 · ' + m.orgs.note;
    if (m.verified === false) src = '※ 검증 전 임시 수치입니다. ' + m.note + '<br>' + src;
    $('#impactSource').innerHTML = src;
  }

  /* ─────────────────────────────────────────────────
     예우 프로그램
     ───────────────────────────────────────────────── */
  var ICONS = {
    certificate: '<rect x="8" y="9" width="32" height="24" rx="2"/><path d="M15 17h18M15 23h12"/><circle cx="34" cy="36" r="5"/>',
    badge: '<circle cx="24" cy="19" r="11"/><path d="M18 29l-3 13 9-5 9 5-3-13"/>',
    plaque: '<rect x="7" y="11" width="34" height="26" rx="1"/><path d="M14 20h20M14 26h14"/>',
    people: '<circle cx="18" cy="17" r="6"/><circle cx="32" cy="20" r="5"/><path d="M7 40c0-6.6 5-11 11-11s11 4.4 11 11"/><path d="M30 29c6 0 11 4.4 11 11h-8"/>',
    star: '<path d="M24 6l5.6 11.4 12.6 1.8-9.1 8.9 2.1 12.5L24 34.7 12.8 40.6l2.1-12.5-9.1-8.9 12.6-1.8z"/>',
    invite: '<rect x="7" y="13" width="34" height="22" rx="2"/><path d="M7 15l17 12 17-12"/>'
  };
  function renderBenefits() {
    var b = D.benefits;
    if (!b) return;
    $('#benefitsGrid').innerHTML = b.items.map(function (it) {
      return '<article class="benefit reveal">' +
        '<svg class="benefit__icon" viewBox="0 0 48 48" aria-hidden="true">' +
          (ICONS[it.icon] || ICONS.star) + '</svg>' +
        '<h3>' + esc(it.title) + '</h3><p>' + esc(it.body) + '</p></article>';
    }).join('');
    $('#benefitsReport').innerHTML =
      '<h3>' + esc(b.report.title) + '</h3><p>' + esc(b.report.body) + '</p>';
  }

  /* ─────────────────────────────────────────────────
     명패 월
     ───────────────────────────────────────────────── */
  function buildPlates() {
    var w = D.wall || {};
    var given = (w.plates || []).slice();
    if (w.autoFill === false) return given.sort(function (a, b) { return a.no - b.no; });

    var rows = (D.ulsan && D.ulsan.rows) || [];
    if (!rows.length) return given;

    var byNo = {};
    given.forEach(function (p) { byNo[p.no] = p; });

    var plates = [], no = 0;
    rows.forEach(function (r) {
      while (no < r.members) { no++; plates.push(byNo[no] || { no: no, year: r.year }); }
    });
    return plates;
  }

  function initWall() {
    var grid = $('#wallGrid');
    if (!grid) return;
    var plates = buildPlates();
    if (!plates.length) { grid.innerHTML = emptyBox('등록된 명패가 없습니다.'); return; }

    var years = [];
    plates.forEach(function (p) { if (years.indexOf(p.year) < 0) years.push(p.year); });
    years.sort();

    $('#wallFilters').innerHTML =
      '<button class="wchip is-active" data-year="all">전체</button>' +
      years.map(function (y) { return '<button class="wchip" data-year="' + y + '">' + y + '</button>'; }).join('');

    var state = { year: 'all', q: '' };
    var render = function () {
      var list = plates.filter(function (p) {
        if (state.year !== 'all' && String(p.year) !== state.year) return false;
        if (!state.q) return true;
        return (p.no + ' ' + p.year + ' ' + (p.name || '')).indexOf(state.q) >= 0;
      });
      grid.innerHTML = list.length ? list.map(function (p) {
        var named = !!p.name;
        return '<div class="plate' + (named ? ' plate--named' : '') + '" tabindex="0">' +
          '<span class="plate__no">No. ' + p.no + '</span>' +
          '<span class="plate__name">' + (named ? esc(p.name) : '비공개') + '</span>' +
          '<span class="plate__year">' + p.year + '</span></div>';
      }).join('') : emptyBox('조건에 맞는 명패가 없습니다.');
      $('#wallCount').textContent = '명패 ' + list.length + '장' +
        (list.length !== plates.length ? ' / 전체 ' + plates.length + '장' : '');
    };

    $$('.wchip', $('#wallFilters')).forEach(function (chip) {
      chip.addEventListener('click', function () {
        $$('.wchip').forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        state.year = chip.dataset.year;
        render();
      });
    });
    $('#wallSearch').addEventListener('input', function () {
      state.q = this.value.trim(); render();
    });
    $('#wallNote').textContent = (D.wall && D.wall.note) || '';
    render();
  }

  /* ─────────────────────────────────────────────────
     추모 아카이브
     공개 조건을 통과한 기록만 화면에 올립니다.
     ───────────────────────────────────────────────── */
  function maskName(name) {
    var s = String(name || '').trim();
    if (s.length <= 1) return s;
    return s[0] + '○'.repeat(s.length - 1);
  }

  function renderMemorial() {
    var m = D.memorial;
    if (!m) return;
    $('#memorialLead').textContent = m.lead || '';

    var list = (m.list || []).filter(function (p) {
      return p.familyConsent === true;          // 유족 동의가 없으면 어떤 정보도 내보내지 않습니다
    });

    var host = $('#memorialList');
    if (!list.length) { host.innerHTML = emptyBox(m.emptyMessage); return; }

    host.innerHTML = list.map(function (p, i) {
      var vis = p.visibility || 'private';
      var shown = vis === 'public' ? esc(p.name)
                : vis === 'initial' ? esc(maskName(p.name))
                : '비공개';
      var photo = (vis !== 'private' && p.photo)
        ? '<img src="' + esc(p.photo) + '" alt="">'
        : '<span class="mcard__mark" aria-hidden="true"></span>';

      return '<article class="mcard reveal" data-i="' + i + '">' +
        '<figure class="mcard__photo">' + photo + '</figure>' +
        '<div class="mcard__body">' +
          '<p class="mcard__no">No. ' + esc(p.no) + '</p>' +
          '<h3 class="mcard__name">' + shown + '</h3>' +
          '<p class="mcard__years">' + esc(p.joinedYear) + ' — ' + esc(p.passedYear) + '</p>' +
          (p.epitaph ? '<p class="mcard__epitaph">“' + esc(p.epitaph) + '”</p>' : '') +
          ((p.tributes && p.tributes.length)
            ? '<ul class="mcard__tributes">' + p.tributes.map(function (t) {
                return '<li><span>' + esc(t.by) + '</span>' + esc(t.text) + '</li>';
              }).join('') + '</ul>' : '') +
          (m.flowersEnabled
            ? '<button class="flower" data-i="' + i + '">헌화 <b>' + (p.flowers || 0) + '</b></button>'
            : '') +
        '</div></article>';
    }).join('');

    if (!m.flowersEnabled) return;

    // 헌화 — 이 브라우저에만 저장됩니다 (여러 사람의 합계가 아닙니다)
    var KEY = 'ulsan-honor-flowers';
    var local = {};
    try { local = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { local = {}; }

    $$('.flower', host).forEach(function (btn) {
      var i = btn.dataset.i;
      var base = list[i].flowers || 0;
      var mine = local[list[i].no] || 0;
      var paint = function () { btn.innerHTML = '헌화 <b>' + (base + mine) + '</b>'; };
      paint();
      btn.classList.toggle('is-on', mine > 0);
      btn.addEventListener('click', function () {
        mine = mine ? 0 : 1;
        local[list[i].no] = mine;
        try { localStorage.setItem(KEY, JSON.stringify(local)); } catch (e) { /* 저장 불가해도 화면은 동작 */ }
        btn.classList.toggle('is-on', mine > 0);
        paint();
      });
    });
  }

  /* ─────────────────────────────────────────────────
     나눔 스토리
     ───────────────────────────────────────────────── */
  function renderStories() {
    var s = D.stories;
    if (!s) return;
    var list = (s.list || []).filter(function (x) { return x.consent === true; });
    var host = $('#storiesList');
    if (!list.length) { host.innerHTML = emptyBox(s.emptyMessage); return; }

    host.innerHTML = list.map(function (x) {
      return '<article class="story reveal">' +
        (x.photo ? '<figure class="story__photo"><img src="' + esc(x.photo) + '" alt=""></figure>' : '') +
        '<div class="story__body">' +
          '<p class="story__meta">' + esc(x.name) + ' · ' + esc(x.joinedYear) + '년 가입</p>' +
          '<h3 class="story__headline">' + esc(x.headline) + '</h3>' +
          (x.quote ? '<blockquote class="story__quote">' + esc(x.quote) + '</blockquote>' : '') +
          '<p class="story__text">' + esc(x.body) + '</p>' +
        '</div></article>';
    }).join('');
  }

  /* ─────────────────────────────────────────────────
     울산 기록관
     ───────────────────────────────────────────────── */
  function renderLedger(rows) {
    var totalNew = rows.reduce(function (a, r) { return a + r.newMembers; }, 0);
    var totalAmt = rows.reduce(function (a, r) { return a + r.amount; }, 0);
    $('#ledger').innerHTML =
      '<thead><tr><th>연도</th><th>신규 가입</th><th>누적 회원</th><th>신규 약정 (억원)</th><th>증감</th></tr></thead><tbody>' +
      rows.map(function (r, i) {
        var prev = i ? rows[i - 1].newMembers : null;
        var d = r.newMembers - prev;
        var diff = prev === null ? '–' : (d > 0 ? '▲ ' + d : (d < 0 ? '▼ ' + Math.abs(d) : '–'));
        return '<tr><td>' + r.year + '년</td><td class="num">' + r.newMembers + '명</td>' +
          '<td class="num">' + r.members + '명</td><td class="num">' + r.amount.toFixed(1) + '</td>' +
          '<td class="num">' + diff + '</td></tr>';
      }).join('') +
      '</tbody><tfoot><tr><td>합계</td><td class="num">' + totalNew + '명</td>' +
      '<td class="num">' + rows[rows.length - 1].members + '명</td>' +
      '<td class="num">' + totalAmt.toFixed(1) + '</td><td>–</td></tr></tfoot>';
  }

  function initArchive() {
    var u = D.ulsan;
    if (!u || !u.rows || !u.rows.length) return;
    var drawn = {};
    var draw = function (id) {
      if (drawn[id]) return;
      if (id === 'panel-members') lineChart($('#chartMembers'), u.rows, 'members', {
        round: 20, suffix: '명', label: '울산 누적 회원 수 추이',
        tip: function (r) { return r.year + '년 말 누적 ' + r.members + '명 (신규 ' + r.newMembers + '명)'; }
      });
      if (id === 'panel-amount') barChart($('#chartAmount'), u.rows, 'amount', {
        unit: '단위: 억원', label: '울산 연간 신규 약정 금액',
        tip: function (r) { return r.year + '년 신규 약정 ' + r.amount + '억원'; }
      });
      if (id === 'panel-table') renderLedger(u.rows);
      drawn[id] = true;
    };
    draw('panel-members');
    bindTabs($('#archive'), draw);

    var src = u.asOf + ' · 출처: 울산사회복지공동모금회 내부 자료 및 언론 보도';
    if (u.verified === false) src = '※ 검증 전 임시 수치입니다. ' + u.note + '<br>' + src;
    $('#archiveSource').innerHTML = src;
  }

  /* ─────────────────────────────────────────────────
     소식
     ───────────────────────────────────────────────── */
  function newsItems(data) {
    if (!data || !data.list || !data.list.length) return emptyBox(data && data.emptyMessage);
    return data.list.slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    }).map(function (n) {
      return '<li class="newsitem"><a href="' + esc(n.url) + '" target="_blank" rel="noopener">' +
        '<span class="newsitem__date">' + esc(n.date) + '</span>' +
        '<span class="newsitem__title">' + esc(n.title) + '</span>' +
        '<span class="newsitem__meta">' + esc(n.media) +
          (n.member ? ' · ' + esc(n.member) : '') +
          ((n.tags && n.tags.length) ? ' · ' + n.tags.map(esc).join(' · ') : '') +
        '</span></a></li>';
    }).join('');
  }
  function renderNews() {
    $('#newsHonor').innerHTML = newsItems(D.newsHonor);
    $('#newsWelfare').innerHTML = newsItems(D.newsWelfare);
    bindTabs($('#news'));
  }

  /* ─────────────────────────────────────────────────
     연간 일정 · 자료실 · 유산기부
     ───────────────────────────────────────────────── */
  function renderCalendar() {
    var c = D.calendar;
    if (!c) return;
    $('#calendarLead').textContent =
      c.year + '년 울산 아너 소사이어티와 공동모금회의 주요 일정입니다.';
    $('#calendarList').innerHTML = c.list.map(function (e) {
      return '<li class="calrow reveal">' +
        '<span class="calrow__when">' + e.month + '월' + (e.day ? ' ' + e.day + '일' : ' 중') + '</span>' +
        '<span class="calrow__kind">' + esc(e.kind) + '</span>' +
        '<span class="calrow__body"><strong>' + esc(e.title) + '</strong>' + esc(e.body) + '</span></li>';
    }).join('');
    $('#calendarNote').textContent = c.note || '';
  }

  function renderDownloads() {
    var d = D.downloads;
    if (!d) return;
    $('#downloadsNote').textContent = d.note || '';
    $('#filesList').innerHTML = d.list.map(function (f) {
      var inner =
        '<span class="file__type">' + esc(f.type) + '</span>' +
        '<strong class="file__title">' + esc(f.title) + '</strong>' +
        '<span class="file__desc">' + esc(f.desc) + '</span>' +
        '<span class="file__cta">' + (f.ready ? '내려받기 ↓' : '준비 중') + '</span>';
      return f.ready
        ? '<a class="file reveal" href="' + esc(f.file) + '" download>' + inner + '</a>'
        : '<div class="file file--off reveal">' + inner + '</div>';
    }).join('');
  }

  function renderLegacy() {
    var l = D.legacy;
    if (!l) return;
    $('#legacyLead').textContent = l.lead;
    $('#legacyTypes').innerHTML = l.types.map(function (t) {
      return '<article class="ltype reveal"><h3>' + esc(t.title) + '</h3><p>' + esc(t.body) + '</p></article>';
    }).join('');
    $('#legacySteps').innerHTML = l.steps.map(function (s) {
      return '<li><span class="steps__n">' + s.n + '</span><strong>' + esc(s.title) + '</strong>' +
        '<em>' + esc(s.body) + '</em></li>';
    }).join('');
    $('#legacyCaution').textContent = l.caution;
  }

  /* ─────────────────────────────────────────────────
     FAQ
     ───────────────────────────────────────────────── */
  function renderFaq() {
    if (!D.faq) return;
    var wrap = $('#faqList');
    wrap.innerHTML = D.faq.list.map(function (f, i) {
      return '<div class="faq__item">' +
        '<button class="faq__q" aria-expanded="false" aria-controls="faq-a-' + i + '">' +
          '<span class="faq__mark">Q</span><span>' + esc(f.q) + '</span></button>' +
        '<div class="faq__a" id="faq-a-' + i + '"><div class="faq__a-inner">' + esc(f.a) + '</div></div>' +
      '</div>';
    }).join('');

    $$('.faq__q', wrap).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.parentNode, panel = btn.nextElementSibling;
        var open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
      });
    });
  }

  /* ─────────────────────────────────────────────────
     담당자 · 문의
     ───────────────────────────────────────────────── */
  function renderProfile() {
    var p = D.profile;
    if (!p) return;
    $('#profileTitle').textContent = '담당자 ' + p.name + '입니다';
    $('#profileCaption').textContent = p.name + ' · ' + p.title;
    $('#profileGreeting').innerHTML = p.greeting.map(function (t) {
      return '<p class="person__text">' + t + '</p>';   // 인사말은 강조 태그를 허용합니다
    }).join('');
    $('#profileMeta').innerHTML =
      '<div><dt>소속</dt><dd>' + esc(p.org) + '</dd></div>' +
      '<div><dt>직급</dt><dd>' + esc(p.title) + '</dd></div>' +
      '<div><dt>담당</dt><dd>' + esc(p.duty) + '</dd></div>';

    var img = $('#profileImg');
    img.alt = p.name + ' ' + p.title;
    img.src = p.photo;
    var fail = function () { img.closest('.person__photo').classList.add('is-fallback'); };
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  }

  function renderContact() {
    var c = D.contact;
    if (!c) return;
    $('#contactLead').textContent = c.lead;
    var mailto = 'mailto:' + c.email +
      '?subject=' + encodeURIComponent(c.emailSubject) +
      '&body=' + encodeURIComponent(c.emailBody);
    $('#contactCards').innerHTML =
      '<a class="ccard" href="' + esc(c.phoneHref) + '">' +
        '<span class="ccard__label">전화 · 문자</span>' +
        '<strong class="ccard__value">' + esc(c.phone) + '</strong>' +
        '<span class="ccard__sub">' + esc(c.phoneSub) + '</span></a>' +
      '<a class="ccard" href="' + esc(mailto) + '">' +
        '<span class="ccard__label">이메일</span>' +
        '<strong class="ccard__value">' + esc(c.email) + '</strong>' +
        '<span class="ccard__sub">' + esc(c.emailSub) + '</span></a>';
  }

  /* ── 시작 ────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initCurtain();
    renderAbout();
    renderImpact();
    renderBenefits();
    initWall();
    renderMemorial();
    renderStories();
    initArchive();
    renderNews();
    renderCalendar();
    renderDownloads();
    renderLegacy();
    renderFaq();
    renderProfile();
    renderContact();
    initChrome();     // 섹션 점은 내용이 다 채워진 뒤에 계산합니다
    initReveal();
  });
})();
