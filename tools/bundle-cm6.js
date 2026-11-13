#!/usr/bin/env node
/**
 * Bundles CodeMirror 6 SQL editor into self-hosted js/vendor/cm6-sql.js
 * License of all bundled @codemirror/* and @lezer/* packages: MIT
 */
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const outFile = path.join(ROOT, 'js/vendor/cm6-sql.js');

fs.mkdirSync(path.dirname(outFile), { recursive: true });

esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'cm6-entry.mjs')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  outfile: outFile,
  legalComments: 'none',
  banner: {
    js: '/* CodeMirror 6 SQL Bundle — MIT License (Marijn Haverbeke & contributors) */',
  },
});

const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log(`✓ Bundled CodeMirror 6 SQL editor -> js/vendor/cm6-sql.js (${sizeKb} KB minified)`);
