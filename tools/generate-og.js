#!/usr/bin/env node
/**
 * Per-Page Open Graph & Twitter Card Generator — SQL In Depth
 * Generates 1200×630 PNG social cards in assets/og/*.png (plus assets/og-image.png)
 * for the landing page, hubs, 404, 12 challenges, 180 topic lessons, and 18 build labs
 * using the Warm Charcoal (#0F0F10 / #18181A) + Ember (#FB923C / #C2410C) design palette.
 *
 * Usage: node tools/generate-og.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'og');
fs.mkdirSync(OUT_DIR, { recursive: true });

const RSVG_CANDIDATES = [
  process.env.RSVG_CONVERT,
  '/opt/homebrew/bin/rsvg-convert',
  '/opt/homebrew/Caskroom/miniconda/base/bin/rsvg-convert',
  '/usr/local/bin/rsvg-convert',
  'rsvg-convert'
].filter(Boolean);

let rsvgBin = null;
for (const bin of RSVG_CANDIDATES) {
  const res = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  if (res.status === 0) {
    rsvgBin = bin;
    break;
  }
}
if (!rsvgBin) {
  console.error('rsvg-convert not found. Install librsvg to rasterize 1200x630 OG PNGs.');
  process.exit(1);
}

function escXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapLines(text, maxChars, maxLines) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars || !cur) {
      cur = next;
    } else {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  const usedWords = lines.join(' ').split(' ').filter(Boolean).length;
  const remaining = words.slice(usedWords).join(' ');
  if (remaining) {
    if (remaining.length <= maxChars + 3) {
      lines.push(remaining);
    } else {
      lines.push(remaining.slice(0, maxChars - 1).replace(/[,;:\-\s]+$/, '') + '…');
    }
  }
  return lines.slice(0, maxLines);
}

function schematicSvg(variant) {
  if (variant === 'btree') {
    return `
      <g transform="translate(855, 165)">
        <rect x="0" y="0" width="275" height="300" rx="12" fill="#18181A" stroke="#2D2D31" stroke-width="1.5"/>
        <text x="20" y="30" fill="#A1A1AA" font-family="Menlo, Monaco, monospace" font-size="12" font-weight="700">8KB B+TREE PAGE HIERARCHY</text>
        <rect x="78" y="52" width="120" height="40" rx="6" fill="#C2410C" fill-opacity="0.22" stroke="#FB923C" stroke-width="1.5"/>
        <text x="138" y="77" text-anchor="middle" fill="#FAFAFA" font-family="Menlo, Monaco, monospace" font-size="13" font-weight="700">[ 42 | 108 ]</text>
        <line x1="105" y1="92" x2="55" y2="144" stroke="#FB923C" stroke-width="1.5"/>
        <line x1="138" y1="92" x2="138" y2="144" stroke="#FB923C" stroke-width="1.5"/>
        <line x1="172" y1="92" x2="220" y2="144" stroke="#FB923C" stroke-width="1.5"/>
        <rect x="18" y="144" width="74" height="36" rx="5" fill="#1F1F23" stroke="#3F3F46" stroke-width="1.5"/>
        <text x="55" y="166" text-anchor="middle" fill="#D4D4D8" font-family="Menlo, Monaco, monospace" font-size="11">10..41</text>
        <rect x="101" y="144" width="74" height="36" rx="5" fill="#C2410C" fill-opacity="0.26" stroke="#FB923C" stroke-width="1.5"/>
        <text x="138" y="166" text-anchor="middle" fill="#FFFFFF" font-family="Menlo, Monaco, monospace" font-size="11" font-weight="700">42..107</text>
        <rect x="184" y="144" width="74" height="36" rx="5" fill="#1F1F23" stroke="#3F3F46" stroke-width="1.5"/>
        <text x="221" y="166" text-anchor="middle" fill="#D4D4D8" font-family="Menlo, Monaco, monospace" font-size="11">108..250</text>
        <rect x="18" y="212" width="240" height="64" rx="6" fill="#121213" stroke="#27272A" stroke-width="1.5"/>
        <text x="32" y="236" fill="#FB923C" font-family="Menlo, Monaco, monospace" font-size="11" font-weight="700">EXPLAIN: INDEX SEEK</text>
        <text x="32" y="258" fill="#A1A1AA" font-family="Menlo, Monaco, monospace" font-size="11">3 page reads · O(log_B N)</text>
      </g>`;
  }
  if (variant === 'mvcc') {
    return `
      <g transform="translate(855, 165)">
        <rect x="0" y="0" width="275" height="300" rx="12" fill="#18181A" stroke="#2D2D31" stroke-width="1.5"/>
        <text x="20" y="30" fill="#A1A1AA" font-family="Menlo, Monaco, monospace" font-size="12" font-weight="700">MVCC SNAPSHOT CHAIN</text>
        <rect x="20" y="52" width="235" height="54" rx="6" fill="#1F1F23" stroke="#3F3F46" stroke-width="1.5"/>
        <text x="34" y="74" fill="#A1A1AA" font-family="Menlo, Monaco, monospace" font-size="11">v1 · xmin=102  xmax=108</text>
        <text x="34" y="94" fill="#D4D4D8" font-family="Menlo, Monaco, monospace" font-size="12">bal = 1200  (reader snap)</text>
        <line x1="138" y1="106" x2="138" y2="134" stroke="#FB923C" stroke-width="1.5"/>
        <rect x="20" y="134" width="235" height="54" rx="6" fill="#C2410C" fill-opacity="0.24" stroke="#FB923C" stroke-width="1.5"/>
        <text x="34" y="156" fill="#FB923C" font-family="Menlo, Monaco, monospace" font-size="11" font-weight="700">v2 · xmin=108  xmax=INF</text>
        <text x="34" y="176" fill="#FFFFFF" font-family="Menlo, Monaco, monospace" font-size="12" font-weight="700">bal = 950   (committed)</text>
        <rect x="20" y="214" width="235" height="62" rx="6" fill="#121213" stroke="#27272A" stroke-width="1.5"/>
        <text x="34" y="238" fill="#4ADE80" font-family="Menlo, Monaco, monospace" font-size="11" font-weight="700">WAL LSN 0/16B3748</text>
        <text x="34" y="258" fill="#A1A1AA" font-family="Menlo, Monaco, monospace" font-size="11">Readers never block writers</text>
      </g>`;
  }
  return `
    <g transform="translate(855, 165)">
      <rect x="0" y="0" width="275" height="300" rx="12" fill="#18181A" stroke="#2D2D31" stroke-width="1.5"/>
      <text x="20" y="30" fill="#A1A1AA" font-family="Menlo, Monaco, monospace" font-size="12" font-weight="700">RELATIONAL QUERY PIPELINE</text>
      <rect x="20" y="50" width="235" height="44" rx="6" fill="#1F1F23" stroke="#3F3F46" stroke-width="1.5"/>
      <text x="34" y="77" fill="#D4D4D8" font-family="Menlo, Monaco, monospace" font-size="12">1.SCAN + SARGABLE FILTER</text>
      <line x1="138" y1="94" x2="138" y2="116" stroke="#FB923C" stroke-width="1.5"/>
      <rect x="20" y="116" width="235" height="44" rx="6" fill="#C2410C" fill-opacity="0.24" stroke="#FB923C" stroke-width="1.5"/>
      <text x="34" y="143" fill="#FFFFFF" font-family="Menlo, Monaco, monospace" font-size="12" font-weight="700">2.HASH / INDEX JOIN  ⋈</text>
      <line x1="138" y1="160" x2="138" y2="182" stroke="#FB923C" stroke-width="1.5"/>
      <rect x="20" y="182" width="235" height="44" rx="6" fill="#1F1F23" stroke="#3F3F46" stroke-width="1.5"/>
      <text x="34" y="209" fill="#D4D4D8" font-family="Menlo, Monaco, monospace" font-size="12">3.GROUP · WINDOW · SORT</text>
      <rect x="20" y="242" width="235" height="40" rx="6" fill="#121213" stroke="#27272A" stroke-width="1.5"/>
      <text x="34" y="267" fill="#FB923C" font-family="Menlo, Monaco, monospace" font-size="11" font-weight="700">SQLite + PostgreSQL 18 WASM</text>
    </g>`;
}

function buildCardSvg({ badge, title, subtitle, variant }) {
  const titleLines = wrapLines(title, 26, 3);
  const subLines = wrapLines(subtitle, 48, 2);

  const titleFontSize = titleLines.length >= 3 ? 44 : 50;
  const titleLineHeight = titleLines.length >= 3 ? 54 : 60;
  const titleStartY = 225;

  const titleTspans = titleLines.map((line, i) => (
    `<text x="68" y="${titleStartY + i * titleLineHeight}" fill="#F4F4F5" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${titleFontSize}" font-weight="700">${escXml(line)}</text>`
  )).join('\n  ');

  const subStartY = titleStartY + titleLines.length * titleLineHeight + 18;
  const subTspans = subLines.map((line, i) => (
    `<text x="68" y="${subStartY + i * 32}" fill="#A1A1AA" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="22" font-weight="400">${escXml(line)}</text>`
  )).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0F0F10"/>
  <rect x="24" y="24" width="1152" height="582" rx="16" fill="#141416" stroke="#27272A" stroke-width="1.5"/>
  <rect x="24" y="24" width="1152" height="6" fill="#C2410C"/>

  <!-- Brand & Module Header -->
  <rect x="68" y="72" width="54" height="34" rx="6" fill="#F4F4F5"/>
  <text x="95" y="95" text-anchor="middle" fill="#0F0F10" font-family="Menlo, Monaco, monospace" font-size="16" font-weight="700">SQL</text>
  <text x="136" y="95" fill="#F4F4F5" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="19" font-weight="700">SQL IN DEPTH</text>

  <rect x="68" y="128" width="${Math.min(720, Math.max(210, badge.length * 10 + 28))}" height="30" rx="6" fill="#231610" stroke="#4D2614" stroke-width="1"/>
  <text x="82" y="148" fill="#FB923C" font-family="Menlo, Monaco, monospace" font-size="13" font-weight="700">${escXml(badge.toUpperCase())}</text>

  <!-- Title & Promise -->
  ${titleTspans}
  ${subTspans}

  <!-- Right-side Architectural Schematic -->
  ${schematicSvg(variant)}

  <!-- Footer -->
  <line x1="68" y1="530" x2="1132" y2="530" stroke="#27272A" stroke-width="1"/>
  <text x="68" y="566" fill="#FB923C" font-family="Menlo, Monaco, monospace" font-size="16" font-weight="700">sql-in-depth.vedgupta.in</text>
  <text x="1132" y="566" text-anchor="end" fill="#A1A1AA" font-family="Menlo, Monaco, monospace" font-size="14">6 Tracks · 180 Topics · Browser WASM SQL Studio</text>
</svg>`;
}

function renderPng(svgStr, outPath) {
  const res = spawnSync(rsvgBin, ['-w', '1200', '-h', '630', '-f', 'png', '-o', outPath], {
    input: Buffer.from(svgStr, 'utf8')
  });
  if (res.status !== 0) {
    throw new Error(`rsvg-convert failed for ${outPath}: ${res.stderr?.toString()}`);
  }
}

const ctx = { window: { MODULE_CONTENT: {}, IMPLEMENTATIONS_DATA: {}, CURRICULUM_DATA: null, CHALLENGES_DATA: [] } };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data/curriculum.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data/implementations_code.js'), 'utf8'), ctx);
if (fs.existsSync(path.join(ROOT, 'data/challenges.js'))) {
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data/challenges.js'), 'utf8'), ctx);
}
const contentDir = path.join(ROOT, 'data/content');
for (const f of fs.readdirSync(contentDir).filter(f => f.endsWith('.js')).sort()) {
  vm.runInNewContext(fs.readFileSync(path.join(contentDir, f), 'utf8'), ctx);
}

const cards = [
  {
    name: 'home',
    badge: 'Interactive Textbook & WASM SQL Studio',
    title: 'SQL & Database Internals, In Depth',
    subtitle: 'From 8KB slotted pages and B+Tree splits to query execution plans and MVCC snapshots.',
    variant: 'btree'
  },
  {
    name: 'roadmap',
    badge: '6 Tracks · 18 Modules · 180 Lessons',
    title: 'SQL & Storage Internals Roadmap',
    subtitle: 'Interactive prerequisite DAG, role-based career paths, and weekly study planner.',
    variant: 'pipeline'
  },
  {
    name: 'challenges',
    badge: '12 Production SQL Scenarios',
    title: 'SQL & Database Challenges',
    subtitle: 'Debug NULL traps, SARGable predicates, window analytics, and MVCC concurrency bugs.',
    variant: 'mvcc'
  },
  {
    name: 'sandbox',
    badge: 'SQLite 3 + PostgreSQL 18 WASM',
    title: 'Browser SQL Studio & Query Visualizer',
    subtitle: 'Run queries client-side with clause-by-clause steppers, EXPLAIN plans, and schema explorer.',
    variant: 'pipeline'
  },
  {
    name: 'dashboard',
    badge: 'Local-First Study Workspace',
    title: 'Learning Progress, Flashcards & Notes',
    subtitle: 'Track completed modules, spaced-repetition flashcards, and portable JSON study backups.',
    variant: 'btree'
  },
  {
    name: 'glossary',
    badge: '180 First-Principles Definitions',
    title: 'SQL & Database Internals Glossary',
    subtitle: 'Searchable reference for relational algebra, B+Tree pages, query planners, MVCC, and WAL.',
    variant: 'btree'
  },
  {
    name: 'projects',
    badge: 'Systems Engineering Case Studies',
    title: 'Database & Storage Engine Projects',
    subtitle: 'Open-source query engines, B+Tree storage structures, and OLAP analytics benchmarks.',
    variant: 'btree'
  },
  {
    name: '404',
    badge: 'SQL In Depth · Navigation',
    title: 'Explore 180 SQL & Storage Internals Lessons',
    subtitle: 'Interactive query visualizers, WASM SQLite & PostgreSQL 18 studio, and engine builds.',
    variant: 'pipeline'
  }
];

for (const ch of (ctx.window.CHALLENGES_DATA || [])) {
  if (!ch || !ch.id) continue;
  cards.push({
    name: ch.id,
    badge: `SQL Challenge · ${String(ch.category || 'Production Debugging')}`,
    title: ch.title,
    subtitle: String(ch.context || 'Write and verify the production SQL fix in the browser playground.').slice(0, 140),
    variant: /index|sarg|btree/i.test(ch.id) ? 'btree' : /mvcc|lock|tx|isolation/i.test(ch.id) ? 'mvcc' : 'pipeline'
  });
}

for (const part of ctx.window.CURRICULUM_DATA.parts) {
  for (const mod of part.modules) {
    const modNum = parseInt(String(mod.id || '').replace(/\D/g, ''), 10) || 1;
    const variant = (modNum >= 9 && modNum <= 11) ? 'btree' : (modNum >= 12 && modNum <= 14) ? 'mvcc' : 'pipeline';
    for (const unit of mod.units) {
      const mc = ctx.window.MODULE_CONTENT[mod.id]?.[unit.slug] || {};
      const promise = mc.promise || unit.archive?.excerpt || `${mod.title} — interactive visual walkthrough and runnable SQL lab.`;
      cards.push({
        name: unit.slug,
        badge: `Module ${mod.number} · ${mod.title}`,
        title: unit.title,
        subtitle: String(promise).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        variant
      });
    }
  }
}

for (const [buildId, build] of Object.entries(ctx.window.IMPLEMENTATIONS_DATA || {})) {
  cards.push({
    name: buildId,
    badge: 'From-Scratch Engine Build Lab',
    title: String(build.title || buildId).replace(/\s*\(.*\)\s*$/, ''),
    subtitle: String(build.summary || 'Step-by-step storage & query engine implementation with automated browser verification.'),
    variant: /btree|page|index/i.test(buildId) ? 'btree' : /wal|mvcc|lock|tx/i.test(buildId) ? 'mvcc' : 'pipeline'
  });
}

console.log(`Generating ${cards.length} Open Graph PNG cards (1200×630)...`);
let totalBytes = 0;
for (const card of cards) {
  const outPath = path.join(OUT_DIR, `${card.name}.png`);
  const svg = buildCardSvg(card);
  renderPng(svg, outPath);
  totalBytes += fs.statSync(outPath).size;
}

const pyCandidates = ['/opt/homebrew/Caskroom/miniconda/base/bin/python3', 'python3'];
for (const py of pyCandidates) {
  const qRes = spawnSync(py, ['-c', `
import glob, os
from PIL import Image
for p in glob.glob(${JSON.stringify(path.join(OUT_DIR, '*.png'))}):
    im = Image.open(p).convert('RGB').quantize(colors=96, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    im.save(p, format='PNG', optimize=True)
`], { encoding: 'utf8' });
  if (qRes.status === 0) break;
}

totalBytes = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.png')).reduce((s, f) => s + fs.statSync(path.join(OUT_DIR, f)).size, 0);

fs.copyFileSync(path.join(OUT_DIR, 'home.png'), path.join(ROOT, 'assets', 'og-image.png'));

console.log(`✓ Generated ${cards.length} OG cards in assets/og/ (${(totalBytes / (1024 * 1024)).toFixed(2)} MB total)`);
