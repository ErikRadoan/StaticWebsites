/* ============================================================
   SIMPARAMS.JS
   ① Spinning 3D reactor model  —  Three.js WebGL on slide 22
   ② Scrolling ENDF data table  —  canvas on slide 22 (bottom strip)
   ③ Full-page faint ENDF table —  canvas background on slide 20
   ============================================================ */

(function () {
    'use strict';

    /* ------------------------------------------------------------------ */
    /*  ① SPINNING 3D REACTOR  — Three.js WebGL                            */
    /* ------------------------------------------------------------------ */

    const reactorCanvas = document.getElementById('reactor-3d');
    let reactorRAF     = null;
    let reactorRunning = false;
    let threeScene     = null;

    function initThreeReactor() {
        if (!reactorCanvas || !window.THREE) return;
        const THREE = window.THREE;

        const w = reactorCanvas.offsetWidth  || 320;
        const h = reactorCanvas.offsetHeight || 220;

        const renderer = new THREE.WebGLRenderer({ canvas: reactorCanvas, antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
        renderer.setClearColor(0x000000, 0);

        const scene  = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(16, w / h, 0.1, 2000);
        camera.position.set(0, 50, 800);
        camera.lookAt(0, 0, 0);

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const key  = new THREE.PointLight(0xffffff, 1.6, 700);
        key.position.set(150, 200, 200);
        scene.add(key);
        const fill = new THREE.PointLight(0x8ab4f8, 0.5, 500);
        fill.position.set(-100, -60, 100);
        scene.add(fill);

        const LAYERS = [
            { r: 35, h: 200, color: 0xef5350, name: 'FLiBe'    },
            { r: 45, h: 200, color: 0x78909c, name: 'Grafit'    },
            { r: 75, h: 200, color: 0xfb8c00, name: 'Be\u2082C' },
            { r: 77, h: 200, color: 0x5c6bc0, name: 'Hastelloy' },
        ];

        const group = new THREE.Group();

        LAYERS.forEach((layer, i) => {
            const cyl = new THREE.Mesh(
                new THREE.CylinderGeometry(layer.r, layer.r, layer.h, 64, 1, true),
                new THREE.MeshPhongMaterial({
                    color: layer.color, emissive: layer.color, emissiveIntensity: 0.08,
                    shininess: 55, side: THREE.DoubleSide,
                    transparent: true, opacity: i === 0 ? 0.92 : 0.82,
                })
            );
            group.add(cyl);

            const innerR = i > 0 ? LAYERS[i - 1].r : 0;
            const cap = new THREE.Mesh(
                new THREE.RingGeometry(innerR, layer.r, 64),
                new THREE.MeshPhongMaterial({
                    color: layer.color, emissive: layer.color, emissiveIntensity: 0.12,
                    shininess: 40, side: THREE.DoubleSide,
                })
            );
            cap.rotation.x = -Math.PI / 2;
            cap.position.y = layer.h / 2;
            group.add(cap);
        });

        /* Bottom disc for core */
        const bot = new THREE.Mesh(
            new THREE.CircleGeometry(LAYERS[0].r, 64),
            new THREE.MeshPhongMaterial({
                color: LAYERS[0].color, emissive: LAYERS[0].color,
                emissiveIntensity: 0.1, side: THREE.DoubleSide,
            })
        );
        bot.rotation.x = Math.PI / 2;
        bot.position.y = -LAYERS[0].h / 2;
        group.add(bot);


        group.rotation.x = 0.28;
        scene.add(group);
        threeScene = { renderer, scene, camera, group };
    }


    function tickReactor() {
        if (!threeScene) return;
        threeScene.group.rotation.y += 0.008;
        threeScene.renderer.render(threeScene.scene, threeScene.camera);
        reactorRAF = requestAnimationFrame(tickReactor);
    }

    window.startReactor = function () {
        if (reactorRunning) return;
        reactorRunning = true;
        if (!threeScene) initThreeReactor();
        if (threeScene) {
            const w = reactorCanvas.offsetWidth  || 320;
            const h = reactorCanvas.offsetHeight || 220;
            threeScene.renderer.setSize(w, h);
            threeScene.camera.aspect = w / h;
            threeScene.camera.updateProjectionMatrix();
        }
        tickReactor();
    };

    window.stopReactor = function () {
        reactorRunning = false;
        if (reactorRAF) { cancelAnimationFrame(reactorRAF); reactorRAF = null; }
    };


    /* ------------------------------------------------------------------ */
    /*  ② ENDF SCROLLING TABLE  (small strip on slide 22)                  */
    /* ------------------------------------------------------------------ */

    const endfCanvas22 = document.getElementById('endf-scroll-22');
    if (endfCanvas22) {
        setupEndfScroller(endfCanvas22, 0.18, 0.7, 12);
    }


    /* ------------------------------------------------------------------ */
    /*  ③ FULL-PAGE FAINT ENDF TABLE  (background of slide 20)             */
    /* ------------------------------------------------------------------ */

    const endfCanvas20 = document.getElementById('endf-scroll-20');
    if (endfCanvas20) {
        setupEndfScroller(endfCanvas20, 0.035, 0.22, 13);
    }


    /* ------------------------------------------------------------------ */
    /*  SHARED:  ENDF scroller factory                                      */
    /*   alpha      – text alpha (foreground brightness)                    */
    /*   speed      – pixels per frame                                      */
    /*   fontSize   – px (will be scaled by dpr)                            */
    /*   fullBg     – if true, fill entire canvas with generated rows       */
    /* ------------------------------------------------------------------ */

    function setupEndfScroller(canvas, alpha, speed, fontSize) {

        const ctx = canvas.getContext('2d');
        let   raf = null;
        let   running = false;
        let   offsetY = 0;

        /* ---- Realistic ENDF/B-VII.1 data rows ---- */
        const NUCLIDES = [
            'U-233','U-234','U-235','U-238',
            'Th-232','Th-233',
            'Pa-233','Pa-231',
            'Be-9','C-0',
            'Li-6','Li-7',
            'F-19',
            'Ni-58','Ni-60','Mo-92','Mo-95',
            'Fe-56','Cr-52','Si-28',
        ];
        const REACTIONS = [
            { mt:'MT=18', label:'fission          ' },
            { mt:'MT=102',label:'(n,gamma)        ' },
            { mt:'MT=2',  label:'elastic scatter  ' },
            { mt:'MT=4',  label:'inelastic scatter' },
            { mt:'MT=16', label:'(n,2n)           ' },
            { mt:'MT=1',  label:'total            ' },
            { mt:'MT=27', label:'absorption       ' },
            { mt:'MT=452',label:'nubar (total)    ' },
        ];
        const ENERGIES_EV = [
            '1.000E-05','2.530E-02','1.000E+00','1.000E+02',
            '1.000E+03','1.000E+04','1.000E+05','1.000E+06',
            '2.000E+06','5.000E+06','1.000E+07','1.400E+07',
            '4.000E-01','6.674E-01','1.013E+00','3.050E-02',
            '8.200E-02','5.190E-01','2.380E+03','2.190E+05',
        ];

        /* Generate a long list of rows once */
        const ROWS = [];
        let seed = 137;
        function rng() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }
        function rngInt(n) { return Math.floor(rng() * n); }

        for (let i = 0; i < 400; i++) {
            const nuc  = NUCLIDES[rngInt(NUCLIDES.length)];
            const rxn  = REACTIONS[rngInt(REACTIONS.length)];
            const E    = ENERGIES_EV[rngInt(ENERGIES_EV.length)];
            const xs   = (rng() * 990 + 0.001).toExponential(4).replace('e+','E+').replace('e-','E-');
            const unc  = (rng() * 0.08 + 0.001).toFixed(4);
            const temp = ['294K','600K','900K','1200K'][rngInt(4)];
            ROWS.push(
                `  ${nuc.padEnd(8)}  ${rxn.mt.padEnd(8)}  ${rxn.label}  E=${E} eV   xs=${xs} b   unc=${unc}   T=${temp}`
            );
        }

        function resize() {
            const rect = canvas.getBoundingClientRect();
            const w = rect.width  || canvas.offsetWidth  || canvas.parentElement.offsetWidth  || window.innerWidth;
            const h = rect.height || canvas.offsetHeight || canvas.parentElement.offsetHeight || window.innerHeight;
            canvas.width  = w * devicePixelRatio;
            canvas.height = h * devicePixelRatio;
        }

        function draw() {
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            const fsPx   = fontSize * devicePixelRatio;
            const lineH  = fsPx * 1.55;
            const nRows  = Math.ceil(H / lineH) + 2;

            ctx.font         = `${fsPx}px "JetBrains Mono", "Fira Code", Courier, monospace`;
            ctx.textBaseline = 'top';

            /* Accent colour for specific keywords */
            const colDefault = `rgba(88,166,255,${alpha})`;
            const colAccent  = `rgba(240,185,82,${alpha * 1.4})`;

            const startRow = Math.floor(offsetY / lineH);
            const pixelOffset = offsetY % lineH;

            for (let ri = 0; ri < nRows; ri++) {
                const rowIdx = (startRow + ri) % ROWS.length;
                const row    = ROWS[rowIdx];
                const y      = ri * lineH - pixelOffset;

                /* Alternate colouring: highlight rows containing U-233 or fission */
                if (row.includes('U-233') || row.includes('MT=18')) {
                    ctx.fillStyle = colAccent;
                } else if (row.includes('U-238') || row.includes('Th-232')) {
                    ctx.fillStyle = `rgba(165,214,167,${alpha * 1.2})`;
                } else {
                    ctx.fillStyle = colDefault;
                }
                ctx.fillText(row, 0, y);
            }

            /* vertical fade-out top & bottom edges */
            const fadeH = H * 0.12;
            const fadeTop = ctx.createLinearGradient(0, 0, 0, fadeH);
            fadeTop.addColorStop(0,   'rgba(14,17,23,1)');
            fadeTop.addColorStop(1,   'rgba(14,17,23,0)');
            const fadeBot = ctx.createLinearGradient(0, H - fadeH, 0, H);
            fadeBot.addColorStop(0,   'rgba(14,17,23,0)');
            fadeBot.addColorStop(1,   'rgba(14,17,23,1)');
            ctx.fillStyle = fadeTop; ctx.fillRect(0, 0, W, fadeH);
            ctx.fillStyle = fadeBot; ctx.fillRect(0, H - fadeH, W, fadeH);

            offsetY += speed;
            if (offsetY > ROWS.length * lineH) offsetY = 0;
        }

        function tick() {
            draw();
            raf = requestAnimationFrame(tick);
        }

        canvas._startEndf = function() {
            if (running) return;
            running = true;
            resize();
            tick();
        };
        canvas._stopEndf = function() {
            running = false;
            if (raf) { cancelAnimationFrame(raf); raf = null; }
        };
    }


    /* ------------------------------------------------------------------ */
    /*  LIFECYCLE: start/stop with slide activation                         */
    /* ------------------------------------------------------------------ */

    const SLIDE_20 = document.querySelector('[data-slide="20"]');
    const SLIDE_22 = document.querySelector('[data-slide="22"]');

    /* MutationObserver watches for the .active class being added/removed */
    const observer = new MutationObserver(() => {
        /* Slide 20 — faint full-bg ENDF scroller */
        if (SLIDE_20) {
            const c = document.getElementById('endf-scroll-20');
            if (c) {
                if (SLIDE_20.classList.contains('active')) c._startEndf && c._startEndf();
                else                                        c._stopEndf  && c._stopEndf();
            }
        }
        /* Slide 22 — reactor + small ENDF scroller */
        if (SLIDE_22) {
            if (SLIDE_22.classList.contains('active')) {
                window.startReactor && window.startReactor();
                const c = document.getElementById('endf-scroll-22');
                if (c) c._startEndf && c._startEndf();
            } else {
                window.stopReactor && window.stopReactor();
                const c = document.getElementById('endf-scroll-22');
                if (c) c._stopEndf && c._stopEndf();
            }
        }
    });

    [SLIDE_20, SLIDE_22].forEach(el => {
        if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    });

})();






