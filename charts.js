/* ============================================================
   CAUDAL — Charts (motor de gráficos en canvas puro)
   ============================================================ */
const Charts = (() => {
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function setup(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.parentElement.clientWidth;
    const h = rect.height || parseInt(canvas.getAttribute('height')) || 220;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function animate(duration, draw) {
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      draw(easeOut(t));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- AREA / LINE chart (dual series) ---------- */
  function area(canvas, labels, series, opts = {}) {
    const { ctx, w, h } = setup(canvas);
    const pad = { t: 18, r: 14, b: 26, l: 52 };
    const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
    const allVals = series.flatMap(s => s.data);
    const max = Math.max(1, ...allVals) * 1.12;
    const text = cssVar('--text-faint'), grid = cssVar('--border');
    const n = labels.length;
    const xAt = (i) => pad.l + (n <= 1 ? plotW/2 : (i / (n - 1)) * plotW);
    const yAt = (v) => pad.t + plotH - (v / max) * plotH;

    canvas._hot = series.map(s => s.data.map((v,i)=>({x:xAt(i), y:yAt(v), v, label:labels[i], color:s.color, name:s.name})));

    animate(900, (p) => {
      ctx.clearRect(0, 0, w, h);
      // grid + y labels
      ctx.font = '11px JetBrains Mono'; ctx.fillStyle = text; ctx.textAlign = 'right';
      const steps = 4;
      for (let i = 0; i <= steps; i++) {
        const v = (max / steps) * i, y = yAt(v);
        ctx.strokeStyle = grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        ctx.fillText(Fmt.money(v, opts.currency || 'CRC', true).replace('₡','').replace('$',''), pad.l - 8, y + 3);
      }
      // x labels
      ctx.textAlign = 'center';
      labels.forEach((l, i) => { if (n > 8 && i % 2 !== 0) return; ctx.fillText(l, xAt(i), h - 7); });

      series.forEach(s => {
        // area fill
        const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH);
        grad.addColorStop(0, hexA(s.color, 0.28)); grad.addColorStop(1, hexA(s.color, 0));
        ctx.beginPath();
        s.data.forEach((v, i) => { const y = pad.t + plotH - ((pad.t+plotH-yAt(v)) * p); i ? ctx.lineTo(xAt(i), y) : ctx.moveTo(xAt(i), y); });
        ctx.lineTo(xAt(n - 1), pad.t + plotH); ctx.lineTo(xAt(0), pad.t + plotH); ctx.closePath();
        ctx.fillStyle = grad; ctx.fill();
        // line
        ctx.beginPath(); ctx.lineWidth = 2.4; ctx.strokeStyle = s.color;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        s.data.forEach((v, i) => { const y = pad.t + plotH - ((pad.t+plotH-yAt(v)) * p); i ? ctx.lineTo(xAt(i), y) : ctx.moveTo(xAt(i), y); });
        ctx.stroke();
        if (p === 1) s.data.forEach((v, i) => {
          const y = yAt(v); ctx.beginPath(); ctx.arc(xAt(i), y, 3, 0, 7); ctx.fillStyle = cssVar('--surface'); ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = s.color; ctx.stroke();
        });
      });
    });

    attachTooltip(canvas, () => canvas._hot, opts.currency || 'CRC', 'area');
  }

  /* ---------- BAR chart (grouped) ---------- */
  function bars(canvas, labels, series, opts = {}) {
    const { ctx, w, h } = setup(canvas);
    const pad = { t: 18, r: 14, b: 26, l: 52 };
    const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
    const max = Math.max(1, ...series.flatMap(s => s.data)) * 1.14;
    const text = cssVar('--text-faint'), grid = cssVar('--border');
    const n = labels.length, groups = series.length;
    const groupW = plotW / n, barW = Math.min(26, (groupW * 0.62) / groups);
    const yAt = (v) => pad.t + plotH - (v / max) * plotH;
    const hot = [];

    animate(800, (p) => {
      ctx.clearRect(0, 0, w, h);
      ctx.font = '11px JetBrains Mono'; ctx.fillStyle = text; ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const v = (max / 4) * i, y = yAt(v);
        ctx.strokeStyle = grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        ctx.fillText(Fmt.money(v, opts.currency || 'CRC', true).replace(/[₡$]/,''), pad.l - 8, y + 3);
      }
      ctx.textAlign = 'center';
      hot.length = 0;
      labels.forEach((l, i) => {
        const gx = pad.l + groupW * i + groupW / 2;
        ctx.fillStyle = text; ctx.fillText(l, gx, h - 7);
        series.forEach((s, si) => {
          const v = s.data[i];
          const bx = gx - (groups * barW) / 2 - (groups-1)*2/2 + si * (barW + 2);
          const bh = (v / max) * plotH * p;
          const by = pad.t + plotH - bh;
          roundRect(ctx, bx, by, barW, bh, 5); ctx.fillStyle = s.color; ctx.fill();
          if (p === 1) hot.push({ x: bx + barW/2, y: by, v, label: l, color: s.color, name: s.name });
        });
      });
    });
    canvas._hot = [hot];
    attachTooltip(canvas, () => [hot], opts.currency || 'CRC', 'bar');
  }

  /* ---------- DONUT chart ---------- */
  function donut(canvas, items, opts = {}) {
    const { ctx, w, h } = setup(canvas);
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 10, inner = r * 0.62;
    const total = items.reduce((s, i) => s + i.value, 0) || 1;
    const hot = [];
    animate(900, (p) => {
      ctx.clearRect(0, 0, w, h);
      let start = -Math.PI / 2;
      items.forEach(it => {
        const ang = (it.value / total) * Math.PI * 2 * p;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, start + ang); ctx.closePath();
        ctx.fillStyle = it.color; ctx.fill();
        start += ang;
      });
      // inner hole
      ctx.beginPath(); ctx.arc(cx, cy, inner, 0, 7); ctx.fillStyle = cssVar('--surface'); ctx.fill();
      if (p === 1) {
        ctx.fillStyle = cssVar('--text'); ctx.font = '700 22px Bricolage Grotesque'; ctx.textAlign = 'center';
        ctx.fillText(Fmt.money(total, opts.currency || 'CRC', true), cx, cy - 2);
        ctx.fillStyle = cssVar('--text-faint'); ctx.font = '11px Hanken Grotesk';
        ctx.fillText(opts.centerLabel || 'Total', cx, cy + 16);
      }
    });
    // build hot zones (angular)
    let acc = -Math.PI / 2;
    items.forEach(it => { const ang = (it.value / total) * Math.PI * 2; hot.push({ from: acc, to: acc + ang, ...it, total }); acc += ang; });
    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - cx, y = e.clientY - rect.top - cy;
      const dist = Math.hypot(x, y);
      let tip = '';
      if (dist > inner && dist < r) {
        let a = Math.atan2(y, x); if (a < -Math.PI/2) a += Math.PI*2;
        const seg = hot.find(s => a >= s.from && a < s.to);
        if (seg) tip = `${seg.label} · ${Fmt.money(seg.value, opts.currency||'CRC')} · ${Math.round(seg.value/seg.total*100)}%`;
      }
      showTip(canvas, tip, e);
    };
    canvas.onmouseleave = () => hideTip();
  }

  /* ---------- SPARKLINE (mini, in KPI cards) ---------- */
  function spark(canvas, points, color) {
    const { ctx, w, h } = setup(canvas);
    const max = Math.max(...points), min = Math.min(...points), rng = (max - min) || 1;
    const xAt = (i) => (i / (points.length - 1)) * w;
    const yAt = (v) => h - 3 - ((v - min) / rng) * (h - 6);
    animate(700, (p) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, hexA(color, 0.30)); grad.addColorStop(1, hexA(color, 0));
      ctx.beginPath();
      const upto = Math.max(1, Math.floor(points.length * p));
      for (let i = 0; i < upto; i++) (i ? ctx.lineTo(xAt(i), yAt(points[i])) : ctx.moveTo(xAt(i), yAt(points[i])));
      ctx.lineTo(xAt(upto-1), h); ctx.lineTo(0, h); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.lineJoin = 'round';
      for (let i = 0; i < upto; i++) (i ? ctx.lineTo(xAt(i), yAt(points[i])) : ctx.moveTo(xAt(i), yAt(points[i])));
      ctx.stroke();
    });
  }

  /* ---------- tooltip helpers ---------- */
  function attachTooltip(canvas, getHot, currency, type) {
    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let best = null, bestD = 26;
      getHot().forEach(arr => arr.forEach(pt => {
        const d = Math.hypot(pt.x - mx, pt.y - my);
        if (d < bestD) { bestD = d; best = pt; }
      }));
      showTip(canvas, best ? `${best.name ? best.name + ' · ' : ''}${best.label} · ${Fmt.money(best.v, currency)}` : '', e);
    };
    canvas.onmouseleave = () => hideTip();
  }
  let tipEl;
  function showTip(canvas, text, e) {
    if (!text) return hideTip();
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'chart-tip'; document.body.appendChild(tipEl); }
    tipEl.textContent = text; tipEl.style.display = 'block';
    tipEl.style.left = (e.clientX + 14) + 'px'; tipEl.style.top = (e.clientY - 8) + 'px';
  }
  function hideTip() { if (tipEl) tipEl.style.display = 'none'; }

  /* ---------- util ---------- */
  function roundRect(ctx, x, y, w, h, r) {
    if (h < r) r = h; r = Math.max(0, r);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function hexA(hex, a) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  }
  const palette = () => ['--c1','--c2','--c3','--c4','--c5','--c6'].map(cssVar);

  return { area, bars, donut, spark, palette };
})();
