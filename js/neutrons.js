/* ============================================================
   NEUTRONS.JS — Neutron moderation particle animation

   Neutrons:  invisible moving balls — they leave behind a trail
              of small static glowing dot-particles that fade out
              over their lifetime.  No wave, no head dot visible.

   Nuclei:    all the same radius, rendered as a cluster of small
              proton (red-tinted) and neutron (blue-tinted) dots
              packed in concentric shells inside the nucleus circle.
              A soft outer glow ring pulses gently.
              On collision the whole nucleus flashes amber.
   ============================================================ */

(function () {
    'use strict';

    const canvas = document.getElementById('neutron-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* ---- Tuning ---- */
    const NUCLEUS_COUNT   = 8;
    const NUCLEUS_R       = 38;          /* all nuclei same radius */
    const NEUTRON_COUNT   = 16;
    const SPEED_MIN       = 5.0;         /* px / frame */
    const SPEED_MAX       = 9.0;
    const TRAIL_LIFETIME  = 28;          /* frames each trail dot lives */
    const TRAIL_SPACING   = 4;           /* spawn a dot every N px travelled */
    const DOT_RADIUS      = 3.5;
    const FLASH_DURATION  = 24;
    const WAVE_AMPLITUDE  = 9;           /* px — perpendicular oscillation width */
    const WAVE_PERIOD     = 48;          /* px — one full oscillation cycle */

    /* Sub-particle layout inside a nucleus:
       shell radii as fractions of NUCLEUS_R, dots per shell */
    const SHELLS = [
        { rFrac: 0.0,  count: 1  },   /* centre dot */
        { rFrac: 0.35, count: 6  },   /* inner shell */
        { rFrac: 0.68, count: 12 },   /* outer shell */
    ];

    let W, H;
    let nuclei   = [];
    let neutrons = [];
    let dots     = [];   /* trail particles pool */
    let raf      = null;
    let running  = false;

    /* ---- Helpers ---- */
    const rand  = (lo, hi) => lo + Math.random() * (hi - lo);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        nuclei.forEach(n => {
            n.x = clamp(n.x, NUCLEUS_R + 20, W - NUCLEUS_R - 20);
            n.y = clamp(n.y, NUCLEUS_R + 20, H - NUCLEUS_R - 20);
        });
    }

    /* ---- Nucleus factory ---- */
    function makeNucleus() {
        /* Pre-compute sub-particle positions once (they are static relative
           to nucleus centre — they don't orbit, they just sit there) */
        const subDots = [];
        SHELLS.forEach(shell => {
            const n = shell.count;
            const r = shell.rFrac * NUCLEUS_R;
            for (let i = 0; i < n; i++) {
                const angle = (i / n) * Math.PI * 2 + (shell.rFrac * 1.3); /* slight offset per shell */
                subDots.push({
                    dx: Math.cos(angle) * r,
                    dy: Math.sin(angle) * r,
                    /* Alternate proton (warm) / neutron (cool) colouring */
                    isProton: (i % 2 === 0),
                });
            }
        });

        return {
            x: rand(NUCLEUS_R + 60, W - NUCLEUS_R - 60),
            y: rand(NUCLEUS_R + 60, H - NUCLEUS_R - 60),
            r: NUCLEUS_R,
            flash: 0,
            pulse: rand(0, Math.PI * 2),
            subDots,
        };
    }

    /* ---- Neutron factory ---- */
    function makeNeutron() {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(SPEED_MIN, SPEED_MAX);
        return {
            x:    rand(80, W - 80),
            y:    rand(80, H - 80),
            vx:   Math.cos(angle) * speed,
            vy:   Math.sin(angle) * speed,
            distSinceLastDot: 0,
            distTravelled:    rand(0, WAVE_PERIOD),  /* random start phase */
        };
    }

    function init() {
        resize();
        nuclei   = Array.from({ length: NUCLEUS_COUNT  }, makeNucleus);
        neutrons = Array.from({ length: NEUTRON_COUNT  }, makeNeutron);
        dots     = [];
    }

    /* ---- Physics ---- */
    function step() {
        /* Move neutrons */
        neutrons.forEach(n => {
            const prevX = n.x;
            const prevY = n.y;

            n.x += n.vx;
            n.y += n.vy;

            /* Wall bounce */
            if (n.x < 0)  { n.x = 0;  n.vx =  Math.abs(n.vx); }
            if (n.x > W)  { n.x = W;  n.vx = -Math.abs(n.vx); }
            if (n.y < 0)  { n.y = 0;  n.vy =  Math.abs(n.vy); }
            if (n.y > H)  { n.y = H;  n.vy = -Math.abs(n.vy); }

            /* Spawn trail dots based on distance travelled */
            const dx = n.x - prevX;
            const dy = n.y - prevY;
            const stepDist = Math.sqrt(dx * dx + dy * dy);
            n.distSinceLastDot += stepDist;
            n.distTravelled    += stepDist;

            /* Perpendicular unit vector (rotate velocity 90°) */
            const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy) || 1;
            const perpX = -n.vy / speed;
            const perpY =  n.vx / speed;

            while (n.distSinceLastDot >= TRAIL_SPACING) {
                n.distSinceLastDot -= TRAIL_SPACING;
                /* Sine offset in the perpendicular direction */
                const wave = Math.sin((n.distTravelled / WAVE_PERIOD) * Math.PI * 2)
                             * WAVE_AMPLITUDE;
                dots.push({
                    x:    n.x + perpX * wave,
                    y:    n.y + perpY * wave,
                    life: TRAIL_LIFETIME,
                });
            }

            /* Nucleus collisions */
            nuclei.forEach(nuc => {
                const cdx  = n.x - nuc.x;
                const cdy  = n.y - nuc.y;
                const dist = Math.sqrt(cdx * cdx + cdy * cdy);
                const minD = nuc.r + 4;
                if (dist < minD) {
                    const nx  = cdx / (dist || 1);
                    const ny  = cdy / (dist || 1);
                    const dot = n.vx * nx + n.vy * ny;
                    n.vx -= 2 * dot * nx;
                    n.vy -= 2 * dot * ny;
                    /* Slight moderation — small speed reduction */
                    const spd    = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
                    const newSpd = Math.max(SPEED_MIN, spd * 0.93);
                    n.vx = (n.vx / spd) * newSpd;
                    n.vy = (n.vy / spd) * newSpd;
                    n.x  = nuc.x + nx * (minD + 1);
                    n.y  = nuc.y + ny * (minD + 1);
                    nuc.flash = FLASH_DURATION;
                }
            });
        });

        /* Age trail dots — remove dead ones */
        for (let i = dots.length - 1; i >= 0; i--) {
            dots[i].life--;
            if (dots[i].life <= 0) dots.splice(i, 1);
        }

        /* Tick nucleus pulse/flash */
        nuclei.forEach(nuc => {
            nuc.pulse += 0.018;
            if (nuc.flash > 0) nuc.flash--;
        });
    }

    /* ---- Draw ---- */
    function draw() {
        ctx.clearRect(0, 0, W, H);

        /* --- Trail dots --- */
        dots.forEach(d => {
            const t = d.life / TRAIL_LIFETIME;   /* 1 = fresh, 0 = dying */
            const alpha = t * 0.8;
            const r = DOT_RADIUS * (0.4 + t * 0.6);   /* shrink as they age */

            /* Radial gradient for each dot — glowing core */
            const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 2.5);
            g.addColorStop(0,   `rgba(180, 220, 255, ${alpha})`);
            g.addColorStop(0.4, `rgba(88,  166, 255, ${alpha * 0.7})`);
            g.addColorStop(1,   `rgba(88,  166, 255, 0)`);

            ctx.beginPath();
            ctx.arc(d.x, d.y, r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        });

        /* --- Nuclei --- */
        nuclei.forEach(nuc => {
            const isFlashing = nuc.flash > 0;
            const flashT     = isFlashing ? nuc.flash / FLASH_DURATION : 0;
            const pulseScale = 1 + Math.sin(nuc.pulse) * 0.04;   /* ±4% size pulse */
            const pr         = nuc.r * pulseScale;

            /* Outer soft glow */
            const glowR = pr + 20;
            const glow  = ctx.createRadialGradient(nuc.x, nuc.y, pr * 0.5, nuc.x, nuc.y, glowR);
            glow.addColorStop(0, isFlashing
                ? `rgba(240, 185, 82, ${0.15 + flashT * 0.25})`
                : `rgba(88, 166, 255, ${0.10 + Math.sin(nuc.pulse) * 0.04})`);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(nuc.x, nuc.y, glowR, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();

            /* Nucleus boundary ring */
            ctx.beginPath();
            ctx.arc(nuc.x, nuc.y, pr, 0, Math.PI * 2);
            ctx.strokeStyle = isFlashing
                ? `rgba(240, 185, 82, ${0.55 + flashT * 0.35})`
                : 'rgba(88, 166, 255, 0.30)';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            /* Sub-particles (protons + neutrons) inside nucleus */
            nuc.subDots.forEach(sd => {
                /* The sub-dots rotate very slowly to give life */
                const rotAngle = nuc.pulse * 0.15 * (sd.isProton ? 1 : -1);
                const cosA = Math.cos(rotAngle);
                const sinA = Math.sin(rotAngle);
                const sx = nuc.x + sd.dx * cosA - sd.dy * sinA;
                const sy = nuc.y + sd.dx * sinA + sd.dy * cosA;
                const sr = 3.5;   /* sub-particle radius */

                if (isFlashing) {
                    ctx.beginPath();
                    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(240, 185, 82, ${0.7 + flashT * 0.3})`;
                    ctx.fill();
                } else if (sd.isProton) {
                    /* Proton: warm red-pink */
                    ctx.beginPath();
                    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 140, 140, 0.80)';
                    ctx.fill();
                } else {
                    /* Neutron: cool blue */
                    ctx.beginPath();
                    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(120, 190, 255, 0.80)';
                    ctx.fill();
                }
            });
        });
    }

    /* ---- Loop ---- */
    function loop() {
        if (!running) return;
        step();
        draw();
        raf = requestAnimationFrame(loop);
    }

    function start() {
        if (running) return;
        running = true;
        loop();
    }

    function stop() {
        running = false;
        if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    /* ---- Lifecycle ---- */
    const neutronSlide = document.querySelector('.slide--neutrons');
    if (!neutronSlide) return;

    const observer = new MutationObserver(() => {
        if (neutronSlide.classList.contains('active')) {
            init();
            start();
        } else {
            stop();
        }
    });
    observer.observe(neutronSlide, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('resize', () => { if (running) resize(); });

    if (neutronSlide.classList.contains('active')) {
        init();
        start();
    }

})();
