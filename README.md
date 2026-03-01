# BeC-Study Presentation — GitHub Pages

A keyboard-driven dark-themed slide presentation for the SOČ 2026 project:  
**Kombinovaný moderátor grafit–BeC pre kompaktný tóriový reaktor LFTR**

## Quick Start

1. Push this folder to a GitHub repo.
2. Go to **Settings → Pages** and set the source to the branch root (or `/docs`).
3. Open the published URL — the presentation is a single `index.html`.

For local preview, just open `index.html` in a browser (no build step needed).

---

## Navigation

| Action         | Input                                |
|----------------|--------------------------------------|
| Next slide     | `→` Arrow Right **or** `↓` Arrow Down |
| Previous slide | `←` Arrow Left **or** `↑` Arrow Up    |
| Mobile         | Swipe left / right                   |
| Jump to slide  | Edit URL hash: `#slide=5`            |

---

## File Structure

```
BeC-Study/
├── index.html              ← all slides live here
├── css/
│   ├── style.css           ← global tokens, reset, progress bar
│   ├── slides.css          ← slide layouts, components, utilities
│   └── animations.css      ← entrance animation classes
├── js/
│   └── presentation.js     ← slide engine (keyboard, touch, hash)
├── img/                    ← put images/figures here
└── README.md
```

---

## Style Guide & Design Tokens

### Color Palette

| Token               | Value                        | Usage                       |
|----------------------|------------------------------|-----------------------------|
| `--bg-primary`       | `#0e1117`                    | Slide background            |
| `--bg-secondary`     | `#161b22`                    | Cards, subtle surfaces      |
| `--bg-card`          | `#1e242d`                    | Stat cards, highlight boxes |
| `--accent`           | `#58a6ff`                    | Links, numbers, emphasis    |
| `--highlight`        | `#f0b952`                    | Warm accent, gradients      |
| `--text-primary`     | `#e6edf3`                    | Headings, bold text         |
| `--text-secondary`   | `#8b949e`                    | Body text, list items       |
| `--text-muted`       | `#484f58`                    | Captions, counter           |
| `--border`           | `#30363d`                    | Dividers, card borders      |

### Typography

- **Sans-serif:** Inter (300–700)
- **Monospace:** JetBrains Mono (numbers, code, counters)
- Headings: `600` weight, `-0.02em` letter-spacing
- Body: `1.125rem`, line-height `1.7`

### Animations

Add animation classes to any element inside a `.slide`:

| Class             | Effect                      |
|-------------------|-----------------------------|
| `anim-fade-up`    | Fade in from below          |
| `anim-fade-down`  | Fade in from above          |
| `anim-fade-right` | Fade in from left           |
| `anim-fade-left`  | Fade in from right          |
| `anim-scale-x`    | Horizontal scale in (line)  |
| `anim-scale-in`   | Uniform scale in            |
| `anim-blur-in`    | Blur + scale in             |

Stagger with delay classes: `anim-delay-1` through `anim-delay-6` (120 ms steps).

Animations **replay** every time you navigate to a slide.

---

## Adding a New Slide

```html
<!-- SLIDE N: Topic -->
<section class="slide" data-slide="N">
    <div class="slide__content">
        <h2 class="slide__heading anim-fade-down">Title Here</h2>
        <div class="slide__body anim-fade-up anim-delay-1">
            <p>Content here.</p>
        </div>
    </div>
</section>
```

Update `data-slide` numbers sequentially.

### Slide Variants

- `slide--title` — centered, radial glow background (use for first slide)
- `slide--end` — centered, warm glow (use for last slide)
- `slide--outline` — styled ordered list

### Layout Utilities

**Two columns:**
```html
<div class="columns">
    <div>Left content</div>
    <div>Right content</div>
</div>
```
Variants: `columns--60-40`, `columns--40-60`.

**Stat cards:**
```html
<div class="stat-row">
    <div class="stat-card">
        <div class="stat-card__value">−25 %</div>
        <div class="stat-card__label">Priemer reaktora</div>
    </div>
    ...
</div>
```

**Highlight box:**
```html
<div class="highlight-box">
    <p>Key takeaway text.</p>
</div>
```

**Figure:**
```html
<figure class="slide-figure">
    <img src="img/chart.png" alt="description">
    <figcaption>Caption text</figcaption>
</figure>
```

**Table:**
```html
<table class="slide-table">
    <thead><tr><th>Col 1</th><th>Col 2</th></tr></thead>
    <tbody><tr><td>Data</td><td>Data</td></tr></tbody>
</table>
```

---

## Deployment Checklist

- [ ] Place all images in `img/` and reference with relative paths
- [ ] Verify all `data-slide` attributes are sequential
- [ ] Test keyboard navigation end-to-end
- [ ] Test on mobile (swipe)
- [ ] Push to GitHub, enable Pages

