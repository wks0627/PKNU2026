/* =========================================================
   main.js — 울산 아너 소사이어티 아카이브

   구성
     1) 순수 함수       — 계산·필터·포맷. DOM 을 건드리지 않음
     2) DOM 도우미      — 화면에 붙이는 얇은 층
     3) 라우터 / 인트로
     4) 화면별 렌더러
   외부 라이브러리 없음. 파일을 더블클릭해도 동작합니다.
   ========================================================= */
(function () {
  'use strict';

  var D = window.HONOR || {};

  /* ═══════════════════════════════════════════
     1) 순수 함수
     ═══════════════════════════════════════════ */

  var range = function (from, to) {
    var out = [];
    for (var i = from; i <= to; i++) out.push(i);
    return out;
  };

  var pipe = function () {
    var fns = Array.prototype.slice.call(arguments);
    return function (x) { return fns.reduce(function (v, f) { return f(v); }, x); };
  };

  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  /* 숫자 → 사람이 읽는 금액 */
  var won = function (n) { return Number(n || 0).toLocaleString('ko-KR') + '원'; };

  var eok = function (n) {
    var v = Number(n || 0) / 100000000;
    return (Number.isInteger(v) ? v : v.toFixed(2).replace(/\.?0+$/, '')) + '억원';
  };

  /* 검색어 하나가 여러 필드 중 하나라도 걸리는가 */
  var matches = function (q, fields) {
    if (!q) return true;
    var needle = q.toLowerCase();
    return fields.some(function (f) {
      return String(f == null ? '' : f).toLowerCase().indexOf(needle) >= 0;
    });
  };

  /* 성함 마스킹 — 홍길동 → 홍○○ */
  var maskName = function (name) {
    var s = String(name || '').trim();
    return s.length <= 1 ? s : s[0] + '○'.repeat(s.length - 1);
  };

  /* 공개 수준에 따라 보여줄 이름을 결정 */
  var displayName = function (visibility, name) {
    if (visibility === 'public') return name || '비공개';
    if (visibility === 'initial') return maskName(name);
    return '비공개';
  };

  /* ── 약정 계산 ──────────────────────────────
     총액, 기간, 최초 가입금액으로 연도별 납입 계획을 만듭니다.
     남은 금액을 남은 해로 균등 분할합니다. */
  var buildSchedule = function (total, years, first) {
    var t = Math.max(0, Number(total) || 0);
    var y = Math.min(5, Math.max(1, Math.floor(Number(years) || 1)));
    var f = Math.min(t, Math.max(0, Number(first) || 0));

    if (y === 1) return [{ year: 1, amount: t }];

    var rest = t - f;
    var per = Math.round(rest / (y - 1) / 10000) * 10000;   // 만원 단위로 정리
    var rows = [{ year: 1, amount: f }];
    var paid = f;

    for (var i = 2; i <= y; i++) {
      var amount = (i === y) ? (t - paid) : per;            // 마지막 해가 잔액을 흡수
      rows.push({ year: i, amount: amount });
      paid += amount;
    }
    return rows;
  };

  /* 연간 납입액 → 세액공제 추정 (구간별 누진)
     예) 1천만원 이하 15%, 초과분 30%
         2,250만원 → 1,000만×15% + 1,250만×30% = 525만원 */
  var taxCredit = function (amount, rates) {
    var total = Math.max(0, Number(amount) || 0);
    var floor = 0;
    return (rates || []).reduce(function (sum, band) {
      var slice = Math.max(0, Math.min(total, band.upto) - floor);
      floor = band.upto;
      return sum + slice * band.rate;
    }, 0);
  };

  /* 기사 필터 — 범위 + 검색어 */
  var filterNews = function (items, state) {
    return items.filter(function (it) {
      if (state.scope !== 'all' && it.scope !== state.scope) return false;
      return matches(state.q, [it.title, it.media, it.scope, it.member]);
    }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  };

  /* 명패 목록 만들기 — 1호부터 total 호까지.
     records 에 있는 호수만 내용이 채워지고 나머지는 빈 명패가 됩니다. */
  var buildPlates = function (total, records, keyOf) {
    var byNo = (records || []).reduce(function (m, r) { m[keyOf(r)] = r; return m; }, {});
    return range(1, total || 0).map(function (no) {
      var rec = byNo[no];
      return rec ? Object.assign({ no: no }, rec) : { no: no };
    });
  };

  var filterPlates = function (plates, state) {
    return plates.filter(function (p) {
      if (state.only === 'filled' && !p.filled) return false;
      if (state.only === 'empty' && p.filled) return false;
      return matches(state.q, [p.no, p.label, p.sub]);
    });
  };

  /* ═══════════════════════════════════════════
     2) DOM 도우미
     ═══════════════════════════════════════════ */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var html = function (sel, markup) { var n = $(sel); if (n) n.innerHTML = markup; return n; };
  var text = function (sel, t) { var n = $(sel); if (n) n.textContent = t == null ? '' : t; return n; };

  var emptyBox = function (msg) { return '<p class="empty">' + esc(msg || '준비 중입니다.') + '</p>'; };

  var store = {
    get: function (k, fallback) {
      try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch (e) { return fallback; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 불가해도 화면은 동작 */ }
    }
  };

  /* ═══════════════════════════════════════════
     3) 라우터 · 인트로 · 공통 UI
     ═══════════════════════════════════════════ */
  var VIEWS = ['home', 'status', 'hall', 'memorial', 'desk', 'news', 'me'];

  var currentView = function () {
    var id = (location.hash || '#home').replace(/^#/, '').split('?')[0];
    return VIEWS.indexOf(id) >= 0 ? id : 'home';
  };

  var io = null;
  var observeReveal = function (scope) {
    var items = $$('.reveal', scope || document);
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    }
    items.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
  };

  var drawn = {};
  var showView = function (id, first) {
    $$('.view').forEach(function (v) { v.classList.remove('is-active'); });
    var view = $('#view-' + id);
    if (!view) return;
    view.classList.add('is-active');

    $$('.mainnav a').forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
    });

    if (!first) window.scrollTo({ top: 0, behavior: 'auto' });
    observeReveal(view);
    drawCharts(id);
    syncChrome();
  };

  var initRouter = function () {
    window.addEventListener('hashchange', function () { showView(currentView()); });
    showView(currentView(), true);
  };

  var topbar, progBar, toTop;
  var syncChrome = function () {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progBar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    var view = currentView();
    topbar.classList.toggle('is-stuck', y > 40);
    topbar.classList.toggle('on-hero', view === 'home' && y < window.innerHeight - 80);
    // 어두운 화면 위에서는 상단 바 글자를 밝게
    topbar.classList.toggle('on-dark', view === 'hall' || view === 'memorial');
    toTop.classList.toggle('is-on', y > window.innerHeight * 0.7);
  };

  var initChrome = function () {
    topbar = $('#topbar');
    progBar = $('#progress').firstElementChild;
    toTop = $('#toTop');

    var nav = $('#mainnav');
    var btn = $('#navToggle');

    window.addEventListener('scroll', syncChrome, { passive: true });
    window.addEventListener('resize', syncChrome);

    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
    $$('.mainnav a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    syncChrome();
  };

  /* 탭 */
  var bindTabs = function (scope, onShow) {
    $$('.tab', scope).forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('.tab', scope).forEach(function (t) {
          t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false');
        });
        $$('.panel', scope).forEach(function (p) { p.classList.remove('is-active'); });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        if (onShow) onShow(tab.dataset.panel);
        $('#' + tab.dataset.panel).classList.add('is-active');
      });
    });
  };

  /* 상세 시트 */
  var openSheet = function (markup) {
    html('#sheetBody', markup);
    var sheet = $('#sheet');
    sheet.hidden = false;
    requestAnimationFrame(function () { sheet.classList.add('is-open'); });
    document.body.classList.add('is-locked');
  };
  var closeSheet = function () {
    var sheet = $('#sheet');
    sheet.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(function () { sheet.hidden = true; }, 300);
  };
  var initSheet = function () {
    $$('[data-close]').forEach(function (n) { n.addEventListener('click', closeSheet); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet();
    });
  };

  /* ═══════════════════════════════════════════
     차트 (SVG 직접 생성)
     ═══════════════════════════════════════════ */
  var NS = 'http://www.w3.org/2000/svg';
  var svgEl = function (name, attrs, t) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (t != null) n.textContent = t;
    return n;
  };
  var W = 1000, H = 380, PAD = { t: 34, r: 24, b: 48, l: 62 };
  var PLOT = { w: W - PAD.l - PAD.r, h: H - PAD.t - PAD.b };
  var LATIN = 'Cormorant Garamond, serif';

  var axes = function (svg, rows, max, suffix, dark) {
    var lc = dark ? '#9b9183' : '#6f665a';
    var gc = dark ? 'rgba(239,233,223,.14)' : 'rgba(31,26,21,.12)';
    range(0, 4).forEach(function (i) {
      var y = PAD.t + PLOT.h - (PLOT.h / 4) * i;
      svg.appendChild(svgEl('line', { x1: PAD.l, x2: PAD.l + PLOT.w, y1: y, y2: y, stroke: gc, 'stroke-width': 1 }));
      svg.appendChild(svgEl('text', { x: PAD.l - 14, y: y + 5, 'text-anchor': 'end',
        fill: lc, 'font-size': 14, 'font-family': LATIN }, Math.round(max / 4 * i) + (suffix || '')));
    });
    var step = PLOT.w / rows.length;
    rows.forEach(function (r, i) {
      svg.appendChild(svgEl('text', { x: PAD.l + step * i + step / 2, y: PAD.t + PLOT.h + 28,
        'text-anchor': 'middle', fill: lc, 'font-size': 14, 'font-family': LATIN }, String(r.year)));
    });
    return step;
  };

  var lineChart = function (host, rows, key, opt) {
    if (!host || !rows || !rows.length) return;
    opt = opt || {};
    var round = opt.round || 20;
    var max = Math.ceil(Math.max.apply(null, rows.map(function (r) { return r[key]; })) / round) * round;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opt.label || '' });
    var step = axes(svg, rows, max, opt.suffix, opt.dark);

    var pts = rows.map(function (r, i) {
      return [PAD.l + step * i + step / 2, PAD.t + PLOT.h - (r[key] / max) * PLOT.h];
    });
    svg.appendChild(svgEl('path', {
      d: pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' '),
      fill: 'none', stroke: '#8d6c33', 'stroke-width': 1.4
    }));
    rows.forEach(function (r, i) {
      var p = pts[i], g = svgEl('g');
      g.appendChild(svgEl('circle', { cx: p[0], cy: p[1], r: 3.5,
        fill: opt.dark ? '#1c1713' : '#faf7f2', stroke: '#8d6c33', 'stroke-width': 1.4 }));
      g.appendChild(svgEl('text', { x: p[0], y: p[1] - 18, 'text-anchor': 'middle',
        fill: opt.dark ? '#efe9df' : '#1f1a15', 'font-size': 17, 'font-family': LATIN }, r[key]));
      g.appendChild(svgEl('title', {}, opt.tip ? opt.tip(r) : (r.year + ': ' + r[key])));
      svg.appendChild(g);
    });
    host.innerHTML = ''; host.appendChild(svg);
  };

  var barChart = function (host, rows, key, opt) {
    if (!host || !rows || !rows.length) return;
    opt = opt || {};
    var max = Math.ceil(Math.max.apply(null, rows.map(function (r) { return r[key]; })) / 5) * 5;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opt.label || '' });
    var step = axes(svg, rows, max, '', opt.dark);
    var bw = Math.min(30, step * 0.34);

    rows.forEach(function (r, i) {
      var h = (r[key] / max) * PLOT.h;
      var x = PAD.l + step * i + step / 2 - bw / 2;
      var y = PAD.t + PLOT.h - h;
      var last = i === rows.length - 1;
      var g = svgEl('g');
      g.appendChild(svgEl('rect', { x: x, y: y, width: bw, height: h,
        fill: last ? '#9e1b23' : '#c9a158', opacity: last ? '.9' : '.72' }));
      g.appendChild(svgEl('text', { x: x + bw / 2, y: y - 14, 'text-anchor': 'middle',
        fill: opt.dark ? '#efe9df' : '#1f1a15', 'font-size': 17, 'font-family': LATIN }, r[key]));
      g.appendChild(svgEl('title', {}, opt.tip ? opt.tip(r) : (r.year + ': ' + r[key])));
      svg.appendChild(g);
    });
    host.innerHTML = ''; host.appendChild(svg);
  };

  /* 숨겨진 요소는 크기가 0이라 화면이 열릴 때 그립니다 */
  function drawCharts(view) {
    if (view !== 'status' || drawn.status) return;
    var u = D.ulsan;
    if (u) lineChart($('#chartMembers'), u.rows, 'members', {
      round: 20, suffix: '명', label: '울산 누적 회원 수',
      tip: function (r) { return r.year + '년 말 누적 ' + r.members + '명 (신규 ' + r.newMembers + '명)'; }
    });
    drawn.status = true;
  }

  /* ═══════════════════════════════════════════
     4-A) 홈
     ═══════════════════════════════════════════ */
  var GATES = [
    { href: '#status',   n: '01', title: '현황과 연혁',      desc: '인용 가능한 숫자와 제도 근거' },
    { href: '#hall',     n: '02', title: '명예의전당',       desc: '1호부터 150호까지 연번 명패' },
    { href: '#memorial', n: '03', title: '메모리얼 아너스',  desc: '먼저 떠나신 회원을 기리는 추모 공간' },
    { href: '#desk',     n: '04', title: '상담 데스크',      desc: '약정 계산기 · 체크리스트 · 대응 메모 · 서식' },
    { href: '#news',     n: '05', title: '복지동향',         desc: '아너 소사이어티 기부 뉴스' },
    { href: '#me',       n: '06', title: '담당자',           desc: '기부자께 보여드리는 소개 화면' }
  ];

  var renderHome = function () {
    html('#gates', GATES.map(function (g) {
      return '<a class="gate reveal" href="' + g.href + '">' +
        '<span class="gate__n">' + g.n + '</span>' +
        '<h3>' + esc(g.title) + '</h3><p>' + esc(g.desc) + '</p>' +
        '<span class="gate__go">열기</span></a>';
    }).join(''));

    var n = D.national, u = D.ulsan, hall = D.hall;
    var cells = [];
    if (u) cells.push({ value: String(u.rows[u.rows.length - 1].members), unit: '명', label: '울산 누적 회원' });
    if (hall) cells.push({ value: String(hall.total), unit: '호', label: '명예의전당 명패' });
    if (n) cells = cells.concat(n.figures.slice(0, 2));

    html('#homeFigures', cells.map(function (f) {
      return '<div class="figure"><span class="figure__value">' + esc(f.value) +
        '<small>' + esc(f.unit) + '</small></span>' +
        '<span class="figure__label">' + esc(f.label) + '</span></div>';
    }).join(''));
    text('#homeFiguresNote', (n ? n.asOf + ' · 출처: ' + n.source : ''));
  };

  /* 영상 플레이어
     처음에는 썸네일만 올려두고, 누를 때 유튜브를 불러옵니다.
     (페이지를 열자마자 외부 요청이 나가지 않게) */
  var initPlayer = function () {
    var host = $('#player');
    if (!host) return;

    var id = host.dataset.yt;
    var title = host.dataset.title || '영상';
    var watch = 'https://www.youtube.com/watch?v=' + id;

    /* 파일을 직접 열었을 때(file://)는 출처가 없어서 유튜브가 삽입 재생을 막습니다.
       그 경우에는 유튜브에서 바로 열어 드립니다. */
    var canEmbed = location.protocol === 'http:' || location.protocol === 'https:';

    /* maxres 썸네일이 없는 영상도 있어 hq 로 대비합니다 */
    var poster =
      '<button class="player__poster" aria-label="' + esc(title) + ' 재생">' +
        '<img class="player__thumb" src="https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg" alt="">' +
        '<span class="player__play" aria-hidden="true"></span>' +
        '<span class="player__label">' + esc(title) + '</span>' +
        (canEmbed ? '' : '<span class="player__out">유튜브에서 열기</span>') +
      '</button>';

    host.innerHTML = poster;

    var thumb = $('.player__thumb', host);
    thumb.addEventListener('error', function () {
      if (thumb.dataset.fallback) { thumb.style.display = 'none'; return; }
      thumb.dataset.fallback = '1';
      thumb.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
    });

    $('.player__poster', host).addEventListener('click', function () {
      if (!canEmbed) { window.open(watch, '_blank', 'noopener'); return; }
      host.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" ' +
        'title="' + esc(title) + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; ' +
        'encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      host.classList.add('is-playing');
    });

    text('#playerNote', canEmbed
      ? '썸네일을 누르면 이 화면에서 바로 재생됩니다. 누르기 전까지는 외부로 요청이 나가지 않습니다.'
      : '파일을 직접 열면 유튜브가 삽입 재생을 막습니다. 눌러 주시면 유튜브에서 새 창으로 열어 드립니다. ' +
        '웹에 올린 뒤(GitHub Pages 등)에는 이 화면에서 바로 재생됩니다.');
  };

  /* ═══════════════════════════════════════════
     4-B) 상담 데스크
     ═══════════════════════════════════════════ */
  var renderCalc = function () {
    var desk = D.desk, tax = D.honor && D.honor.tax;
    if (!desk) return;
    var c = desk.calc;

    var elTotal = $('#calcTotal'), elYears = $('#calcYears'), elFirst = $('#calcFirst');
    elTotal.value = c.defaultTotal;
    elYears.value = c.defaultYears;
    elFirst.value = c.minFirst;

    html('#calcPresets', c.presets.map(function (p, i) {
      return '<button type="button" class="chip" data-i="' + i + '">' + esc(p.label) + '</button>';
    }).join(''));

    var paint = function () {
      var total = Number(elTotal.value) || 0;
      var years = Math.min(5, Math.max(1, Number(elYears.value) || 1));
      var first = Number(elFirst.value) || 0;

      var rows = buildSchedule(total, years, first);
      var credits = rows.map(function (r) {
        return tax ? taxCredit(r.amount, tax.rates) : 0;
      });
      var totalCredit = credits.reduce(function (a, b) { return a + b; }, 0);

      text('#calcTotalHint', eok(total));
      text('#calcFirstHint', '최소 ' + won(c.minFirst) + (first < c.minFirst ? ' — 기준 미달' : ''));
      $('#calcFirst').classList.toggle('is-warn', first < c.minFirst && years > 1);

      html('#calcOut',
        '<div class="out"><span class="out__k">연 평균 납입</span>' +
          '<strong class="out__v">' + won(Math.round(total / years)) + '</strong></div>' +
        '<div class="out"><span class="out__k">월 환산</span>' +
          '<strong class="out__v">' + won(Math.round(total / years / 12)) + '</strong></div>' +
        '<div class="out out--accent"><span class="out__k">세액공제 추정 (기간 합계)</span>' +
          '<strong class="out__v">' + won(Math.round(totalCredit)) + '</strong></div>' +
        '<div class="out"><span class="out__k">실부담 추정</span>' +
          '<strong class="out__v">' + won(Math.round(total - totalCredit)) + '</strong></div>'
      );

      html('#calcSchedule',
        '<thead><tr><th>회차</th><th>납입액</th><th>세액공제 추정</th><th>누적</th></tr></thead><tbody>' +
        rows.map(function (r, i) {
          var cum = rows.slice(0, i + 1).reduce(function (a, x) { return a + x.amount; }, 0);
          return '<tr><td>' + r.year + '년차</td>' +
            '<td class="num">' + won(r.amount) + '</td>' +
            '<td class="num">' + won(Math.round(credits[i])) + '</td>' +
            '<td class="num">' + won(cum) + '</td></tr>';
        }).join('') +
        '</tbody><tfoot><tr><td>합계</td><td class="num">' + won(total) + '</td>' +
        '<td class="num">' + won(Math.round(totalCredit)) + '</td><td class="num">' + won(total) + '</td></tr></tfoot>'
      );
    };

    [elTotal, elYears, elFirst].forEach(function (n) { n.addEventListener('input', paint); });
    $$('#calcPresets .chip').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = c.presets[b.dataset.i];
        elTotal.value = p.total;
        elYears.value = p.years;
        elFirst.value = p.years === 1 ? p.total : c.minFirst;
        $$('#calcPresets .chip').forEach(function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
        paint();
      });
    });

    text('#calcTaxNote', tax ? tax.note : '');
    paint();
  };

  var renderChecklist = function () {
    var desk = D.desk;
    if (!desk) return;
    var KEY = 'desk-checks';
    var saved = store.get(KEY, {});

    html('#checks', desk.checklist.map(function (group, gi) {
      return '<section class="checkgroup reveal"><h3>' + esc(group.step) + '</h3><ul>' +
        group.items.map(function (item, ii) {
          var id = gi + '-' + ii;
          return '<li><label><input type="checkbox" data-id="' + id + '"' +
            (saved[id] ? ' checked' : '') + '><span>' + esc(item) + '</span></label></li>';
        }).join('') + '</ul></section>';
    }).join(''));

    $$('#checks input').forEach(function (box) {
      box.addEventListener('change', function () {
        saved[box.dataset.id] = box.checked;
        store.set(KEY, saved);
      });
    });
    $('#checkReset').addEventListener('click', function () {
      store.set(KEY, {});
      $$('#checks input').forEach(function (b) { b.checked = false; });
    });
  };

  var renderObjections = function () {
    var desk = D.desk;
    if (!desk) return;
    html('#objections', desk.objections.map(function (o) {
      return '<article class="obj reveal"><h3>“' + esc(o.q) + '”</h3><p>' + esc(o.a) + '</p></article>';
    }).join(''));
  };

  var renderFaq = function () {
    if (!D.faq) return;
    var list = D.faq.list;

    var paint = function (q) {
      var found = list.filter(function (f) { return matches(q, [f.q, f.a]); });
      text('#faqCount', found.length + ' / ' + list.length);
      html('#faqList', found.length ? found.map(function (f) {
        var i = list.indexOf(f);
        return '<div class="faq__item">' +
          '<button class="faq__q" aria-expanded="false" aria-controls="fa-' + i + '">' +
            '<span class="faq__mark">Q</span><span>' + esc(f.q) + '</span></button>' +
          '<div class="faq__a" id="fa-' + i + '"><div class="faq__a-inner">' + esc(f.a) + '</div></div></div>';
      }).join('') : emptyBox('찾는 질문이 없습니다.'));

      $$('#faqList .faq__q').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var item = btn.parentNode, panel = btn.nextElementSibling;
          var open = item.classList.toggle('is-open');
          btn.setAttribute('aria-expanded', String(open));
          panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
        });
      });
    };

    $('#faqQ').addEventListener('input', function () { paint(this.value.trim()); });
    paint('');
  };

  /* ═══════════════════════════════════════════
     4-C) 명패 벽 — 명예의전당과 메모리얼이 함께 씁니다
     ═══════════════════════════════════════════ */
  var WALL_FILTERS = function (filledLabel) {
    return [
      { key: 'all',    label: '전체' },
      { key: 'filled', label: filledLabel },
      { key: 'empty',  label: '미등록' }
    ];
  };

  /* 명패 한 장 = 사진 자리 + 그 아래 황동(또는 은) 명패.
     책자에서 “n호 홍길동”을 한 장씩 넘기던 것을 한 벽에 펼친 모양입니다. */
  var plateMarkup = function (p, bg) {
    var hasPhoto = !!p.photo;
    var img = p.photo || bg;
    return '<button class="plate' + (p.filled ? ' plate--filled' : '') +
      (hasPhoto ? ' plate--photo' : '') + '" data-no="' + p.no + '">' +
      '<span class="plate__frame"' + (img ? ' style="--bg:url(' + esc(img) + ')"' : '') + '>' +
        (hasPhoto ? '' : '<span class="plate__empty" aria-hidden="true">사진</span>') +
      '</span>' +
      '<span class="plate__tag">' +
        '<span class="plate__no">' + p.no + '호</span>' +
        '<span class="plate__name">' + esc(p.label) + '</span>' +
        '<span class="plate__year">' + esc(p.sub || '—') + '</span>' +
      '</span>' +
      '</button>';
  };

  /* 벽 하나를 통째로 꾸려 줍니다. 두 화면이 같은 함수를 씁니다. */
  var mountWall = function (opt) {
    var grid = $(opt.grid);
    if (!grid) return;
    var plates = opt.plates;
    var state = { q: '', only: 'all' };

    html(opt.filters, WALL_FILTERS(opt.filledLabel).map(function (f, i) {
      return '<button class="chip' + (i === 0 ? ' is-active' : '') + '" data-key="' + f.key + '">' +
        esc(f.label) + '</button>';
    }).join(''));

    var paint = function () {
      var found = filterPlates(plates, state);
      text(opt.count, found.length + ' / ' + plates.length + '호');
      html(opt.grid, found.length
        ? found.map(function (p) { return plateMarkup(p, opt.placeholder); }).join('')
        : emptyBox('조건에 맞는 명패가 없습니다.'));

      $$('.plate', $(opt.grid)).forEach(function (btn) {
        btn.addEventListener('click', function () {
          openSheet(opt.detail(plates[Number(btn.dataset.no) - 1]));
          if (opt.afterOpen) opt.afterOpen(plates[Number(btn.dataset.no) - 1]);
        });
      });
    };

    $(opt.search).addEventListener('input', function () { state.q = this.value.trim(); paint(); });
    $$('.chip', $(opt.filters)).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.chip', $(opt.filters)).forEach(function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
        state.only = b.dataset.key;
        paint();
      });
    });

    text(opt.note, opt.noteText || '');
    paint();
  };

  /* ── 명예의전당 ───────────────────────────── */
  var renderHall = function () {
    var cfg = D.hall;
    if (!cfg) return;

    var plates = buildPlates(cfg.total, cfg.plates, function (r) { return r.no; })
      .map(function (p) {
        return {
          no: p.no, photo: p.photo, raw: p,
          filled: !!p.name,
          label: p.name ? p.name : '비공개',
          sub: p.year ? String(p.year) : '—'
        };
      });

    mountWall({
      grid: '#hallGrid', search: '#hallQ', filters: '#hallFilters',
      count: '#hallCount',
      placeholder: cfg.placeholder, plates: plates, filledLabel: '성함 공개',
      detail: function (p) {
        var r = p.raw || {};
        return '<p class="sheet__kicker">울산 아너 명예의전당</p>' +
          '<h2 class="sheet__title" id="sheetTitle">' + p.no + '호</h2>' +
          '<figure class="sheet__photo" style="--bg:url(' + esc(r.photo || cfg.placeholder) + ')"></figure>' +
          '<dl class="deflist">' +
            '<div><dt>성함</dt><dd>' + (r.name ? esc(r.name) : '비공개 (공개 동의 전)') + '</dd></div>' +
            '<div><dt>가입 연도</dt><dd>' + (r.year ? esc(r.year) + '년' : '미등록') + '</dd></div>' +
            '<div><dt>지정 분야</dt><dd>' + (r.field ? esc(r.field) : '미등록') + '</dd></div>' +
            (r.memo ? '<div><dt>담당자 메모</dt><dd>' + esc(r.memo) + '</dd></div>' : '') +
          '</dl>' +
          (r.name ? '' : '<p class="sheet__hint">사진과 상세 정보는 data/hall.js 의 plates 에 추가하면 이 화면에 표시됩니다.</p>');
      }
    });
  };

  /* 메뉴별 대표 이미지 — 원본 그대로, 자르지 않습니다 */
  var renderCovers = function () {
    var covers = D.covers || {};
    Object.keys(covers).forEach(function (key) {
      var host = $('#cover-' + key);
      var c = covers[key];
      if (!host || !c) return;
      host.innerHTML =
        '<figure class="cover">' +
          '<img class="cover__img" src="' + esc(c.file) + '" alt="' + esc(c.alt) + '">' +
          (c.caption ? '<figcaption class="cover__cap">' + esc(c.caption) + '</figcaption>' : '') +
        '</figure>';
    });
  };

  /* 흰 국화를 그립니다 — 세 겹의 꽃잎을 각도만 바꿔 반복 */
  var drawChrysanthemum = function () {
    var svg = $('.mum');
    if (!svg) return;
    var rings = [
      { sel: '.mum__ring--1', n: 16, r0: 26, r1: 96,  w: 7,   o: .34 },
      { sel: '.mum__ring--2', n: 22, r0: 34, r1: 136, w: 5.5, o: .24 },
      { sel: '.mum__ring--3', n: 28, r0: 44, r1: 176, w: 4,   o: .15 }
    ];
    rings.forEach(function (ring, ri) {
      var g = $(ring.sel, svg);
      if (!g) return;
      g.setAttribute('stroke-width', ring.w);
      g.setAttribute('opacity', ring.o);
      g.innerHTML = range(0, ring.n - 1).map(function (i) {
        var a = (i / ring.n) * Math.PI * 2 + (ri * 0.14);
        var curl = ring.r1 * 0.14;                       // 끝이 살짝 말린 꽃잎
        var x0 = 200 + Math.cos(a) * ring.r0;
        var y0 = 200 + Math.sin(a) * ring.r0;
        var x1 = 200 + Math.cos(a) * ring.r1;
        var y1 = 200 + Math.sin(a) * ring.r1;
        var cx = 200 + Math.cos(a + 0.12) * (ring.r1 - curl);
        var cy = 200 + Math.sin(a + 0.12) * (ring.r1 - curl);
        return '<path d="M' + x0.toFixed(1) + ',' + y0.toFixed(1) +
               ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) +
               ' ' + x1.toFixed(1) + ',' + y1.toFixed(1) + '"/>';
      }).join('');
    });
  };

  /* ── 메모리얼 아너스 ─────────────────────── */
  var FLOWER_KEY = 'memorial-flowers';

  var renderMemorial = function () {
    var m = D.memorial;
    if (!m) return;
    text('#memorialLead', m.lead || '');

    // 유족 동의가 없으면 목록을 만드는 단계에서 제외합니다
    var records = (m.list || []).filter(function (p) { return p.familyConsent === true; });

    var plates = buildPlates(m.total, records, function (r) { return r.no; })
      .map(function (p) {
        var has = !!p.familyConsent;
        return {
          no: p.no, raw: p, filled: has,
          photo: (has && p.visibility !== 'private') ? p.photo : null,
          label: has ? displayName(p.visibility || 'private', p.name) : '—',
          sub: has ? (p.joinedYear + '–' + p.passedYear) : '—'
        };
      });

    var mine = store.get(FLOWER_KEY, {});

    mountWall({
      grid: '#memGrid', search: '#memQ', filters: '#memFilters',
      count: '#memCount',
      placeholder: m.placeholder, plates: plates, filledLabel: '추모 기록 있음',
      detail: function (p) {
        var r = p.raw || {};
        if (!r.familyConsent) {
          return '<p class="sheet__kicker">Memorial Honors</p>' +
            '<h2 class="sheet__title" id="sheetTitle">' + p.no + '호</h2>' +
            '<p class="sheet__hint">이 호수에는 등록된 추모 기록이 없습니다. ' +
            '유족의 공개 동의를 받은 뒤 data/memorial.js 에 추가하면 이 화면에 표시됩니다.</p>';
        }
        var base = r.flowers || 0;
        var on = mine[r.no] ? 1 : 0;
        return '<p class="sheet__kicker">Memorial Honors</p>' +
          '<h2 class="sheet__title" id="sheetTitle">' + esc(displayName(r.visibility || 'private', r.name)) + '</h2>' +
          '<p class="sheet__sub">' + p.no + '호 · ' + esc(r.joinedYear) + ' — ' + esc(r.passedYear) + '</p>' +
          ((r.visibility !== 'private' && r.photo)
            ? '<figure class="sheet__photo sheet__photo--mono" style="--bg:url(' + esc(r.photo) + ')"></figure>' : '') +
          (r.epitaph ? '<blockquote class="sheet__epitaph">' + esc(r.epitaph) + '</blockquote>' : '') +
          ((r.tributes && r.tributes.length)
            ? '<ul class="tributes">' + r.tributes.map(function (t) {
                return '<li><span>' + esc(t.by) + '</span>' + esc(t.text) + '</li>';
              }).join('') + '</ul>' : '') +
          (m.flowersEnabled
            ? '<button class="flower' + (on ? ' is-on' : '') + '" id="sheetFlower" data-no="' + r.no + '">' +
              '<i aria-hidden="true"></i><b>헌화 ' + (base + on) + '</b></button>' : '');
      },
      afterOpen: function (p) {
        var btn = $('#sheetFlower');
        if (!btn) return;
        var r = p.raw;
        var base = r.flowers || 0;
        btn.addEventListener('click', function () {
          mine[r.no] = !mine[r.no];
          store.set(FLOWER_KEY, mine);
          var on = mine[r.no] ? 1 : 0;
          btn.classList.toggle('is-on', on === 1);
          $('b', btn).textContent = '헌화 ' + (base + on);
          if (on) {
            btn.classList.add('is-bloom');
            setTimeout(function () { btn.classList.remove('is-bloom'); }, 700);
          }
        });
      }
    });
  };

  /* ═══════════════════════════════════════════
     4-E) 복지동향 + 서식
     ═══════════════════════════════════════════ */
  var renderNews = function () {
    var n = D.news;
    if (!n) return;
    var items = n.items || [];
    var state = { scope: 'all', q: '' };

    var scopes = items.reduce(function (acc, it) {
      if (it.scope && acc.indexOf(it.scope) < 0) acc.push(it.scope);
      return acc;
    }, []);

    html('#newsScopes', '<button class="chip is-active" data-scope="all">전체</button>' +
      scopes.map(function (s) {
        return '<button class="chip" data-scope="' + esc(s) + '">' + esc(s) + '</button>';
      }).join(''));

    var paint = function () {
      var found = filterNews(items, state);
      text('#newsCount', found.length + ' / ' + items.length);
      html('#newsList', found.length ? found.map(function (it) {
        var d = String(it.date).split('-');
        return '<li class="ncard"><a href="' + esc(it.url) + '" target="_blank" rel="noopener">' +
          '<span class="ncard__date">' +
            '<b>' + esc(d[2]) + '</b><i>' + esc(d[0]) + '.' + esc(d[1]) + '</i>' +
          '</span>' +
          '<span class="ncard__body">' +
            '<span class="ncard__tags">' +
              (it.scope ? '<em class="tag tag--' + (it.scope === '울산' ? 'local' : 'nation') + '">' + esc(it.scope) + '</em>' : '') +
              (it.topic ? '<em class="tag">' + esc(it.topic) + '</em>' : '') +
              '<em class="tag tag--media">' + esc(it.media) + '</em>' +
            '</span>' +
            (it.pull ? '<strong class="ncard__pull">' + esc(it.pull) + '</strong>' : '') +
            '<strong class="ncard__title">' + esc(it.title) + '</strong>' +
            (it.memo ? '<span class="ncard__memo"><i>담당자 메모</i>' + esc(it.memo) + '</span>' : '') +
            (it.member ? '<span class="ncard__member">' + esc(it.member) + '</span>' : '') +
            '<span class="ncard__cta">원문 보기</span>' +
          '</span></a></li>';
      }).join('') : emptyBox(n.emptyMessage));
    };

    $('#newsQ').addEventListener('input', function () { state.q = this.value.trim(); paint(); });
    $$('#newsScopes .chip').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#newsScopes .chip').forEach(function (x) { x.classList.remove('is-active'); });
        b.classList.add('is-active');
        state.scope = b.dataset.scope;
        paint();
      });
    });
    paint();
  };

  var renderForms = function () {
    var f = D.forms;
    if (!f) return;
    html('#formsList', f.items.map(function (it) {
      var body = '<span class="shelf__kind">' + esc(it.type) + '</span>' +
        '<strong class="shelf__title">' + esc(it.title) + '</strong>' +
        '<span class="shelf__desc">' + esc(it.desc) + '</span>';
      return it.ready
        ? '<a class="shelf__item" href="' + esc(it.file) + '" download>' + body +
          '<span class="shelf__cta">내려받기</span></a>'
        : '<div class="shelf__item shelf__item--off">' + body +
          '<span class="shelf__cta">파일 준비 중</span></div>';
    }).join(''));
  };

  /* ═══════════════════════════════════════════
     4-F) 현황과 연혁
     ═══════════════════════════════════════════ */
  var renderLedger = function (rows) {
    html('#ledger',
      '<thead><tr><th>연도</th><th>신규</th><th>누적</th><th>신규 약정(억)</th><th>증감</th></tr></thead><tbody>' +
      rows.map(function (r, i) {
        var prev = i ? rows[i - 1].newMembers : null;
        var d = r.newMembers - prev;
        var diff = prev === null ? '–' : (d > 0 ? '▲ ' + d : (d < 0 ? '▼ ' + Math.abs(d) : '–'));
        return '<tr><td>' + r.year + '년</td><td class="num">' + r.newMembers + '</td>' +
          '<td class="num">' + r.members + '</td><td class="num">' + r.amount.toFixed(1) + '</td>' +
          '<td class="num">' + diff + '</td></tr>';
      }).join('') +
      '</tbody><tfoot><tr><td>합계</td>' +
      '<td class="num">' + rows.reduce(function (a, r) { return a + r.newMembers; }, 0) + '</td>' +
      '<td class="num">' + rows[rows.length - 1].members + '</td>' +
      '<td class="num">' + rows.reduce(function (a, r) { return a + r.amount; }, 0).toFixed(1) + '</td>' +
      '<td>–</td></tr></tfoot>');
  };

  var warnIfUnverified = function (obj, tail) {
    if (!obj) return '';
    var base = obj.asOf + (tail ? ' · ' + tail : '');
    return obj.verified === false ? '※ 검증 전 임시 수치입니다. ' + obj.note + '<br>' + base : base;
  };

  var renderStatus = function () {
    var h = D.honor, u = D.ulsan;

    if (h) {
      text('#honorHeadline', h.headline);
      html('#honorIntro', (h.intro || []).map(function (t) {
        return '<p>' + t + '</p>';          // 인사 문구는 강조 태그를 허용합니다
      }).join(''));
      text('#honorCreed', h.creed);
      text('#honorDefinition', h.definition);
      html('#requirements', h.requirements.map(function (r) {
        return '<div><dt>' + esc(r.label) + '</dt><dd>' + esc(r.value) + '</dd></div>';
      }).join(''));
      html('#process', h.process.map(function (s) {
        return '<li class="reveal"><span class="steps__n">' + s.n + '</span>' +
          '<strong>' + esc(s.title) + '</strong><em>' + esc(s.body) + '</em></li>';
      }).join(''));
      html('#history', h.history.map(function (t) {
        return '<li class="reveal"><span class="timeline__year">' + esc(t.year) + '</span>' +
          '<span class="timeline__body">' + esc(t.body) + '</span></li>';
      }).join(''));
      html('#benefits', h.benefits.map(function (b) {
        return '<article class="card reveal"><h3>' + esc(b.title) + '</h3><p>' + esc(b.body) + '</p></article>';
      }).join(''));
    }

    if (u) {
      var made = {};
      bindTabs($('#ulsanTabs'), function (id) {
        if (made[id]) return;
        if (id === 'p-amount') barChart($('#chartAmount'), u.rows, 'amount', {
          label: '울산 연간 신규 약정 금액',
          tip: function (r) { return r.year + '년 신규 약정 ' + r.amount + '억원'; }
        });
        if (id === 'p-ledger') renderLedger(u.rows);
        made[id] = true;
      });
      html('#ulsanNote', warnIfUnverified(u, '출처: 내부 자료 및 언론 보도'));
    }

    var c = D.calendar;
    if (c) {
      html('#calendarList', c.list.map(function (e) {
        return '<li class="calrow reveal">' +
          '<span class="calrow__when">' + e.month + '월' + (e.day ? ' ' + e.day + '일' : ' 중') + '</span>' +
          '<span class="calrow__kind">' + esc(e.kind) + '</span>' +
          '<span class="calrow__body"><strong>' + esc(e.title) + '</strong>' + esc(e.body) + '</span></li>';
      }).join(''));
      text('#calendarNote', c.note || '');
    }
  };

  /* ═══════════════════════════════════════════
     4-G) 담당자
     ═══════════════════════════════════════════ */
  var renderMe = function () {
    var p = D.profile, c = D.contact;
    if (p) {
      text('#profileTitle', '담당자 ' + p.name + '입니다');
      text('#profileCaption', p.name + ' · ' + p.title);
      html('#profileGreeting', p.greeting.map(function (t) {
        return '<p class="person__text">' + t + '</p>';
      }).join(''));
      html('#profileMeta',
        '<div><dt>소속</dt><dd>' + esc(p.org) + '</dd></div>' +
        '<div><dt>직급</dt><dd>' + esc(p.title) + '</dd></div>' +
        '<div><dt>담당</dt><dd>' + esc(p.duty) + '</dd></div>');

      var img = $('#profileImg');
      img.alt = p.name + ' ' + p.title;
      var fail = function () { img.closest('.person__photo').classList.add('is-fallback'); };
      img.addEventListener('error', fail);
      img.src = p.photo;
      if (img.complete && img.naturalWidth === 0) fail();
    }

    if (c) {
      text('#contactLead', c.lead);
      var mailto = 'mailto:' + c.email +
        '?subject=' + encodeURIComponent(c.emailSubject) +
        '&body=' + encodeURIComponent(c.emailBody);
      html('#contactCards',
        '<a class="ccard" href="' + esc(c.phoneHref) + '">' +
          '<span class="ccard__label">Phone</span>' +
          '<strong class="ccard__value">' + esc(c.phone) + '</strong>' +
          '<span class="ccard__sub">' + esc(c.phoneSub) + '</span></a>' +
        '<a class="ccard" href="' + esc(mailto) + '">' +
          '<span class="ccard__label">Email</span>' +
          '<strong class="ccard__value">' + esc(c.email) + '</strong>' +
          '<span class="ccard__sub">' + esc(c.emailSub) + '</span></a>');
    }
  };

  /* ═══════════════════════════════════════════
     시작
     ═══════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    initPlayer();
    renderCovers();
    renderHome();
    renderCalc();
    renderChecklist();
    renderObjections();
    renderFaq();
    renderForms();
    renderHall();
    drawChrysanthemum();
    renderMemorial();
    renderNews();
    renderStatus();
    renderMe();
    initSheet();
    initChrome();
    initRouter();
  });

  // 콘솔에서 계산 함수를 바로 확인할 수 있게 열어둡니다
  window.HONOR_FN = { buildSchedule: buildSchedule, taxCredit: taxCredit, maskName: maskName, pipe: pipe };
})();
