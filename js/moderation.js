/* ============================================================
   MODERATION.JS — Single large nucleus animation for slide 6.

   Behaviour:
   • One big nucleus rendered at the centre of the slide using
     the same sub-particle (proton/neutron dot cluster) design
     from neutrons.js.
   • Neutrons spawn periodically from a random edge of the screen
     and travel toward the nucleus area.
   • On collision the neutron bounces/deflects AND loses energy
     (speed drops significantly — showing moderation).
   • Each neutron leaves a glowing wave-trail identical to the
     main animation.
   • When a neutron reaches the opposite edge it fades out and
     is removed.
   ============================================================ */

(function () {
    'use strict';

    const canvas = document.getElementById('moderation-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* ---- Tuning ---- */
    const NUCLEUS_R       = 110;      /* big central nucleus */
    const SPAWN_INTERVAL  = 110;      /* frames between new neutron spawns */
    const SPEED_FAST      = 7.5;      /* initial speed (fast / unmoderated)  */
    const SPEED_SLOW      = 1.8;      /* speed after hitting nucleus (moderated) */
    const TRAIL_LIFETIME  = 32;
    const TRAIL_SPACING   = 5;
    const DOT_RADIUS      = 3.5;
    const FLASH_DURATION  = 30;
    const WAVE_AMPLITUDE  = 8;
    const WAVE_PERIOD     = 50;
    const FADE_MARGIN     = 60;       /* px from edge where neutron starts fading */

    /* Sub-particle shells — same as neutrons.js but scaled for big nucleus */
    const SHELLS = [
        { rFrac: 0.0,  count: 1  },
        { rFrac: 0.25, count: 6  },
        { rFrac: 0.50, count: 12 },
        { rFrac: 0.75, count: 18 },
    ];

    let W, H;
    let nucleus   = null;
    let neutrons  = [];
    let dots      = [];
    let frameCount = 0;
    let raf       = null;
    let running   = false;

    const rand = (lo, hi) => lo + Math.random() * (hi - lo);

    /* ---- Resize ---- */
    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        if (nucleus) { nucleus.x = W / 2; nucleus.y = H / 2; }
    }

    /* ---- Build nucleus ---- */
    function makeNucleus() {
        const subDots = [];
        SHELLS.forEach(shell => {
            const n = shell.count;
            const r = shell.rFrac * NUCLEUS_R;
            for (let i = 0; i < n; i++) {
                const angle = (i / n) * Math.PI * 2 + shell.rFrac * 1.1;
                subDots.push({
                    dx: Math.cos(angle) * r,
                    dy: Math.sin(angle) * r,
                    isProton: (i % 2 === 0),
                });
            }
        });
        return { x: W / 2, y: H / 2, r: NUCLEUS_R, flash: 0, pulse: 0, subDots };
    }

    /* ---- Spawn a neutron from a random edge pointing toward nucleus ---- */
    function spawnNeutron() {
        const side = Math.floor(rand(0, 4)); // 0=top 1=right 2=bottom 3=left
        let sx, sy;
        switch (side) {
            case 0: sx = rand(0, W);  sy = -10;    break;
            case 1: sx = W + 10;      sy = rand(0, H); break;
            case 2: sx = rand(0, W);  sy = H + 10; break;
            default: sx = -10;        sy = rand(0, H); break;
        }

        /* Aim toward nucleus ± small random offset */
        const tx = nucleus.x + rand(-NUCLEUS_R * 1.5, NUCLEUS_R * 1.5);
        const ty = nucleus.y + rand(-NUCLEUS_R * 1.5, NUCLEUS_R * 1.5);
        const dx = tx - sx;
        const dy = ty - sy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;

        return {
            x: sx, y: sy,
            vx: (dx / len) * SPEED_FAST,
            vy: (dy / len) * SPEED_FAST,
            moderated: false,   /* true after first nucleus hit */
            alpha: 1,
            distSinceLastDot: 0,
            distTravelled: rand(0, WAVE_PERIOD),
            dead: false,
        };
    }

    /* ---- Init ---- */
    function init() {
        resize();
        nucleus  = makeNucleus();
        neutrons = [];
        dots     = [];
        frameCount = 0;
    }

    /* ---- Compute alpha for a neutron near the edge ---- */
    function edgeAlpha(n) {
        const d = Math.min(n.x, n.y, W - n.x, H - n.y);
        if (d < FADE_MARGIN) return Math.max(0, d / FADE_MARGIN);
        return 1;
    }

    /* ---- Physics step ---- */
    function step() {
        frameCount++;

        /* Spawn a new neutron periodically */
        if (frameCount % SPAWN_INTERVAL === 0) {
            neutrons.push(spawnNeutron());
        }

        /* Move neutrons */
        neutrons.forEach(n => {
            if (n.dead) return;

            const prevX = n.x;
            const prevY = n.y;

            n.x += n.vx;
            n.y += n.vy;

            /* Compute alpha (fade near edges) */
            n.alpha = edgeAlpha(n);

            /* Remove once fully off-screen */
            if (n.x < -40 || n.x > W + 40 || n.y < -40 || n.y > H + 40) {
                n.dead = true;
                return;
            }

            /* Trail dots */
            const stepDx = n.x - prevX;
            const stepDy = n.y - prevY;
            const stepDist = Math.sqrt(stepDx * stepDx + stepDy * stepDy);
            n.distSinceLastDot += stepDist;
            n.distTravelled    += stepDist;

            const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy) || 1;
            const perpX = -n.vy / speed;
            const perpY =  n.vx / speed;

            while (n.distSinceLastDot >= TRAIL_SPACING) {
                n.distSinceLastDot -= TRAIL_SPACING;
                const wave = Math.sin((n.distTravelled / WAVE_PERIOD) * Math.PI * 2) * WAVE_AMPLITUDE;
                dots.push({
                    x:     n.x + perpX * wave,
                    y:     n.y + perpY * wave,
                    life:  TRAIL_LIFETIME,
                    alpha: n.alpha,
                    /* moderated neutrons get a warm amber trail */
                    warm:  n.moderated,
                });
            }

            /* Nucleus collision */
            const nuc = nucleus;
            const cdx  = n.x - nuc.x;
            const cdy  = n.y - nuc.y;
            const dist = Math.sqrt(cdx * cdx + cdy * cdy);
            const minD = nuc.r + 6;

            if (dist < minD && !n.moderated) {
                /* Reflect off nucleus surface */
                const nx  = cdx / (dist || 1);
                const ny  = cdy / (dist || 1);
                const dot = n.vx * nx + n.vy * ny;
                n.vx -= 2 * dot * nx;
                n.vy -= 2 * dot * ny;

                /* Big speed reduction — moderation */
                const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy) || 1;
                n.vx = (n.vx / spd) * SPEED_SLOW;
                n.vy = (n.vy / spd) * SPEED_SLOW;

                /* Push out of nucleus */
                n.x = nuc.x + nx * (minD + 2);
                n.y = nuc.y + ny * (minD + 2);

                n.moderated = true;
                nuc.flash   = FLASH_DURATION;
            }
        });

        /* Purge dead neutrons */
        neutrons = neutrons.filter(n => !n.dead);

        /* Age trail dots */
        for (let i = dots.length - 1; i >= 0; i--) {
            dots[i].life--;
            if (dots[i].life <= 0) dots.splice(i, 1);
        }

        /* Pulse nucleus */
        nucleus.pulse += 0.016;
        if (nucleus.flash > 0) nucleus.flash--;
    }

    /* ---- Draw ---- */
    function draw() {
        ctx.clearRect(0, 0, W, H);

        /* Trail dots */
        dots.forEach(d => {
            const t = d.life / TRAIL_LIFETIME;
            const a = t * 0.75 * (d.alpha || 1);
            const r = DOT_RADIUS * (0.4 + t * 0.6);
            const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 2.8);
            if (d.warm) {
                g.addColorStop(0,   `rgba(255, 200, 100, ${a})`);
                g.addColorStop(0.4, `rgba(240, 150,  60, ${a * 0.65})`);
            } else {
                g.addColorStop(0,   `rgba(180, 220, 255, ${a})`);
                g.addColorStop(0.4, `rgba(88,  166, 255, ${a * 0.65})`);
            }
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(d.x, d.y, r * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        });

        /* ---- Nucleus ---- */
        const nuc        = nucleus;
        const isFlashing = nuc.flash > 0;
        const flashT     = isFlashing ? nuc.flash / FLASH_DURATION : 0;
        const pulseScale = 1 + Math.sin(nuc.pulse) * 0.025;
        const pr         = nuc.r * pulseScale;

        /* Outer glow */
        const glowR = pr + 40;
        const glow  = ctx.createRadialGradient(nuc.x, nuc.y, pr * 0.4, nuc.x, nuc.y, glowR);
        glow.addColorStop(0, isFlashing
            ? `rgba(240, 185, 82, ${0.18 + flashT * 0.28})`
            : `rgba(88, 166, 255, ${0.10 + Math.sin(nuc.pulse) * 0.04})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(nuc.x, nuc.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        /* Boundary ring */
        ctx.beginPath();
        ctx.arc(nuc.x, nuc.y, pr, 0, Math.PI * 2);
        ctx.strokeStyle = isFlashing
            ? `rgba(240, 185, 82, ${0.55 + flashT * 0.35})`
            : 'rgba(88, 166, 255, 0.35)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        /* Sub-particles */
        nuc.subDots.forEach(sd => {
            const rotAngle = nuc.pulse * 0.12 * (sd.isProton ? 1 : -1);
            const cosA = Math.cos(rotAngle);
            const sinA = Math.sin(rotAngle);
            const sx = nuc.x + sd.dx * cosA - sd.dy * sinA;
            const sy = nuc.y + sd.dx * sinA + sd.dy * cosA;
            const sr = 4;

            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            if (isFlashing) {
                ctx.fillStyle = `rgba(240, 185, 82, ${0.75 + flashT * 0.25})`;
            } else if (sd.isProton) {
                ctx.fillStyle = 'rgba(255, 140, 140, 0.82)';
            } else {
                ctx.fillStyle = 'rgba(120, 190, 255, 0.82)';
            }
            ctx.fill();
        });
    }

    /* ---- Loop ---- */
    function loop() {
        if (!running) return;
        step();
        draw();
        raf = requestAnimationFrame(loop);
    }

    function start() { if (running) return; running = true; loop(); }
    function stop()  { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }

    /* ---- Lifecycle — watch the moderation slide becoming active ---- */
    const modSlide = document.querySelector('.slide--moderation');
    if (!modSlide) return;

    const observer = new MutationObserver(() => {
        if (modSlide.classList.contains('active')) {
            init(); start();
        } else {
            stop();
        }
    });
    observer.observe(modSlide, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('resize', () => { if (running) resize(); });

    if (modSlide.classList.contains('active')) { init(); start(); }

})();

