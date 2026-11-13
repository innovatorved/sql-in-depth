#!/usr/bin/env node
/**
 * Builds the clean `dist/` directory for production deployment.
 * Copies ONLY public website files into `dist/` (excluding `tools/`, `.github/`,
 * `scratch/`, `docs/`, and repo markdown files) and minifies CSS & JS via esbuild.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PUBLIC_ITEMS = [
  'index.html',
  '404.html',
  '_headers',
  '_redirects',
  'robots.txt',
  'sitemap.xml',
  'llms.txt',
  'favicon.svg',
  'preview-sw.js',
  'CNAME',
  '.well-known',
  'assets',
  'audio',
  'build',
  'challenges',
  'css',
  'dashboard',
  'data',
  'design-system',
  'fonts',
  'glossary',
  'js',
  'projects',
  'roadmap',
  'sandbox',
  'topic'
];

if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

for (const item of PUBLIC_ITEMS) {
  const src = path.join(ROOT, item);
  const dest = path.join(DIST, item);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

let minifiedCount = 0;
function minifyTree(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'vendor') continue;
      minifyTree(full);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.min.js') || entry.name.endsWith('.min.css')) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.css' || ext === '.js') {
        try {
          const code = fs.readFileSync(full, 'utf8');
          const out = esbuild.transformSync(code, {
            loader: ext === '.css' ? 'css' : 'js',
            minify: true,
            legalComments: 'none'
          });
          fs.writeFileSync(full, out.code, 'utf8');
          minifiedCount++;
        } catch (err) {
          console.warn(`  [minify skip] ${path.relative(DIST, full)}: ${err.message}`);
        }
      }
    }
  }
}

for (const sub of ['css', 'design-system', 'js', 'data']) {
  minifyTree(path.join(DIST, sub));
}

console.log(`✓ Built clean dist/ directory (${minifiedCount} CSS/JS assets minified via esbuild)`);
