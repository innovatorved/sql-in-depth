# In-Depth Engineering Series — Shared Design System (`DESIGN.md`)

This document specifies the portable design system shared across all three repositories in the **In-Depth Engineering Series**:
1. **`sql-in-depth`** (`data-product="sql"`) — Precision Cobalt (`#0F62FE` light / `#58A6FF` dark)
2. **`system-design-in-depth`** (`data-product="system-design"`) — Distributed Teal (`#0D9488` light / `#2DD4BF` dark)
3. **`dsa-in-depth`** (`data-product="dsa"`) — Algorithmic Violet (`#6D28D9` light / `#A78BFA` dark)

To adopt this design system in a sibling repo, copy `design-system/tokens.css`, `design-system/components.css`, and `fonts/geist*.woff2`, then set `<html lang="en" data-product="system-design" data-theme="light">`.

---

## 1. Color Architecture & WCAG AA Contrast

### Light Mode ("Daylight Architectural Paper")
- **Ground (`--ds-canvas`)**: `#F7F8FA` — eliminates harsh white glare during multi-hour study sessions while letting `#FFFFFF` elevated cards (`--ds-surface`) separate cleanly with a single `1px` hairline (`--ds-border: #E2E6EE`).
- **Ink Hierarchy**:
  - Primary Ink (`--ds-ink`): `#0F172A` (`17.4:1` contrast)
  - Prose Ink (`--ds-ink-prose`): `#1E293B` (`14.1:1` contrast)
  - Muted Ink (`--ds-ink-muted`): `#475569` (`7.3:1` contrast)
  - Faint / Metadata Ink (`--ds-ink-faint`): `#526075` (`5.9:1` contrast — exceeds WCAG AA `4.5:1` even at `12px`)

### Dark Mode ("Deep Slate Ink")
- **Ground (`--ds-canvas`)**: `#0B0E14` — replaces pure `#000000` to prevent OLED smearing and bright-on-black halation.
- **Elevated Surface (`--ds-surface`)**: `#131924` with `1px` border (`#222B3A`).
- **Ink Hierarchy**:
  - Primary Ink (`--ds-ink`): `#F1F5F9` (`16.2:1`)
  - Prose Ink (`--ds-ink-prose`): `#CBD5E1` (`11.8:1`)
  - Muted Ink (`--ds-ink-muted`): `#94A3B8` (`6.4:1`)
  - Faint Ink (`--ds-ink-faint`): `#8899B0` (`5.3:1`)

---

## 2. Typography & Reading Ergonomics

- **Reading & Display Font (`--ds-font-sans`)**: Self-hosted **Geist** (`fonts/geist-latin.woff2`, SIL OFL-1.1).
  - Body prose (`16px` / `1rem`), line-height `1.68`, strict prose measure `68ch` (`--ds-prose-measure`).
  - Heading scale: `h1` `clamp(1.75rem, 3.2vw, 2.25rem)` (`-0.032em` tracking), `h2` `1.375rem` (`-0.022em` tracking, `2.5rem` top margin / `0.75rem` bottom margin), `h3` `1.125rem`.
- **Code & Data Font (`--ds-font-mono`)**: Self-hosted **Geist Mono** (`fonts/geist-mono-latin.woff2`, SIL OFL-1.1).
  - `font-variant-numeric: tabular-nums` enforced across result tables, latency badges, progress counters, and slotted-page offsets.

---

## 3. Portable Component Catalog (`design-system/components.css`)

| Component | Selector | Purpose |
| :--- | :--- | :--- |
| **Page Shell & Sticky TOC** | `.ds-lesson-shell`, `.ds-toc` | Responsive reading column (`760px`) + sticky right-hand "On this page" TOC (`224px` at `>=1280px`) + module progress widget |
| **Framed Lesson Header** | `.ds-lesson-hero` | Module/lesson pill, reading time, `<h1>`, one-line promise (`.ds-lesson-hero__promise`), and quick action bar |
| **Callouts** | `.ds-callout--{note,tip,warning,mistake,danger}` | `1px` semantic border + subtle tinted surface + 16×16 SVG icon badge (zero thick left-border stripes) |
| **Code Block** | `.code-block`, `.code-line--highlight` | Dialect/filename header, line count, line highlighting, Copy button, and Run in Playground trigger |
| **Diagram & Video Stages** | `.ds-diagram-frame`, `.ds-video-stage` | Contained responsive SVG/Canvas/Video frames (`max-width: 100%`), zoom trigger, `.vtt` captions, and expandable transcript |
| **Self-Check Quiz** | `.quiz-section`, `.quiz-card` | Instant-feedback concept check with keyboard-accessible options and engineering rationale |
| **Next / Prev Lesson Cards** | `.lesson-nav`, `.lesson-nav__link` | Directional footer cards showing adjacent unit numbers and titles |
| **Share Button & Toast** | `.ds-share-btn`, `.ds-toast` | Native Web Share API with one-click clipboard fallback and status toast |
| **Product-Family Footer** | `.ds-footer` | Cross-links `SQL In Depth`, `System Design In Depth`, and `DSA In Depth` with brand accent dots |

---

## 4. Accessibility & Craft Commitments

- **WCAG 2.2 AA**: `>= 4.5:1` text contrast in both themes; `>= 32px` desktop / `>= 36px` mobile interactive hit targets; explicit labels on all form controls; valid ARIA roles (`tablist` contains only `tab` elements; sortable table headers use `<th scope="col"><button>` + `aria-sort`).
- **Keyboard & Motion**: `:focus-visible` ring (`2px solid var(--brand-accent)`, `2px` offset); skip-to-content link; `⌘K` / `/` search; `Cmd/Ctrl+Enter` SQL execution; full `@media (prefers-reduced-motion: reduce)` support.
- **Craft Bans Enforced**: Zero gradient text, zero `>1px` left-accent callout borders, zero stacked uppercase eyebrow kickers above headings, zero dual shadow+border resting cards, zero emoji UI icons, and zero horizontal overflow on desktop (`1440px`) or mobile (`390px`).
