/* ============================================================
   PRESENTATION.JS — Slide engine

   Features:
   • Left / Right arrow keyboard navigation
   • Hash-based URL routing (#slide=3)
   • Progress bar updates
   • Slide counter updates
   • Touch swipe support (mobile)
   ============================================================ */

(function () {
    'use strict';

    // ---- DOM refs ----
    const slides       = Array.from(document.querySelectorAll('.slide'));
    const progressFill = document.getElementById('progress-fill');
    const currentEl    = document.getElementById('current-slide');
    const totalEl      = document.getElementById('total-slides');

    const TOTAL = slides.length;
    let current = 0;           // 0-indexed

    // ---- Init ----
    totalEl.textContent = TOTAL;
    readHash();
    activate(current);

    // ---- Keyboard ----
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            next();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            prev();
        }
    });

    // ---- Touch / Swipe ----
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;

        // Only trigger if horizontal swipe > 50px and dominant axis
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) next();
            else prev();
        }
    }, { passive: true });

    // ---- Hash routing ----
    window.addEventListener('hashchange', () => {
        readHash();
        activate(current);
    });

    // ---- Core functions ----
    function next() {
        if (current < TOTAL - 1) {
            current++;
            activate(current);
            writeHash();
        }
    }

    function prev() {
        if (current > 0) {
            current--;
            activate(current);
            writeHash();
        }
    }

    function activate(index) {
        slides.forEach((s, i) => {
            s.classList.toggle('active', i === index);
        });
        // Update counter
        currentEl.textContent = index + 1;
        // Update progress bar
        const pct = ((index) / (TOTAL - 1)) * 100;
        progressFill.style.width = pct + '%';
    }

    function readHash() {
        const match = location.hash.match(/slide=(\d+)/);
        if (match) {
            const n = parseInt(match[1], 10) - 1;   // hash is 1-based
            if (n >= 0 && n < TOTAL) current = n;
        }
    }

    function writeHash() {
        history.replaceState(null, '', '#slide=' + (current + 1));
    }

})();

