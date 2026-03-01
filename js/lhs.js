/* ============================================================
   LHS.JS  — Latin Hypercube Sampling  (v4 — accurate)

   What LHS actually is:
   • You have N parameters.
   • Each parameter's range is divided into N equal strata (strips).
   • You pick exactly ONE sample per stratum for every parameter.
   • The N samples are paired so that each row-stratum AND each
     column-stratum is used exactly once  → like a Latin square.
   • Result: N points that cover the full range of every parameter
     with no clustering and no redundancy.

   Animation story:
   ① AXES      Draw two parameter axes with N labelled strata each.
               Show all N² intersections as faint dots (= full grid).
               Label: "Plná mriežka: N² bodov"
   ② STRIPES   Animate horizontal + vertical stripe highlights one
               by one, showing the N×N stripes on each axis.
   ③ PICK      Pick one point per column-stripe, choosing a unique
               row-stripe each time (Fisher-Yates). Each selected
               point lights up gold. Rejected intersections dim.
               Counter: "LHS: N bodov vybraných"
   ④ COVERAGE  Draw horizontal coverage bars on Y-axis and vertical
               coverage bars on X-axis — every stripe ticked green.
               Label: "Každý pás pokrytý práve raz ✓"
   ⑤ HOLD      Pause → loop with new random arrangement.
   ============================================================ */

(function () {
    'use strict';

    const canvas = document.getElementById('lhs-canvas');
    if (!canvas) return;
    const ctx   = canvas.getContext('2d');
    const SLIDE = document.querySelector('[data-slide="25"]');

    /* ── tuning ─────────────────────────────────────── */
    const N       = 7;      /* number of strata / samples */
    const PAD_L   = 0.14;
    const PAD_R   = 0.06;
    const PAD_T   = 0.10;
    const PAD_B   = 0.14;

    /* colours */
    const C_AXIS     = 'rgba(255,255,255,0.30)';
    const C_STRIPE_X = 'rgba(88,166,255,0.08)';
    const C_STRIPE_Y = 'rgba(88,166,255,0.08)';
    const C_GRID_DOT = 'rgba(88,166,255,0.15)';
    const C_SEL      = '#f0b952';       /* gold — selected */
    const C_SEL_GLOW = 'rgba(240,185,82,0.35)';
    const C_TICK     = '#50c878';       /* green tick */
    const C_TEXT     = 'rgba(255,255,255,0.45)';
    const C_LABEL    = 'rgba(255,255,255,0.70)';

    const DUR = {
        axes   : 50,
        stripes: 9,    /* frames per stripe (×N stripes) */
        pick   : 14,   /* frames per point pick (×N picks) */
        cover  : 40,
        hold   : 90,
    };

    /* ── state ──────────────────────────────────────── */
    let W, H, dpr;
    let phase = 'axes', pf = 0, raf = null, running = false;
    let keptRow = [];   /* keptRow[col] = row (Fisher-Yates) */

    const nEl   = document.getElementById('lhs-n-display');
    const covEl = document.getElementById('lhs-cov-display');
    const phEl  = document.getElementById('lhs-phase-display');

    /* ── geometry ───────────────────────────────────── */
    function gL() { return W * PAD_L; }
    function gR() { return W * (1 - PAD_R); }
    function gT() { return H * PAD_T; }
    function gB() { return H * (1 - PAD_B); }
    function gW() { return gR() - gL(); }
    function gH() { return gB() - gT(); }
    function sx(col, frac) { return gL() + (col + frac) * gW() / N; }  /* x in col stripe */
    function sy(row, frac) { return gT() + (row + frac) * gH() / N; }  /* y in row stripe */

    /* ── LHS pick ───────────────────────────────────── */
    function pickLHS() {
        const rows = Array.from({length: N}, (_, i) => i);
        for (let i = N - 1; i > 0; i--) {
            const j = (Math.random() * (i + 1)) | 0;
            [rows[i], rows[j]] = [rows[j], rows[i]];
        }
        keptRow = rows;
    }

    /* ── draw helpers ───────────────────────────────── */
    function drawAxes(alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = C_AXIS;
        ctx.lineWidth = 2;
        /* X axis */
        ctx.beginPath(); ctx.moveTo(gL(), gB()); ctx.lineTo(gR() + 14, gB()); ctx.stroke();
        /* Y axis */
        ctx.beginPath(); ctx.moveTo(gL(), gB()); ctx.lineTo(gL(), gT() - 14); ctx.stroke();
        /* arrowheads */
        ctx.fillStyle = C_AXIS;
        ctx.beginPath(); ctx.moveTo(gR()+14,gB()-5); ctx.lineTo(gR()+22,gB()); ctx.lineTo(gR()+14,gB()+5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(gL()-5,gT()-14); ctx.lineTo(gL(),gT()-22); ctx.lineTo(gL()+5,gT()-14); ctx.fill();
        /* axis labels */
        ctx.font = `600 ${Math.round(W*0.022)}px "JetBrains Mono",monospace`;
        ctx.fillStyle = C_LABEL;
        ctx.textAlign = 'center';
        ctx.fillText('Parameter 1', gL() + gW()/2, gB() + H*0.07);
        ctx.save();
        ctx.translate(gL() - W*0.08, gT() + gH()/2);
        ctx.rotate(-Math.PI/2);
        ctx.fillText('Parameter 2', 0, 0);
        ctx.restore();
        ctx.restore();
    }

    function drawStripeLines(nX, nY, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = 'rgba(88,166,255,0.22)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 4]);
        /* vertical stripe borders */
        for (let i = 1; i < nX; i++) {
            ctx.beginPath(); ctx.moveTo(sx(i,0), gT()); ctx.lineTo(sx(i,0), gB()); ctx.stroke();
        }
        /* horizontal stripe borders */
        for (let i = 1; i < nY; i++) {
            ctx.beginPath(); ctx.moveTo(gL(), sy(i,0)); ctx.lineTo(gR(), sy(i,0)); ctx.stroke();
        }
        ctx.setLineDash([]);
        /* stripe number ticks */
        ctx.font = `${Math.round(W*0.018)}px "JetBrains Mono",monospace`;
        ctx.fillStyle = C_TEXT;
        ctx.textAlign = 'center';
        for (let i = 0; i < nX; i++)
            ctx.fillText(i+1, sx(i, 0.5), gB() + H*0.04);
        ctx.textAlign = 'right';
        for (let i = 0; i < nY; i++)
            ctx.fillText(i+1, gL() - W*0.02, sy(i, 0.5) + H*0.01);
        ctx.restore();
    }

    function drawAllGridDots(alpha) {
        ctx.save();
        for (let row = 0; row < N; row++) {
            for (let col = 0; col < N; col++) {
                const x = sx(col, 0.5), y = sy(row, 0.5);
                ctx.beginPath(); ctx.arc(x, y, W*0.008, 0, Math.PI*2);
                ctx.fillStyle = C_GRID_DOT;
                ctx.globalAlpha = alpha;
                ctx.fill();
            }
        }
        ctx.restore();
    }

    function drawSelectedDot(col, row, alpha, r) {
        const x = sx(col, 0.5), y = sy(row, 0.5);
        /* glow */
        const g = ctx.createRadialGradient(x, y, 0, x, y, r*3.5);
        g.addColorStop(0, `rgba(240,185,82,${alpha*0.7})`);
        g.addColorStop(1, 'rgba(240,185,82,0)');
        ctx.beginPath(); ctx.arc(x, y, r*3.5, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
        /* dot */
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fillStyle = C_SEL;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function drawCoverageTicks(prog) {
        const tickLen = W * 0.025;
        const r = W * 0.012;
        ctx.save();
        const n = Math.ceil(prog * N);
        ctx.strokeStyle = C_TICK;
        ctx.lineWidth = 2;
        ctx.fillStyle = C_TICK;
        ctx.shadowColor = C_TICK;
        ctx.shadowBlur = 6;
        /* X-axis ticks (one per col) */
        for (let col = 0; col < n; col++) {
            const x = sx(col, 0.5);
            ctx.beginPath(); ctx.moveTo(x, gB()); ctx.lineTo(x, gB() + tickLen); ctx.stroke();
        }
        /* Y-axis ticks (one per row) — use keptRow to mark the right rows */
        const coveredRows = new Set(keptRow.slice(0, n));
        let ri = 0;
        coveredRows.forEach(row => {
            const y = sy(row, 0.5);
            ctx.beginPath(); ctx.moveTo(gL(), y); ctx.lineTo(gL() - tickLen, y); ctx.stroke();
            ri++;
        });
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    /* ── phase helpers ──────────────────────────────── */
    function setLabel(phase) {
        if (!phEl) return;
        const labels = {
            axes   : 'Parametrický priestor',
            stripes: 'Rozdelenie na pásma',
            pick   : 'Výber vzoriek LHS',
            cover  : 'Každý pás pokrytý ✓',
            hold   : 'Každý pás pokrytý ✓',
        };
        phEl.textContent = labels[phase] || '';
    }

    function startAxes()   { phase='axes';    pf=0; pickLHS(); setLabel('axes');    if(nEl) nEl.textContent=String(N*N); if(covEl) covEl.textContent=String(N)+'×'+String(N); }
    function startStripes(){ phase='stripes'; pf=0; setLabel('stripes'); }
    function startPick()   { phase='pick';    pf=0; setLabel('pick');    if(nEl) nEl.textContent='0'; if(covEl) covEl.textContent='0'; }
    function startCover()  { phase='cover';   pf=0; setLabel('cover');   if(nEl) nEl.textContent=String(N); if(covEl) covEl.textContent=String(N); }
    function startHold()   { phase='hold';    pf=0; setLabel('hold'); }

    /* ── main tick ──────────────────────────────────── */
    const DOT_R = () => W * 0.014;

    function tick() {
        ctx.clearRect(0, 0, W, H);
        const t = pf;

        if (phase === 'axes') {
            const p = Math.min(t / DUR.axes, 1);
            drawAxes(p);
            drawAllGridDots(p * 0.6);
            if (t >= DUR.axes) startStripes();

        } else if (phase === 'stripes') {
            const total = DUR.stripes * N;
            const nDone = Math.min(Math.floor(t / DUR.stripes), N);
            drawAxes(1);
            drawAllGridDots(0.6);
            /* fill completed stripes */
            for (let i = 0; i < nDone; i++) {
                ctx.fillStyle = C_STRIPE_X;
                ctx.fillRect(sx(i,0), gT(), gW()/N, gH());
                ctx.fillStyle = C_STRIPE_Y;
                ctx.fillRect(gL(), sy(i,0), gW(), gH()/N);
            }
            drawStripeLines(Math.min(nDone+1, N), Math.min(nDone+1, N), 1);
            if (t >= total) startPick();

        } else if (phase === 'pick') {
            const nPicked = Math.min(Math.floor(t / DUR.pick), N);
            drawAxes(1);
            /* stripe fills */
            for (let i = 0; i < N; i++) {
                ctx.fillStyle = C_STRIPE_X;
                ctx.fillRect(sx(i,0), gT(), gW()/N, gH());
                ctx.fillStyle = C_STRIPE_Y;
                ctx.fillRect(gL(), sy(i,0), gW(), gH()/N);
            }
            drawStripeLines(N, N, 1);
            /* dim all grid dots first */
            drawAllGridDots(0.20);
            /* draw selected points */
            for (let col = 0; col < nPicked; col++) {
                drawSelectedDot(col, keptRow[col], 1, DOT_R());
            }
            /* animate current pick */
            if (nPicked < N) {
                const pickFrac = (t - nPicked * DUR.pick) / DUR.pick;
                drawSelectedDot(nPicked, keptRow[nPicked], easeInOut(pickFrac), DOT_R());
            }
            if (nEl)  nEl.textContent  = String(nPicked);
            if (covEl) covEl.textContent = String(nPicked);
            if (t >= DUR.pick * N) startCover();

        } else if (phase === 'cover') {
            const p = Math.min(t / DUR.cover, 1);
            drawAxes(1);
            for (let i = 0; i < N; i++) {
                ctx.fillStyle = C_STRIPE_X;
                ctx.fillRect(sx(i,0), gT(), gW()/N, gH());
                ctx.fillStyle = C_STRIPE_Y;
                ctx.fillRect(gL(), sy(i,0), gW(), gH()/N);
            }
            drawStripeLines(N, N, 1);
            drawAllGridDots(0.12);
            for (let col = 0; col < N; col++)
                drawSelectedDot(col, keptRow[col], 1, DOT_R());
            drawCoverageTicks(p);
            if (t >= DUR.cover) startHold();

        } else if (phase === 'hold') {
            drawAxes(1);
            for (let i = 0; i < N; i++) {
                ctx.fillStyle = C_STRIPE_X;
                ctx.fillRect(sx(i,0), gT(), gW()/N, gH());
                ctx.fillStyle = C_STRIPE_Y;
                ctx.fillRect(gL(), sy(i,0), gW(), gH()/N);
            }
            drawStripeLines(N, N, 1);
            drawAllGridDots(0.12);
            for (let col = 0; col < N; col++)
                drawSelectedDot(col, keptRow[col], 1, DOT_R());
            drawCoverageTicks(1);
            if (t >= DUR.hold) startAxes();
        }

        pf++;
        raf = requestAnimationFrame(tick);
    }

    function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

    /* ── lifecycle ──────────────────────────────────── */
    function resize() {
        dpr = window.devicePixelRatio || 1;
        const r = canvas.getBoundingClientRect();
        W = r.width  || canvas.offsetWidth  || 480;
        H = r.height || canvas.offsetHeight || 480;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
    }

    canvas._startLHS = function () {
        if (running) return;
        running = true;
        resize();
        startAxes();
        tick();
    };
    canvas._stopLHS = function () {
        running = false;
        if (raf) { cancelAnimationFrame(raf); raf = null; }
    };

    if (SLIDE) {
        new MutationObserver(() => {
            if (SLIDE.classList.contains('active')) canvas._startLHS();
            else canvas._stopLHS();
        }).observe(SLIDE, { attributes: true, attributeFilter: ['class'] });
    }
})();
