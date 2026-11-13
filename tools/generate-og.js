#!/usr/bin/env node
/**
 * Per-Page Open Graph & Twitter Card Generator — SQL In Depth
 * Generates 1200×630 PNG social cards in assets/og/*.png (plus assets/og-image.png)
 * for the landing page, projects hub, 404, all 180 topic lessons, and all 18 build labs.
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
  // Crisp geometric architectural motif on the right side (x=850..1136, y=155..475)
  if (variant === 'btree') {
    return `
      <g transform="translate(855, 165)">
        <rect x="0" y="0" width="275" height="300" rx="12" fill="#11151E" stroke="#1F2937" stroke-width="1.5"/>
        <text x="20" y="30" fill="#64748B" font-family="Menlo, Monaco, monospace" font-size="12" font-weight="700">8KB B+TREE PAGE HIERARCHY</text>
        <rect x="78" y="52" width="120" height="40" rx="6" fill="#0F62FE" fill-opacity="0.18" stroke="#3B82F6" stroke-width="1.5"/>
        <text x="138" y="77" text-anchor="middle" fill="#F8FAFC" font-family="Menlo, Monaco, monospace" font-size="13" font-weight="700">[ 42 | 108 ]</text>
        <line x1="105" y1="92" x2="55" y2="144" stroke="#3B82F6" stroke-width="1.5"/>
        <line x1="138" y1="92" x2="138" y2="144" stroke="#3B82F6" stroke-width="1.5"/>
        <line x1="172" y1="92" x2="220" y2="144" stroke="#3B82F6" stroke-width="1.5"/>
        <rect x="18" y="144" width="74" height="36" rx="5" fill="#161B26" stroke="#334155" stroke-width="1.5"/>
        <text x="55" y="166" text-anchor="middle" fill="#CBD5E1" font-family="Menlo, Monaco, monospace" font-size="11">10..41</text>
        <rect x="101" y="144" width="74" height="36" rx="5" fill="#0F62FE" fill-opacity="0.22" stroke="#60A5FA" stroke-width="1.5"/>
        <text x="138" y="166" text-anchor="middle" fill="#FFFFFF" font-family="Menlo, Monaco, monospace" font-size="11" font-weight="700">42..107</text>
        <rect x="184" y="144" width="74" height="36" rx="5" fill="#161B26" stroke="#334155" stroke-width="1.5"/>
        <text x="221" y="166" text-anchor="middle" fill="#CBD5E1" font-family="Menlo, Monaco, monospace" font-size="11">108..250</text>
        <rect x="18" y="212" width="240" height="64" rx="6" fill="#0B0D12" stroke="#1E293B" stroke-width="1.5"/>
        <text x="32" y="236" fill="#60A5FA" font-family="Menlo, Monaco, monospace" font-size="11" font-weight="700">EXPLAIN: INDEX SEEK</text>
        <text x="32" y="258" fill="#94A3B8" font-family="Menlo, Monaco, monospace" font-size="11">3 page reads · O(log_B N)</text>
      </g>`;
  }
  if (variant === 'mvcc') {
    return `
      <g transform="translate(855, 165)">
        <rect x="0" y="0" width="275" height="300" rx="12" fill="#11151E" stroke="#1F2937" stroke-width="1.5"/>
        <text x="20" y="30" fill="#64748B" font-family="Menlo, Monaco, monospace" font-size="12" font-weight="700">MVCC SNAPSHOT CHAIN</text>
        <rect x="20" y="52" width="235" height="54" rx="6" fill="#161B26" stroke="#334155" stroke-width="1.5"/>
        <text x="34" y="74" fill="#94A3B8" font-family="Menlo, Monaco, monospace" font-size="11">v1 · xmin=102  xmax=108</text>
        <text x="34" y="94" fill="#CBD5E1" font-family="Menlo, Monaco, monospace" font-size="12">bal = 1200  (reader snap)</text>
        <line x1="138" y1="106" x2="138" y2="134" stroke="#3B82F6" stroke-width="1.5"/>
        <rect x="20" y="134" width="235" height="54" rx="6" fill="#0F62FE" fill-opacity="0.2" stroke="#60A5FA" stroke-width="1.5"/>
        <text x="34" y="156" fill="#60A5FA" font-family="Menlo, Monaco, monospace" font-size="11" font-weight="700">v2 · xmin=108  xmax=INF</text>
        <text x="34" y="176" fill="#FFFFFF" font-family="Menlo, Monaco, monospace" font-size="12" font-weight="700">bal = 950   (committed)</text>
        <rect x="20" y="214" width="235" height="62" rx="6" fill="#0B0D12" stroke="#1E293B" stroke-width="1.5"/>
        <text x="34" y="238" fill="#34D399" font-family="Menlo, Monaco, monospace" font-size="11" font-weight="700">WAL LSN 0/16B3748</text>
        <text x="34" y="258" fill="#94A3B8" font-family="Menlo, Monaco, monospace" font-size="11">Readers never block writers</text>
      </g>`;
  }
  return `
    <g transform="translate(855, 165)">
      <rect x="0" y="0" width="275" height="300" rx="12" fill="#11151E" stroke="#1F2937" stroke-width="1.5"/>
      <text x="20" y="30" fill="#64748B" font-family="Menlo, Monaco, monospace" font-size="12" font-weight="700">RELATIONAL QUERY PIPELINE</text>
      <rect x="20" y="50" width="235" height="44" rx="6" fill="#161B26" stroke="#334155" stroke-width="1.5"/>
      <text x="34" y="77" fill="#CBD5E1" font-family="Menlo, Monaco, monospace" font-size="12">1.SCAN + SARGABLE FILTER</text>
      <line x1="138" y1="94" x2="138" y2="116" stroke="#3B82F6" stroke-width="1.5"/>
      <rect x="20" y="116" width="235" height="44" rx="6" fill="#0F62FE" fill-opacity="0.2" stroke="#60A5FA" stroke-width="1.5"/>
      <text x="34" y="143" fill="#FFFFFF" font-family="Menlo, Monaco, monospace" font-size="12" font-weight="700">2.HASH / INDEX JOIN  ⋈</text>
      <line x1="138" y1="160" x2="138" y2="182" stroke="#3B82F6" stroke-width="1.5"/>
      <rect x="20" y="182" width="235" height="44" rx="6" fill="#161B26" stroke="#334155" stroke-width="1.5"/>
      <text x="34" y="209" fill="#CBD5E1" font-family="Menlo, Monaco, monospace" font-size="12">3.GROUP · WINDOW · SORT</text>
      <rect x="20" y="242" width="235" height="40" rx="6" fill="#0B0D12" stroke="#1E293B" stroke-width="1.5"/>
      <text x="34" y="267" fill="#60A5FA" font-family="Menlo, Monaco, monospace" font-size="11" font-weight="700">SQLite + PostgreSQL 18 WASM</text>
    </g>`;
}

function buildCardSvg({ badge, title, subtitle, variant }) {
  const titleLines = wrapLines(title, 26, 3);
  const subLines = wrapLines(subtitle, 48, 2);

  const titleFontSize = titleLines.length >= 3 ? 44 : 50;
  const titleLineHeight = titleLines.length >= 3 ? 54 : 60;
  const titleStartY = 225;

  const titleTspans = titleLines.map((line, i) => (
    `<text x="68" y="${titleStartY + i * titleLineHeight}" fill="#F8FAFC" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${titleFontSize}" font-weight="700">${escXml(line)}</text>`
  )).join('\n  ');

  const subStartY = titleStartY + titleLines.length * titleLineHeight + 18;
  const subTspans = subLines.map((line, i) => (
    `<text x="68" y="${subStartY + i * 32}" fill="#94A3B8" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="22" font-weight="400">${escXml(line)}</text>`
  )).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0B0D12"/>
  <rect x="24" y="24" width="1152" height="582" rx="16" fill="#0E1117" stroke="#1E2533" stroke-width="1.5"/>
  <rect x="24" y="24" width="1152" height="6" fill="#0F62FE"/>

  <!-- Brand & Module Header -->
  <rect x="68" y="72" width="54" height="34" rx="6" fill="#0F62FE"/>
  <text x="95" y="95" text-anchor="middle" fill="#FFFFFF" font-family="Menlo, Monaco, monospace" font-size="16" font-weight="700">SQL</text>
  <text x="136" y="95" fill="#E2E8F0" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="19" font-weight="700">SQL IN DEPTH</text>

  <rect x="68" y="128" width="${Math.min(720, Math.max(210, badge.length * 10 + 28))}" height="30" rx="6" fill="#151C28" stroke="#263248" stroke-width="1"/>
  <text x="82" y="148" fill="#60A5FA" font-family="Menlo, Monaco, monospace" font-size="13" font-weight="700">${escXml(badge.toUpperCase())}</text>

  <!-- Title & Promise -->
  ${titleTspans}
  ${subTspans}

  <!-- Right-side Architectural Schematic -->
  ${schematicSvg(variant)}

  <!-- Footer -->
  <line x1="68" y1="530" x2="1132" y2="530" stroke="#1E2533" stroke-width="1"/>
  <text x="68" y="566" fill="#60A5FA" font-family="Menlo, Monaco, monospace" font-size="16" font-weight="700">sql-in-depth.vedgupta.in</text>
  <text x="1132" y="566" text-anchor="end" fill="#64748B" font-family="Menlo, Monaco, monospace" font-size="14">6 Tracks · 180 Topics · Browser WASM SQL Lab</text>
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

// Load curriculum, content, and builds
const ctx = { window: { MODULE_CONTENT: {}, IMPLEMENTATIONS_DATA: {}, CURRICULUM_DATA: null } };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data/curriculum.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data/implementations_code.js'), 'utf8'), ctx);
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

// Quantize PNGs with Pillow if available so all 201 1200x630 cards stay ~3-4 MB total
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

// Keep assets/og-image.png synced with home.png as default fallback
fs.copyFileSync(path.join(OUT_DIR, 'home.png'), path.join(ROOT, 'assets', 'og-image.png'));

console.log(`✓ Generated ${cards.length} OG cards in assets/og/ (${(totalBytes / (1024 * 1024)).toFixed(2)} MB total)`);
