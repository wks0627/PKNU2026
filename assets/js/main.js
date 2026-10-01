/* =========================================================
   main.js — 데이터 렌더링 + 상호작용
   외부 라이브러리 없음. 파일을 더블클릭해도 그대로 동작합니다.
   ========================================================= */
(function () {
  'use strict';

  var D = window.HONOR_DATA || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── 상단 바 ─────────────────────────────────────── */
  function initTopbar() {
    var bar = $('#topbar');
    var nav = $('.topbar__nav');
    var btn = $('#navToggle');

    var onScroll = function () {
      bar.classList.toggle('is-stuck', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

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
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ── 전국 현황 숫자 ──────────────────────────────── */
  function renderNational() {
    var n = D.national;
    if (!n) return;
    $('#nationalFigures').innerHTML = n.figures.map(function (f) {
      return '<div class="figure">' +
        '<span class="figure__value">' + f.value + '<small>' + f.unit + '</small></span>' +
        '<span class="figure__label">' + f.label + '</span>' +
      '</div>';
    }).join('');
    $('#nationalNote').textContent = n.asOf + ' · 출처: ' + n.source;
  }

  /* ── 연혁 ────────────────────────────────────────── */
  function renderTimeline() {
    if (!D.timeline) return;
    $('#timeline').innerHTML = D.timeline.map(function (t) {
      return '<li><span class="timeline__year">' + t.year + '</span>' +
             '<span class="timeline__body">' + t.body + '</span></li>';
    }).join('');
  }

  /* ── FAQ ─────────────────────────────────────────── */
  function renderFaq() {
    if (!D.faq) return;
    var wrap = $('#faqList');
    wrap.innerHTML = D.faq.map(function (f, i) {
      return '<div class="faq__item">' +
        '<button class="faq__q" aria-expanded="false" aria-controls="faq-a-' + i + '">' +
          '<span class="faq__mark">Q</span><span>' + f.q + '</span>' +
        '</button>' +
        '<div class="faq__a" id="faq-a-' + i + '">' +
          '<div class="faq__a-inner">' + f.a + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    $$('.faq__q', wrap).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.parentNode;
        var panel = btn.nextElementSibling;
        var open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', String(open));
        panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
      });
    });
  }

  /* ── 차트 (손으로 그리는 SVG) ────────────────────── */
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }

  var W = 1000, H = 420, PAD = { t: 30, r: 28, b: 52, l: 64 };
  var PLOT = { w: W - PAD.l - PAD.r, h: H - PAD.t - PAD.b };

  function axes(svg, rows, max, suffix) {
    var ticks = 4;
    for (var i = 0; i <= ticks; i++) {
      var v = max / ticks * i;
      var y = PAD.t + PLOT.h - (PLOT.h / ticks) * i;
      svg.appendChild(el('line', {
        x1: PAD.l, x2: PAD.l + PLOT.w, y1: y, y2: y,
        stroke: 'rgba(184,148,90,.22)', 'stroke-width': 1
      }));
      svg.appendChild(el('text', {
        x: PAD.l - 12, y: y + 4, 'text-anchor': 'end',
        fill: '#6d6459', 'font-size': 13, 'font-family': 'Noto Sans KR, sans-serif'
      }, Math.round(v) + (suffix || '')));
    }
    var step = PLOT.w / rows.length;
    rows.forEach(function (r, i) {
      svg.appendChild(el('text', {
        x: PAD.l + step * i + step / 2, y: PAD.t + PLOT.h + 26,
        'text-anchor': 'middle', fill: '#6d6459',
        'font-size': 13, 'font-family': 'Noto Sans KR, sans-serif'
      }, String(r.year)));
    });
    return step;
  }

  /* 누적 회원 — 면적 + 선 */
  function chartMembers(host, rows) {
    var max = Math.ceil(Math.max.apply(null, rows.map(function (r) { return r.members; })) / 20) * 20;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': '울산 누적 회원 수 추이' });

    var step = axes(svg, rows, max, '명');

    var pts = rows.map(function (r, i) {
      return [PAD.l + step * i + step / 2, PAD.t + PLOT.h - (r.members / max) * PLOT.h];
    });

    var grad = el('linearGradient', { id: 'gMembers', x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.appendChild(el('stop', { offset: '0%',   'stop-color': '#b8945a', 'stop-opacity': '.42' }));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': '#b8945a', 'stop-opacity': '0' }));
    var defs = el('defs'); defs.appendChild(grad); svg.appendChild(defs);

    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ');
    svg.appendChild(el('path', {
      d: line + ' L' + pts[pts.length - 1][0] + ',' + (PAD.t + PLOT.h) +
         ' L' + pts[0][0] + ',' + (PAD.t + PLOT.h) + ' Z',
      fill: 'url(#gMembers)'
    }));
    svg.appendChild(el('path', { d: line, fill: 'none', stroke: '#b8945a', 'stroke-width': 2.5 }));

    rows.forEach(function (r, i) {
      var p = pts[i];
      var g = el('g', { class: 'pt' });
      g.appendChild(el('circle', { cx: p[0], cy: p[1], r: 5,
        fill: '#15110e', stroke: '#b8945a', 'stroke-width': 2 }));
      g.appendChild(el('text', {
        x: p[0], y: p[1] - 16, 'text-anchor': 'middle', fill: '#2a241e',
        'font-size': 14, 'font-family': 'Gowun Batang, serif', 'font-weight': 700
      }, r.members));
      g.appendChild(el('title', {}, r.year + '년 말 누적 ' + r.members + '명 (신규 ' + r.newMembers + '명)'));
      svg.appendChild(g);
    });

    host.innerHTML = '';
    host.appendChild(svg);
  }

  /* 연간 신규 약정 금액 — 막대 */
  function chartAmount(host, rows) {
    var max = Math.ceil(Math.max.apply(null, rows.map(function (r) { return r.amount; })) / 5) * 5;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': '울산 연간 신규 약정 금액 추이' });

    var step = axes(svg, rows, max, '');
    var bw = Math.min(46, step * 0.5);

    rows.forEach(function (r, i) {
      var h = (r.amount / max) * PLOT.h;
      var x = PAD.l + step * i + step / 2 - bw / 2;
      var y = PAD.t + PLOT.h - h;
      var g = el('g');
      g.appendChild(el('rect', {
        x: x, y: y, width: bw, height: h,
        fill: i === rows.length - 1 ? '#e2231a' : '#b8945a',
        opacity: i === rows.length - 1 ? '.92' : '.78'
      }));
      g.appendChild(el('text', {
        x: x + bw / 2, y: y - 12, 'text-anchor': 'middle', fill: '#2a241e',
        'font-size': 14, 'font-family': 'Gowun Batang, serif', 'font-weight': 700
      }, r.amount));
      g.appendChild(el('title', {}, r.year + '년 신규 약정 ' + r.amount + '억원'));
      svg.appendChild(g);
    });

    svg.appendChild(el('text', {
      x: PAD.l, y: 16, fill: '#6d6459',
      'font-size': 13, 'font-family': 'Noto Sans KR, sans-serif'
    }, '단위: 억원'));

    host.innerHTML = '';
    host.appendChild(svg);
  }

  /* 연도별 원장 */
  function renderLedger(rows) {
    var totalNew = rows.reduce(function (a, r) { return a + r.newMembers; }, 0);
    var totalAmt = rows.reduce(function (a, r) { return a + r.amount; }, 0);

    $('#ledger').innerHTML =
      '<thead><tr>' +
        '<th>연도</th><th>신규 가입</th><th>누적 회원</th>' +
        '<th>신규 약정 (억원)</th><th>증감</th>' +
      '</tr></thead><tbody>' +
      rows.map(function (r, i) {
        var prev = i ? rows[i - 1].newMembers : null;
        var diff = prev === null ? '–'
          : (r.newMembers - prev > 0 ? '▲ ' + (r.newMembers - prev)
          : (r.newMembers - prev < 0 ? '▼ ' + Math.abs(r.newMembers - prev) : '–'));
        return '<tr>' +
          '<td>' + r.year + '년</td>' +
          '<td class="num">' + r.newMembers + '명</td>' +
          '<td class="num">' + r.members + '명</td>' +
          '<td class="num">' + r.amount.toFixed(1) + '</td>' +
          '<td class="num">' + diff + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody><tfoot><tr>' +
        '<td>합계</td><td class="num">' + totalNew + '명</td>' +
        '<td class="num">' + rows[rows.length - 1].members + '명</td>' +
        '<td class="num">' + totalAmt.toFixed(1) + '</td><td>–</td>' +
      '</tr></tfoot>';
  }

  /* ── 아카이브 ────────────────────────────────────── */
  function initArchive() {
    var u = D.ulsan;
    if (!u || !u.rows || !u.rows.length) return;

    var drawn = {};
    var draw = function (id) {
      if (drawn[id]) return;
      if (id === 'panel-members') chartMembers($('#chartMembers'), u.rows);
      if (id === 'panel-amount')  chartAmount($('#chartAmount'), u.rows);
      if (id === 'panel-table')   renderLedger(u.rows);
      drawn[id] = true;
    };
    draw('panel-members');

    $$('.archive__tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('.archive__tab').forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        $$('.archive__panel').forEach(function (p) { p.classList.remove('is-active'); });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        var id = tab.dataset.panel;
        draw(id);
        $('#' + id).classList.add('is-active');
      });
    });

    var src = u.asOf + ' · 출처: 울산사회복지공동모금회 내부 자료 및 언론 보도';
    if (u.verified === false) {
      src = '※ 검증 전 임시 수치입니다. ' + u.note + '<br>' + src;
    }
    $('#archiveSource').innerHTML = src;
  }

  /* ── 프로필 사진 대체 ────────────────────────────── */
  function initProfile() {
    var img = $('#profileImg');
    if (!img) return;
    img.addEventListener('error', function () {
      img.closest('.person__photo').classList.add('is-fallback');
    });
    if (img.complete && img.naturalWidth === 0) {
      img.closest('.person__photo').classList.add('is-fallback');
    }
  }

  /* ── 시작 ────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initTopbar();
    renderNational();
    renderTimeline();
    renderFaq();
    initArchive();
    initProfile();
    initReveal();
  });
})();
