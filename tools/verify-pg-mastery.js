#!/usr/bin/env node
/**
 * SQL In Depth — PostgreSQL 18 Mastery Verifier (`tools/verify-pg-mastery.js`)
 * Validates structural quality, FAANG-grade prose completeness, starter-code non-passability,
 * solution-code 5-gate passability, and back-to-back idempotency against live PGlite 18.6 WASM.
 *
 * Usage:
 *   node tools/verify-pg-mastery.js                  # Verify all 10 modules (80 labs / 240 steps)
 *   node tools/verify-pg-mastery.js pg-m01 pg-m02    # Verify specific module(s)
 */
'use strict';

require('../data/datasets.js');
require('../data/pg_mastery_curriculum.js');
require('../js/sql-engine.js');
require('../js/pg-tutorials.js');

async function main() {
  const cur = global.PG_MASTERY_CURRICULUM;
  if (!cur || !Array.isArray(cur.modules)) {
    throw new Error('PG_MASTERY_CURRICULUM failed to load.');
  }

  const cliModules = process.argv.slice(2).filter(Boolean);
  const targetModules = cliModules.length > 0
    ? cliModules.map(id => {
        const m = cur.moduleById[id];
        if (!m) throw new Error('Unknown module ID: ' + id);
        return m;
      })
    : cur.modules;

  await global.SqlEngine.initPglite();

  let totalLabsChecked = 0;
  let totalStepsChecked = 0;
  const failures = [];

  for (const mod of targetModules) {
    let labs;
    try {
      labs = await global.PgTutorials.ensureModuleLoaded(mod.id);
    } catch (err) {
      failures.push(`[${mod.id}] Failed to load ${mod.dataFile}: ${err.message}`);
      continue;
    }

    if (!Array.isArray(labs) || labs.length !== mod.topics.length) {
      failures.push(`[${mod.id}] Expected ${mod.topics.length} labs, got ${Array.isArray(labs) ? labs.length : 'non-array'}`);
      continue;
    }

    for (let tIdx = 0; tIdx < mod.topics.length; tIdx++) {
      const expectedMeta = mod.topics[tIdx];
      const lab = labs[tIdx];
      totalLabsChecked++;

      if (!lab || lab.id !== expectedMeta.id || lab.slug !== expectedMeta.slug) {
        failures.push(`[${expectedMeta.id}] ID/slug mismatch: got id=${lab && lab.id}, slug=${lab && lab.slug}`);
        continue;
      }

      if (!lab.guide || typeof lab.guide.mentalModel !== 'string' || lab.guide.mentalModel.trim().length < 160) {
        failures.push(`[${lab.id}] guide.mentalModel must be >= 160 chars of substantive explanation.`);
      }
      if (!lab.guide || !lab.guide.syntaxAnatomy || lab.guide.syntaxAnatomy.trim().length < 20) {
        failures.push(`[${lab.id}] guide.syntaxAnatomy is missing or too short.`);
      }
      if (!lab.guide || !Array.isArray(lab.guide.internalsAndGotchas) || lab.guide.internalsAndGotchas.length < 3) {
        failures.push(`[${lab.id}] guide.internalsAndGotchas must list >= 3 concrete PostgreSQL gotchas.`);
      }
      if (!lab.guide || !lab.guide.whenToUse || lab.guide.whenToUse.trim().length < 30) {
        failures.push(`[${lab.id}] guide.whenToUse is missing or too short.`);
      }
      if (!lab.scenario || !lab.scenario.role || !lab.scenario.incidentOrGoal || !lab.scenario.stakeholderNeed) {
        failures.push(`[${lab.id}] scenario.{role, incidentOrGoal, stakeholderNeed} must all be populated.`);
      }

      if (!Array.isArray(lab.steps) || lab.steps.length !== 3) {
        failures.push(`[${lab.id}] Expected 3 steps, got ${Array.isArray(lab.steps) ? lab.steps.length : 0}`);
        continue;
      }

      for (let sIdx = 0; sIdx < lab.steps.length; sIdx++) {
        const step = lab.steps[sIdx];
        totalStepsChecked++;
        const label = `${lab.id} (${lab.slug}) Step ${sIdx + 1}`;

        if (!step.title || !step.mission || step.mission.trim().length < 45) {
          failures.push(`[${label}] Missing title or mission < 45 chars.`);
        }
        if (!step.starterCode || !step.solutionCode) {
          failures.push(`[${label}] Missing starterCode or solutionCode.`);
          continue;
        }
        if (!Array.isArray(step.hints) || step.hints.length < 3) {
          failures.push(`[${label}] Must provide 3 progressive hints.`);
        }
        if (!step.assertions || !Array.isArray(step.assertions.requiredPatterns) || step.assertions.requiredPatterns.length < 1) {
          failures.push(`[${label}] Must include >= 1 assertions.requiredPatterns rule.`);
        }
        if (!step.solutionExplanation || step.solutionExplanation.trim().length < 70) {
          failures.push(`[${label}] solutionExplanation must be >= 70 chars.`);
        }

        // 1. Starter code must NOT already pass verification
        const starterVerdict = await global.PgTutorials.verifyLabStep(lab, sIdx, step.starterCode);
        if (starterVerdict.passed) {
          failures.push(`[${label}] starterCode unexpectedly PASSED verification!`);
        }

        // 2. Solution code MUST pass all 5 gates
        const solVerdict1 = await global.PgTutorials.verifyLabStep(lab, sIdx, step.solutionCode);
        if (!solVerdict1.passed) {
          failures.push(`[${label}] solutionCode FAILED (${solVerdict1.failedGate}): ${solVerdict1.message}`);
          continue;
        }

        // 3. Back-to-back idempotency check
        const solVerdict2 = await global.PgTutorials.verifyLabStep(lab, sIdx, step.solutionCode);
        if (!solVerdict2.passed) {
          failures.push(`[${label}] solutionCode FAILED on repeat run (state leak! ${solVerdict2.failedGate}): ${solVerdict2.message}`);
        }
      }
      process.stdout.write(`  ✓ ${lab.id} · ${lab.title}\n`);
    }
  }

  console.log(`\nChecked ${totalLabsChecked} labs (${totalStepsChecked} SQL steps) across ${targetModules.length} module(s).`);
  if (failures.length > 0) {
    console.error(`\nFAILED with ${failures.length} error(s):`);
    failures.forEach(f => console.error('  ✗ ' + f));
    process.exit(1);
  }
  console.log('ALL CHECKS PASSED (100% PostgreSQL 18.6 WASM verified).');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
