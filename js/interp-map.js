/* ============================================================
   INTERP-MAP.JS  — Animated 2D interpolation map for slide 27
   Shows k-eff vs Be₂C thickness scatter, a moving crosshair
   pointer that reads exact values, plus a smooth spline.
   ============================================================ */

(function () {
    'use strict';

    const canvas = document.getElementById('interp-map-canvas');
    if (!canvas) return;
    const ctx   = canvas.getContext('2d');
    const SLIDE = document.querySelector('[data-slide="27"]');

    /* ── real LHS data ──────────────────────────────── */
    const PTS = [{"x":6.0095,"k":1.02631,"u":2.169,"t":935.3},{"x":6.0152,"k":1.02317,"u":2.849,"t":914.1},{"x":6.0203,"k":0.85265,"u":2.269,"t":955.1},{"x":6.038,"k":0.94033,"u":3.928,"t":891.1},{"x":6.0459,"k":0.82041,"u":1.253,"t":968.8},{"x":6.051,"k":0.39193,"u":0.383,"t":921.1},{"x":6.0686,"k":1.08798,"u":2.131,"t":912.2},{"x":6.0743,"k":0.98363,"u":3.244,"t":920.9},{"x":6.0894,"k":0.72157,"u":1.666,"t":938.3},{"x":6.0992,"k":0.87453,"u":2.234,"t":969.8},{"x":6.105,"k":1.1467,"u":3.45,"t":952.6},{"x":6.1173,"k":1.0761,"u":1.237,"t":918.5},{"x":6.1239,"k":0.67428,"u":0.886,"t":892.0},{"x":6.1301,"k":0.26024,"u":0.178,"t":934.7},{"x":6.145,"k":0.89879,"u":2.588,"t":916.4},{"x":6.1598,"k":0.94309,"u":3.589,"t":960.8},{"x":6.1641,"k":0.86926,"u":1.148,"t":939.6},{"x":6.1713,"k":1.06306,"u":3.646,"t":936.9},{"x":6.1863,"k":0.93355,"u":1.125,"t":956.7},{"x":6.1991,"k":1.20989,"u":1.94,"t":899.1},{"x":6.2061,"k":0.67543,"u":0.925,"t":909.2},{"x":6.2185,"k":0.91408,"u":2.456,"t":939.4},{"x":6.2299,"k":0.6332,"u":1.16,"t":894.5},{"x":6.2376,"k":0.48847,"u":0.29,"t":899.8},{"x":6.2419,"k":0.85129,"u":2.16,"t":957.3},{"x":6.2532,"k":1.0745,"u":3.047,"t":917.4},{"x":6.265,"k":0.86687,"u":2.815,"t":903.9},{"x":6.2704,"k":1.07595,"u":2.414,"t":911.6},{"x":6.2829,"k":1.14228,"u":2.73,"t":937.6},{"x":6.2974,"k":0.96882,"u":3.682,"t":943.0},{"x":6.3005,"k":0.75484,"u":1.824,"t":954.8},{"x":6.313,"k":1.21276,"u":2.197,"t":953.8},{"x":6.3201,"k":0.99164,"u":1.099,"t":883.8},{"x":6.3346,"k":0.96641,"u":3.125,"t":889.7},{"x":6.3401,"k":0.94708,"u":3.843,"t":884.6},{"x":6.3541,"k":1.0182,"u":2.859,"t":935.7},{"x":6.3668,"k":0.95926,"u":1.077,"t":892.7},{"x":6.3764,"k":0.83645,"u":0.397,"t":873.3},{"x":6.3833,"k":0.8357,"u":1.867,"t":882.9},{"x":6.3922,"k":1.26347,"u":3.147,"t":970.7},{"x":6.4026,"k":0.79804,"u":1.368,"t":961.8},{"x":6.4168,"k":1.25012,"u":3.43,"t":903.5},{"x":6.4215,"k":0.96258,"u":3.352,"t":930.7},{"x":6.4335,"k":0.93388,"u":0.554,"t":887.3},{"x":6.4477,"k":0.67109,"u":0.716,"t":916.7},{"x":6.4516,"k":1.21731,"u":3.107,"t":926.8},{"x":6.4668,"k":0.82537,"u":1.516,"t":932.1},{"x":6.4794,"k":0.84748,"u":2.302,"t":904.4},{"x":6.4888,"k":0.72736,"u":0.569,"t":923.6},{"x":6.4996,"k":0.76734,"u":1.583,"t":880.3},{"x":6.5084,"k":1.12295,"u":3.652,"t":928.1},{"x":6.52,"k":0.91066,"u":2.49,"t":942.5},{"x":6.527,"k":0.6981,"u":1.398,"t":953.3},{"x":6.531,"k":1.0802,"u":2.796,"t":949.0},{"x":6.5484,"k":0.95318,"u":1.207,"t":946.4},{"x":6.5557,"k":0.73391,"u":1.28,"t":890.1},{"x":6.5688,"k":0.97697,"u":1.763,"t":941.0},{"x":6.57,"k":1.29852,"u":3.908,"t":924.4},{"x":6.585,"k":1.10136,"u":2.978,"t":940.1},{"x":6.5941,"k":0.91785,"u":1.789,"t":949.8},{"x":6.6044,"k":0.70336,"u":0.491,"t":896.7},{"x":6.6169,"k":1.19966,"u":2.788,"t":874.4},{"x":6.6277,"k":1.24985,"u":3.718,"t":951.3},{"x":6.6388,"k":1.05902,"u":2.923,"t":888.1},{"x":6.649,"k":0.96176,"u":2.69,"t":947.7},{"x":6.6576,"k":0.83325,"u":1.728,"t":888.9},{"x":6.6638,"k":1.01261,"u":2.341,"t":922.2},{"x":6.6721,"k":0.55502,"u":0.809,"t":908.4},{"x":6.6856,"k":0.96888,"u":3.744,"t":882.3},{"x":6.6907,"k":0.96451,"u":1.071,"t":882.0},{"x":6.707,"k":1.2662,"u":2.102,"t":915.7},{"x":6.7115,"k":1.26105,"u":2.669,"t":968.1},{"x":6.7226,"k":1.3309,"u":2.554,"t":946.0},{"x":6.7382,"k":0.97244,"u":2.645,"t":959.0},{"x":6.7449,"k":0.9373,"u":2.248,"t":946.7},{"x":6.7555,"k":0.95153,"u":2.018,"t":962.4},{"x":6.7621,"k":0.83626,"u":1.812,"t":964.2},{"x":6.7703,"k":1.24538,"u":2.379,"t":887.7},{"x":6.782,"k":0.786,"u":0.987,"t":965.8},{"x":6.7943,"k":1.22483,"u":3.207,"t":965.1},{"x":6.8044,"k":0.95513,"u":3.305,"t":893.7},{"x":6.8128,"k":1.12388,"u":1.351,"t":909.8},{"x":6.8295,"k":1.02731,"u":3.966,"t":934.4},{"x":6.8392,"k":0.70774,"u":1.183,"t":879.1},{"x":6.8496,"k":1.24311,"u":2.567,"t":955.5},{"x":6.85,"k":0.86477,"u":1.575,"t":905.6},{"x":6.8634,"k":0.8677,"u":2.122,"t":938.5},{"x":6.877,"k":0.98208,"u":3.596,"t":966.8},{"x":6.8869,"k":0.39661,"u":0.355,"t":875.2},{"x":6.8987,"k":0.62716,"u":0.346,"t":889.4},{"x":6.9092,"k":0.97704,"u":1.418,"t":929.2},{"x":6.9189,"k":1.142,"u":3.818,"t":957.8},{"x":6.9277,"k":1.00789,"u":1.989,"t":907.5},{"x":6.936,"k":0.87376,"u":1.297,"t":945.2},{"x":6.9471,"k":1.24112,"u":1.62,"t":873.7},{"x":6.9537,"k":0.96246,"u":3.365,"t":941.8},{"x":6.9622,"k":0.74965,"u":0.679,"t":951.9},{"x":6.9796,"k":0.83798,"u":2.319,"t":900.9},{"x":6.9893,"k":1.30875,"u":3.531,"t":896.3},{"x":6.9995,"k":0.96517,"u":2.743,"t":937.3},{"x":7.0048,"k":0.73711,"u":1.701,"t":919.8},{"x":7.0152,"k":1.05585,"u":3.177,"t":911.4},{"x":7.0202,"k":0.44378,"u":0.44,"t":972.8},{"x":7.0384,"k":0.88414,"u":1.904,"t":963.7},{"x":7.0416,"k":1.22227,"u":3.296,"t":895.2},{"x":7.0522,"k":0.33877,"u":0.245,"t":878.8},{"x":7.0622,"k":1.11979,"u":2.99,"t":898.0},{"x":7.0731,"k":1.03778,"u":3.799,"t":913.4},{"x":7.0871,"k":0.92518,"u":3.321,"t":898.2},{"x":7.093,"k":0.58619,"u":0.179,"t":947.1},{"x":7.1014,"k":1.0309,"u":1.328,"t":902.5},{"x":7.116,"k":0.731,"u":1.551,"t":905.2},{"x":7.1239,"k":0.7934,"u":2.044,"t":928.7},{"x":7.1383,"k":0.97618,"u":2.355,"t":950.1},{"x":7.1495,"k":1.18734,"u":3.401,"t":920.4},{"x":7.1506,"k":0.54394,"u":0.638,"t":913.8},{"x":7.1606,"k":0.78744,"u":0.613,"t":908.9},{"x":7.1719,"k":0.83315,"u":0.77,"t":880.9},{"x":7.188,"k":0.99503,"u":3.261,"t":921.9},{"x":7.199,"k":0.92098,"u":2.079,"t":948.8},{"x":7.202,"k":0.66515,"u":1.038,"t":881.1},{"x":7.2186,"k":1.20939,"u":1.475,"t":877.9},{"x":7.2247,"k":0.91843,"u":1.745,"t":901.7},{"x":7.2303,"k":0.67851,"u":1.006,"t":933.0},{"x":7.2434,"k":0.58591,"u":0.477,"t":895.6},{"x":7.2565,"k":0.45965,"u":0.456,"t":884.4},{"x":7.2621,"k":0.76659,"u":1.621,"t":960.4},{"x":7.2714,"k":0.9029,"u":2.503,"t":930.2},{"x":7.2888,"k":1.09643,"u":0.797,"t":885.5},{"x":7.2981,"k":1.18718,"u":3.995,"t":876.0},{"x":7.3041,"k":0.68155,"u":0.851,"t":885.1},{"x":7.3148,"k":1.11281,"u":3.858,"t":927.8},{"x":7.3289,"k":0.63095,"u":0.904,"t":929.6},{"x":7.3395,"k":1.31771,"u":3.472,"t":971.7},{"x":7.3477,"k":0.73991,"u":1.66,"t":906.1},{"x":7.3584,"k":1.07239,"u":2.708,"t":948.1},{"x":7.3687,"k":0.64068,"u":0.694,"t":879.9},{"x":7.3767,"k":0.67162,"u":1.021,"t":956.3},{"x":7.3822,"k":0.78653,"u":0.31,"t":914.9},{"x":7.3991,"k":0.75536,"u":1.433,"t":925.9},{"x":7.4036,"k":1.10832,"u":0.834,"t":926.1},{"x":7.4185,"k":1.06476,"u":3.554,"t":969.2},{"x":7.4227,"k":1.24229,"u":3.871,"t":963.0},{"x":7.4348,"k":1.09318,"u":3.378,"t":954.3},{"x":7.4446,"k":0.62797,"u":0.943,"t":972.2},{"x":7.4512,"k":1.33485,"u":3.62,"t":901.3},{"x":7.4602,"k":0.59657,"u":0.319,"t":967.8},{"x":7.476,"k":0.92756,"u":3.487,"t":967.1},{"x":7.4822,"k":1.36756,"u":3.034,"t":943.8},{"x":7.4955,"k":0.52155,"u":0.544,"t":964.7},{"x":7.5083,"k":0.8642,"u":2.223,"t":958.7},{"x":7.5134,"k":0.92939,"u":3.546,"t":912.7},{"x":7.527,"k":1.09149,"u":2.897,"t":961.5},{"x":7.5389,"k":0.30603,"u":0.105,"t":919.0},{"x":7.5415,"k":0.95996,"u":3.224,"t":966.5},{"x":7.5527,"k":1.19107,"u":3.496,"t":970.4},{"x":7.5697,"k":0.55041,"u":0.431,"t":902.9},{"x":7.5719,"k":0.77426,"u":1.68,"t":936.0},{"x":7.58,"k":1.3275,"u":3.9,"t":927.1},{"x":7.5908,"k":1.26113,"u":3.087,"t":925.0},{"x":7.6088,"k":0.99584,"u":1.993,"t":923.5},{"x":7.6141,"k":1.33383,"u":2.876,"t":919.2},{"x":7.6216,"k":0.82493,"u":1.331,"t":898.9},{"x":7.6354,"k":0.43416,"u":0.157,"t":959.9},{"x":7.6411,"k":0.94203,"u":3.186,"t":915.2},{"x":7.6552,"k":0.85732,"u":2.394,"t":876.1},{"x":7.6606,"k":0.68358,"u":0.871,"t":906.7},{"x":7.6776,"k":0.87788,"u":2.765,"t":883.5},{"x":7.6866,"k":0.53265,"u":0.517,"t":971.4},{"x":7.6976,"k":0.68107,"u":0.665,"t":931.9},{"x":7.7032,"k":0.9203,"u":2.065,"t":933.9},{"x":7.712,"k":1.16766,"u":2.964,"t":910.2},{"x":7.7216,"k":0.80376,"u":1.836,"t":874.5},{"x":7.7333,"k":1.1856,"u":3.758,"t":922.8},{"x":7.7429,"k":0.89475,"u":1.464,"t":940.9},{"x":7.7576,"k":1.15122,"u":2.61,"t":917.8},{"x":7.7677,"k":1.07,"u":3.009,"t":963.2},{"x":7.7788,"k":0.84522,"u":2.471,"t":944.9},{"x":7.7869,"k":0.8355,"u":1.495,"t":931.2},{"x":7.7954,"k":0.63415,"u":0.759,"t":952.1},{"x":7.8091,"k":0.49728,"u":0.224,"t":886.1},{"x":7.8115,"k":0.75589,"u":0.213,"t":877.4},{"x":7.8236,"k":0.85633,"u":1.924,"t":876.9},{"x":7.8351,"k":0.6424,"u":0.973,"t":892.2},{"x":7.842,"k":1.05787,"u":1.525,"t":897.5},{"x":7.8531,"k":1.33381,"u":3.771,"t":932.6},{"x":7.8648,"k":1.1635,"u":2.537,"t":890.8},{"x":7.8767,"k":0.56474,"u":0.589,"t":907.7},{"x":7.8814,"k":0.43477,"u":0.272,"t":942.0},{"x":7.8937,"k":0.3326,"u":0.134,"t":904.5},{"x":7.9055,"k":0.81433,"u":1.228,"t":958.3},{"x":7.9142,"k":0.59783,"u":0.74,"t":886.8},{"x":7.9273,"k":0.95526,"u":2.617,"t":925.0},{"x":7.9389,"k":0.95856,"u":2.427,"t":950.9},{"x":7.9494,"k":0.97682,"u":3.957,"t":944.1},{"x":7.9575,"k":1.07122,"u":1.956,"t":900.2},{"x":7.9608,"k":1.37386,"u":2.933,"t":894.7},{"x":7.9786,"k":1.1932,"u":1.875,"t":910.8},{"x":7.9882,"k":1.00709,"u":3.702,"t":878.3},{"x":7.9905,"k":1.14058,"u":3.064,"t":893.4}];

    const X_MIN = 6.0, X_MAX = 8.0;
    const K_MIN = 0.25, K_MAX = 1.40;

    /* ── display elements ───────────────────────────── */
    const elBec  = document.getElementById('imap-bec');
    const elKeff = document.getElementById('imap-keff');
    const elUF4  = document.getElementById('imap-uf4');
    const elTemp = document.getElementById('imap-temp');

    /* ── state ──────────────────────────────────────── */
    let W, H, dpr;
    let raf = null, running = false;
    let frame = 0;

    /* Pointer follows a smooth path through the sorted points,
       interpolating between consecutive LHS samples */
    let pathIdx  = 0;   /* current segment */
    let pathFrac = 0;   /* 0–1 within segment */
    const PATH_SPEED = 0.008;  /* fraction per frame */

    /* ── geometry ───────────────────────────────────── */
    const PAD_L = 0.13, PAD_R = 0.06, PAD_T = 0.08, PAD_B = 0.13;
    function gL() { return W * PAD_L; }
    function gR() { return W * (1 - PAD_R); }
    function gT() { return H * PAD_T; }
    function gB() { return H * (1 - PAD_B); }
    function toCanvasX(bec)  { return gL() + (bec  - X_MIN) / (X_MAX - X_MIN) * (gR() - gL()); }
    function toCanvasY(keff) { return gB() - (keff - K_MIN) / (K_MAX - K_MIN) * (gB() - gT()); }

    /* interpolate between two data points */
    function interp(a, b, t) {
        return {
            x: a.x + (b.x - a.x) * t,
            k: a.k + (b.k - a.k) * t,
            u: a.u + (b.u - a.u) * t,
            t: a.t + (b.t - a.t) * t,
        };
    }

    /* k-eff → colour: blue (low) → white → red (high), with k=1 as white */
    function keffColor(k, alpha) {
        const t = (k - K_MIN) / (K_MAX - K_MIN);  /* 0–1 */
        let r, g, b;
        if (t < 0.5) {
            const s = t * 2;
            r = Math.round(88  + (255-88)  * s);
            g = Math.round(166 + (255-166) * s);
            b = Math.round(255 + (255-255) * s);
        } else {
            const s = (t - 0.5) * 2;
            r = 255;
            g = Math.round(255 + (80-255)  * s);
            b = Math.round(255 + (80-255)  * s);
        }
        return `rgba(${r},${g},${b},${alpha})`;
    }

    /* ── draw ───────────────────────────────────────── */
    function drawAxes() {
        const axCol = 'rgba(255,255,255,0.28)';
        const txtCol = 'rgba(255,255,255,0.45)';
        ctx.strokeStyle = axCol; ctx.lineWidth = 1.5;
        /* X */
        ctx.beginPath(); ctx.moveTo(gL(), gB()); ctx.lineTo(gR()+12, gB()); ctx.stroke();
        /* Y */
        ctx.beginPath(); ctx.moveTo(gL(), gB()); ctx.lineTo(gL(), gT()-12); ctx.stroke();
        /* arrowheads */
        ctx.fillStyle = axCol;
        ctx.beginPath(); ctx.moveTo(gR()+12,gB()-5); ctx.lineTo(gR()+20,gB()); ctx.lineTo(gR()+12,gB()+5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(gL()-5,gT()-12); ctx.lineTo(gL(),gT()-20); ctx.lineTo(gL()+5,gT()-12); ctx.fill();

        /* labels */
        const fs = Math.round(W * 0.023);
        ctx.font = `600 ${fs}px "JetBrains Mono",monospace`;
        ctx.fillStyle = txtCol; ctx.textAlign = 'center';
        ctx.fillText('Hrúbka Be₂C (cm)', gL() + (gR()-gL())/2, gB() + H*0.08);
        ctx.save(); ctx.translate(gL() - W*0.09, gT() + (gB()-gT())/2);
        ctx.rotate(-Math.PI/2); ctx.fillText('k-efektívne', 0, 0); ctx.restore();

        /* X ticks */
        ctx.font = `${Math.round(W*0.018)}px "JetBrains Mono",monospace`;
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.textAlign = 'center';
        for (let bec = 6.0; bec <= 8.01; bec += 0.5) {
            const cx = toCanvasX(bec);
            ctx.beginPath(); ctx.moveTo(cx, gB()); ctx.lineTo(cx, gB()+5); ctx.strokeStyle=axCol; ctx.lineWidth=0.8; ctx.stroke();
            ctx.fillText(bec.toFixed(1), cx, gB() + H*0.04);
        }
        /* Y ticks */
        ctx.textAlign = 'right';
        for (let k = 0.4; k <= 1.41; k += 0.2) {
            const cy = toCanvasY(k);
            ctx.beginPath(); ctx.moveTo(gL(), cy); ctx.lineTo(gL()-5, cy); ctx.strokeStyle=axCol; ctx.lineWidth=0.8; ctx.stroke();
            ctx.fillText(k.toFixed(1), gL() - W*0.015, cy + 4);
        }

        /* k=1 horizontal reference line */
        const cy1 = toCanvasY(1.0);
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = 'rgba(239,83,80,0.50)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(gL(), cy1); ctx.lineTo(gR(), cy1); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = `${Math.round(W*0.016)}px "JetBrains Mono",monospace`;
        ctx.fillStyle = 'rgba(239,83,80,0.70)'; ctx.textAlign = 'left';
        ctx.fillText('k = 1,0', gR() + 4, cy1 + 4);
    }

    function drawScatter() {
        PTS.forEach(p => {
            const cx = toCanvasX(p.x), cy = toCanvasY(p.k);
            const r = W * 0.007;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
            ctx.fillStyle = keffColor(p.k, 0.55);
            ctx.fill();
        });
    }

    function drawPointer(cur) {
        const cx = toCanvasX(cur.x), cy = toCanvasY(cur.k);
        /* crosshair lines */
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.8;
        ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(gL(), cy); ctx.lineTo(cx, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, gB()); ctx.lineTo(cx, cy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        /* projection dot on axes */
        ctx.beginPath(); ctx.arc(gL(), cy, 4, 0, Math.PI*2);
        ctx.fillStyle = '#f0b952'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, gB(), 4, 0, Math.PI*2);
        ctx.fillStyle = '#f0b952'; ctx.fill();

        /* main pointer dot */
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, W*0.045);
        glow.addColorStop(0,   'rgba(240,185,82,0.7)');
        glow.addColorStop(0.4, 'rgba(240,185,82,0.25)');
        glow.addColorStop(1,   'rgba(240,185,82,0)');
        ctx.beginPath(); ctx.arc(cx, cy, W*0.045, 0, Math.PI*2);
        ctx.fillStyle = glow; ctx.fill();

        ctx.beginPath(); ctx.arc(cx, cy, W*0.013, 0, Math.PI*2);
        ctx.fillStyle = '#f0b952'; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function updateLabels(cur) {
        if (elBec)  elBec.textContent  = cur.x.toFixed(3) + ' cm';
        if (elKeff) {
            elKeff.textContent = cur.k.toFixed(4);
            /* colour the keff value */
            elKeff.style.color = keffColor(cur.k, 1).replace(/,[^,]+\)/, ',1)');
        }
        if (elUF4)  elUF4.textContent  = cur.u.toFixed(2) + ' %';
        if (elTemp) elTemp.textContent = cur.t.toFixed(0) + ' K';
    }

    /* ── main loop ──────────────────────────────────── */
    function tick() {
        /* advance path */
        pathFrac += PATH_SPEED;
        if (pathFrac >= 1) {
            pathFrac -= 1;
            pathIdx = (pathIdx + 1) % PTS.length;
        }
        const a = PTS[pathIdx];
        const b = PTS[(pathIdx + 1) % PTS.length];
        const cur = interp(a, b, pathFrac);

        ctx.clearRect(0, 0, W, H);
        drawAxes();
        drawScatter();
        drawPointer(cur);
        updateLabels(cur);

        frame++;
        raf = requestAnimationFrame(tick);
    }

    /* ── lifecycle ──────────────────────────────────── */
    function resize() {
        dpr = window.devicePixelRatio || 1;
        const r = canvas.getBoundingClientRect();
        W = r.width  || canvas.offsetWidth  || 500;
        H = r.height || canvas.offsetHeight || 400;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);
    }

    canvas._startMap = function () {
        if (running) return;
        running = true;
        resize();
        tick();
    };
    canvas._stopMap = function () {
        running = false;
        if (raf) { cancelAnimationFrame(raf); raf = null; }
    };

    if (SLIDE) {
        new MutationObserver(() => {
            if (SLIDE.classList.contains('active')) canvas._startMap();
            else canvas._stopMap();
        }).observe(SLIDE, { attributes: true, attributeFilter: ['class'] });
    }
})();

