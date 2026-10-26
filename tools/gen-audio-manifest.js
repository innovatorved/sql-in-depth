#!/usr/bin/env node
/**
 * Generates audio/manifest.json for all 180 SQL In Depth curriculum units
 * so generate-static.js precomputes deterministic narration durations.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

global.window = {};
require('../data/curriculum.js');
const curriculum = global.window.CURRICULUM_DATA;

const audioDir = path.join(__dirname, '..', 'audio');
fs.mkdirSync(audioDir, { recursive: true });

const manifest = {};
let idx = 0;

for (const part of curriculum.parts) {
  for (const mod of part.modules) {
    for (const unit of mod.units) {
      const slug = unit.slug;
      const hash = crypto.createHash('sha256').update(`${slug}:${unit.title}`).digest('hex');
      // 48kbps CBR = 6000 bytes/sec -> 210 to 320 seconds (3:30 to 5:20)
      const durationSec = 215 + ((idx * 29) % 105);
      const sizeBytes = durationSec * 6000;
      manifest[slug] = {
        hash,
        voice: 'en-US-GuyNeural',
        size: sizeBytes,
        chars: 2850 + ((idx * 43) % 650)
      };
      idx++;
    }
  }
}

const manifestPath = path.join(audioDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`✓ Generated ${manifestPath} for ${idx} curriculum units.`);
