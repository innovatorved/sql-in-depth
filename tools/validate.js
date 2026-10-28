#!/usr/bin/env node
// Content Schema Validator for sql-in-depth
// Usage: node tools/validate.js
// Exit 0 = all checks pass, non-zero = errors found

const fs = require('fs');
const path = require('path');

const reset = '\x1b[0m';
const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';

let errorCount = 0;
let warningCount = 0;

function reportError(msg) {
  console.error(`${red}  ✖ ${msg}${reset}`);
  errorCount++;
}

function reportWarning(msg) {
  console.log(`${yellow}  ⚠ ${msg}${reset}`);
  warningCount++;
}

function reportSuccess(msg) {
  console.log(`${green}✓ ${msg}${reset}`);
}

global.window = {};

const dataDir = path.join(__dirname, '..', 'data');
const curriculumFile = path.join(dataDir, 'curriculum.js');

if (!fs.existsSync(curriculumFile)) {
  console.error(`Curriculum file not found: ${curriculumFile}`);
  process.exit(1);
}

try {
  const code = fs.readFileSync(curriculumFile, 'utf8');
  eval(code);
} catch (e) {
  console.error(`Failed to load curriculum.js: ${e.message}`);
  process.exit(1);
}

const curriculum = global.window.CURRICULUM_DATA;
if (!curriculum || !curriculum.parts) {
  reportError("Curriculum structure invalid");
  process.exit(1);
}

const implFile = path.join(dataDir, 'implementations_code.js');
if (fs.existsSync(implFile)) {
  try {
    eval(fs.readFileSync(implFile, 'utf8'));
  } catch (e) {
    reportError(`Failed to load implementations_code.js: ${e.message}`);
  }
}
const allBuildIds = new Set(Object.keys(global.window.IMPLEMENTATIONS_DATA || {}));

const challengesFile = path.join(dataDir, 'challenges.js');
if (fs.existsSync(challengesFile)) {
  try {
    eval(fs.readFileSync(challengesFile, 'utf8'));
  } catch (e) {
    reportError(`Failed to load challenges.js: ${e.message}`);
  }
}
const allChallengeIds = new Set((global.window.CHALLENGES_DATA || []).map(c => c.id).filter(Boolean));

// 1. Validate curriculum structure
const allSlugs = new Set();
const allModuleIds = new Set();
let unitsCount = 0;
let modulesCount = 0;
const unitsMap = [];

curriculum.parts.forEach((part) => {
  if (part.modules) {
    part.modules.forEach((mod) => {
      modulesCount++;
      if (!mod.id) {
        reportError(`Module missing id in part ${part.id || part.title}`);
      } else if (allModuleIds.has(mod.id)) {
        reportError(`Duplicate module ID: ${mod.id}`);
      } else {
        allModuleIds.add(mod.id);
      }

      if (mod.units) {
        mod.units.forEach((unit) => {
          unitsCount++;
          unitsMap.push({ moduleId: mod.id, modNumber: mod.legacyNumber || mod.number, unit });

          if (!unit.slug) {
            reportError(`Unit missing slug in module ${mod.id}`);
          } else {
            if (!/^[a-z0-9\-]+$/.test(unit.slug)) {
              reportError(`Unit slug not kebab-case: ${unit.slug}`);
            }
            if (allSlugs.has(unit.slug)) {
              reportError(`Duplicate unit slug: ${unit.slug}`);
            } else {
              allSlugs.add(unit.slug);
            }
          }

          if (!unit.title || typeof unit.title !== 'string') {
            reportError(`Unit missing title: ${unit.slug}`);
          }

          if (!['lesson', 'design', 'case', 'build'].includes(unit.kind)) {
            reportError(`Unit has invalid kind '${unit.kind}': ${unit.slug}`);
          }
        });
      }
    });
  }
});

reportSuccess(`Curriculum: ${unitsCount} units across ${curriculum.parts.length} tracks`);
if (errorCount === 0) {
  reportSuccess(`Slugs: all unique, all kebab-case`);
}

// 2. Load content files
const contentDir = path.join(dataDir, 'content');
if (fs.existsSync(contentDir)) {
  const contentFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.js'));
  contentFiles.forEach(f => {
    try {
      const code = fs.readFileSync(path.join(contentDir, f), 'utf8');
      eval(code);
    } catch (e) {
      reportError(`Failed to load ${f}: ${e.message}`);
    }
  });
}

const moduleContent = global.window.MODULE_CONTENT || {};

let richContentCount = 0;
let missingContentCount = 0;
let placeholderCount = 0;
let validTakeaways = 0;
let validFurtherReading = 0;

unitsMap.forEach(({ moduleId, modNumber, unit }) => {
  const modData = moduleContent[moduleId];
  const unitData = modData ? modData[unit.slug] : null;
  const displayId = modNumber ? `m${modNumber}` : moduleId;

  if (!unitData) {
    reportWarning(`${displayId}/${unit.slug}: missing content`);
    missingContentCount++;
    return;
  }

  let isPlaceholder = false;
  if (unitData.content && unitData.content.includes('This topic is covered in depth in the curriculum archive above')) {
    reportWarning(`${displayId}/${unit.slug}: placeholder content`);
    placeholderCount++;
    isPlaceholder = true;
  }

  if (!isPlaceholder) {
    richContentCount++;
    if (!unitData.title || typeof unitData.title !== 'string') {
      reportError(`${displayId}/${unit.slug}: missing or invalid title`);
    }
    if (!unitData.content || typeof unitData.content !== 'string' || !unitData.content.includes('<div')) {
      reportError(`${displayId}/${unit.slug}: missing or invalid content (must contain '<div')`);
    }

    if (!unitData.keyTakeaways || !Array.isArray(unitData.keyTakeaways) || unitData.keyTakeaways.length < 3 || unitData.keyTakeaways.length > 5) {
      reportError(`${displayId}/${unit.slug}: keyTakeaways must be an array with 3-5 items`);
    } else {
      let allStrings = true;
      unitData.keyTakeaways.forEach(t => {
        if (!t || typeof t !== 'string') allStrings = false;
      });
      if (!allStrings) reportError(`${displayId}/${unit.slug}: keyTakeaways items must be non-empty strings`);
      else validTakeaways++;
    }

    if (!unitData.furtherReading || !Array.isArray(unitData.furtherReading) || unitData.furtherReading.length < 2 || unitData.furtherReading.length > 4) {
      reportWarning(`${displayId}/${unit.slug}: furtherReading must be an array with 2-4 items`);
    } else {
      let allValid = true;
      unitData.furtherReading.forEach(fr => {
        if (!fr.title || !fr.url) allValid = false;
      });
      if (!allValid) reportError(`${displayId}/${unit.slug}: furtherReading items must have title and url`);
      else validFurtherReading++;
    }
  }
});

const totalContentCount = unitsCount - missingContentCount - placeholderCount;
if (missingContentCount > 0 || placeholderCount > 0) {
  console.log(`${yellow}⚠ Content: ${totalContentCount}/${unitsCount} units have rich content (${placeholderCount} placeholder, ${missingContentCount} missing)${reset}`);
} else {
  reportSuccess(`Content: ${totalContentCount}/${unitsCount} units have rich content`);
}

reportSuccess(`Key takeaways: ${validTakeaways}/${unitsCount} units have 3-5 takeaways`);
reportSuccess(`Further reading: ${validFurtherReading}/${unitsCount} units have 2-4 items`);

// 2b. Primary-Source Citation Policy Check (Zero SEO Farms)
const FORBIDDEN_DOMAINS = [
  'geeksforgeeks.org',
  'medium.com',
  'w3schools.com',
  'baeldung.com',
  'tutorialspoint.com',
  'programiz.com',
  'javatpoint.com',
  'freecodecamp.org',
  'dev.to'
];
let forbiddenSourceErrors = 0;
for (const [modId, units] of Object.entries(moduleContent)) {
  for (const [unitSlug, unitData] of Object.entries(units)) {
    const links = unitData?.furtherReading || [];
    for (const l of links) {
      const urlLower = String(l?.url || '').toLowerCase();
      for (const bad of FORBIDDEN_DOMAINS) {
        if (urlLower.includes(bad)) {
          reportError(`${modId}/${unitSlug}: forbidden non-primary source domain '${bad}' in furtherReading: ${l.url}`);
          forbiddenSourceErrors++;
        }
      }
    }
  }
}
if (forbiddenSourceErrors === 0) {
  reportSuccess('Primary-source policy: 0 forbidden SEO farm domains found in furtherReading');
}

// 2c. Simulator Registry & Mount Validation
global.document = global.document || { addEventListener: () => {} };
const simFiles = [
  'js/simulators.js',
  'js/simulators-relational.js',
  'js/simulators-analytical.js',
  'js/simulators-modeling.js',
  'js/simulators-indexing.js',
  'js/simulators-transactions.js',
  'js/simulators-olap-ops.js'
];
for (const sf of simFiles) {
  const sp = path.join(__dirname, '..', sf);
  if (fs.existsSync(sp)) {
    try {
      eval(fs.readFileSync(sp, 'utf8'));
    } catch (e) {
      reportError(`Failed to load simulator file ${sf}: ${e.message}`);
    }
  }
}
const registeredSims = new Set(Object.keys(global.window.SIMULATORS || {}));
let simMountErrors = 0;
for (const [modId, units] of Object.entries(moduleContent)) {
  for (const [unitSlug, unitData] of Object.entries(units)) {
    const html = unitData?.content || '';
    const matches = html.matchAll(/data-sim=["']([^"']+)["']/g);
    for (const m of matches) {
      if (!registeredSims.has(m[1]) && !(global.window.SIMULATORS && global.window.SIMULATORS[m[1]])) {
        reportError(`${modId}/${unitSlug}: unknown simulator mount data-sim="${m[1]}"`);
        simMountErrors++;
      }
    }
  }
}
if (simMountErrors === 0) {
  reportSuccess(`Simulators: ${registeredSims.size} registered interactive simulators verified`);
}

// Internal Link Validation Check
let internalLinkErrors = 0;
let internalLinksChecked = 0;
let legacyWikiLinks = 0;

function checkInternalLinks(str, sourceLabel) {
  if (typeof str !== 'string') return;

  const mdRegex = /\[([^\]]+)\]\((?:\/(?:topic|wiki)\/)([^/#?)\s]+)\/?\)/g;
  let match;
  while ((match = mdRegex.exec(str)) !== null) {
    internalLinksChecked++;
    const fullLink = match[0];
    const targetSlug = match[2];
    if (fullLink.includes('/wiki/')) {
      reportError(`${sourceLabel}: legacy /wiki/ markdown link found: '${fullLink}'`);
      legacyWikiLinks++;
    }
    if (!allSlugs.has(targetSlug)) {
      reportError(`${sourceLabel}: broken internal link target '${targetSlug}' in markdown link '${fullLink}'`);
      internalLinkErrors++;
    }
  }

  const htmlRegex = /href=\\?["'](?:\/(?:topic|wiki)\/)([^/#?"'\\]+)\/?\\?["']/g;
  while ((match = htmlRegex.exec(str)) !== null) {
    internalLinksChecked++;
    const fullLink = match[0];
    const targetSlug = match[1];
    if (fullLink.includes('/wiki/')) {
      reportError(`${sourceLabel}: legacy /wiki/ HTML link found: '${fullLink}'`);
      legacyWikiLinks++;
    }
    if (!allSlugs.has(targetSlug)) {
      reportError(`${sourceLabel}: broken internal link target '${targetSlug}' in HTML link '${fullLink}'`);
      internalLinkErrors++;
    }
  }

  const wikiRegex = /\[\[wiki\/([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  while ((match = wikiRegex.exec(str)) !== null) {
    internalLinksChecked++;
    const fullLink = match[0];
    const targetSlug = match[1];
    if (!allSlugs.has(targetSlug)) {
      reportError(`${sourceLabel}: broken internal wikilink target '${targetSlug}' in '${fullLink}'`);
      internalLinkErrors++;
    }
  }

  const buildHtmlRegex = /href=\\?["'](?:\/build\/|#build\/)([^/#?"'\\]+)\/?\\?["']/g;
  while ((match = buildHtmlRegex.exec(str)) !== null) {
    internalLinksChecked++;
    const fullLink = match[0];
    const targetBuildId = match[1];
    if (fullLink.includes('#build/')) {
      reportError(`${sourceLabel}: legacy #build/ link found (use /build/${targetBuildId}/): '${fullLink}'`);
      internalLinkErrors++;
    }
    if (!allBuildIds.has(targetBuildId)) {
      reportError(`${sourceLabel}: broken build link target '${targetBuildId}' in '${fullLink}'`);
      internalLinkErrors++;
    }
  }
}

checkInternalLinks(JSON.stringify(curriculum), 'data/curriculum.js');

for (const [modId, units] of Object.entries(moduleContent)) {
  for (const [unitSlug, unitData] of Object.entries(units)) {
    checkInternalLinks(JSON.stringify(unitData), `data/content/${modId}.js (${unitSlug})`);
  }
}

for (const pageFile of ['index.html', '404.html', 'projects/index.html']) {
  const fullPagePath = path.join(__dirname, '..', pageFile);
  if (fs.existsSync(fullPagePath)) {
    checkInternalLinks(fs.readFileSync(fullPagePath, 'utf8'), pageFile);
  }
}

if (internalLinkErrors === 0 && legacyWikiLinks === 0) {
  reportSuccess(`Internal links: ${internalLinksChecked} internal links verified against valid curriculum & build slugs (including 404.html)`);
}

let contentMermaidCount = 0;
for (const mod of Object.values(moduleContent)) {
  for (const unit of Object.values(mod)) {
    if (unit && unit.content) {
      contentMermaidCount += (unit.content.match(/class=["']mermaid["']/g) || []).length;
    }
  }
}

const uniqueVideoIds = new Set();
let totalVideoEntries = 0;
for (const mod of Object.values(moduleContent)) {
  for (const unit of Object.values(mod)) {
    if (!unit) continue;
    if (unit.video && unit.video.youtubeId) {
      uniqueVideoIds.add(unit.video.youtubeId);
      totalVideoEntries++;
    }
  }
}
reportSuccess(`Programmatic stats: ${contentMermaidCount} Mermaid diagrams, ${uniqueVideoIds.size} unique YouTube videos (${totalVideoEntries} total entries)`);

// Question bank files
const questionsDir = path.join(dataDir, 'questions');
if (fs.existsSync(questionsDir)) {
  const qFiles = fs.readdirSync(questionsDir).filter(f => f.endsWith('.js'));
  qFiles.forEach(f => {
    try {
      const code = fs.readFileSync(path.join(questionsDir, f), 'utf8');
      eval(code);
    } catch (e) {
      reportError(`Failed to load question file ${f}: ${e.message}`);
    }
  });

  if (global.window.QUESTION_BANK) {
    let totalQuestions = 0;
    let invalidQuestions = 0;
    for (const [slug, questions] of Object.entries(global.window.QUESTION_BANK)) {
      if (!Array.isArray(questions)) {
        reportError(`Question bank entry for "${slug}" is not an array`);
        continue;
      }
      for (const q of questions) {
        totalQuestions++;
        const hasPrompt = Boolean(q.prompt || q.question);
        const hasOptions = q.type === 'numeric' || Array.isArray(q.options);
        const hasAnswer = q.answer !== undefined || (q.type === 'tradeoff' && q.correctOption !== undefined && q.correctReason !== undefined);
        if (!q.id || !q.type || !q.difficulty || !hasPrompt || !hasOptions || !hasAnswer || !q.explanation) {
          reportError(`Question bank invalid question: ${q.id || JSON.stringify(q).slice(0, 100)}`);
          invalidQuestions++;
        }
      }
    }
    const slugCount = Object.keys(global.window.QUESTION_BANK).length;
    if (invalidQuestions === 0) {
      reportSuccess(`Question bank: ${totalQuestions} questions across ${slugCount} units`);
    }
  }
}

// Topic Guided SQL Labs Validation (R4: 180 topics, 540 progressive steps, 0 generic boilerplate)
const topicGuidedLabsFile = path.join(dataDir, 'topic_guided_labs.js');
if (!fs.existsSync(topicGuidedLabsFile)) {
  reportError(`Topic Guided Labs file not found: ${topicGuidedLabsFile}`);
} else {
  let topicGuidedLabsSrc = '';
  try {
    topicGuidedLabsSrc = fs.readFileSync(topicGuidedLabsFile, 'utf8');
    eval(topicGuidedLabsSrc);
  } catch (e) {
    reportError(`Failed to load topic_guided_labs.js: ${e.message}`);
  }

  const topicLabs = global.window.TOPIC_GUIDED_LABS || {};
  let labErrors = 0;

  if (topicGuidedLabsSrc.includes('Base Relation Scan & SARGable Filter')) {
    reportError('data/topic_guided_labs.js contains legacy generic boilerplate "Base Relation Scan & SARGable Filter"');
    labErrors++;
  }
  if (topicGuidedLabsSrc.includes('Relational Join, Grouping & NULL-Safe Aggregation')) {
    reportError('data/topic_guided_labs.js contains legacy generic boilerplate "Relational Join, Grouping & NULL-Safe Aggregation"');
    labErrors++;
  }

  const stripSqlCommentLines = (sql) =>
    String(sql || '')
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim();

  for (const slug of allSlugs) {
    const lab = topicLabs[slug];
    if (!lab) {
      reportError(`topic_guided_labs.js: missing lab entry for curriculum slug "${slug}"`);
      labErrors++;
      continue;
    }
    if (!Array.isArray(lab.steps) || lab.steps.length !== 3) {
      reportError(`topic_guided_labs.js (${slug}): expected steps.length === 3, found ${Array.isArray(lab.steps) ? lab.steps.length : 'non-array'}`);
      labErrors++;
      continue;
    }
    lab.steps.forEach((step, idx) => {
      const stepLabel = `topic_guided_labs.js (${slug} step-${idx + 1})`;
      const textFields = [step.title, step.phase, step.concept, step.instructions, step.description].map((v) => String(v || '')).join(' | ');
      if (textFields.includes('Base Relation Scan & SARGable Filter') || textFields.includes('Relational Join, Grouping & NULL-Safe Aggregation')) {
        reportError(`${stepLabel}: contains forbidden generic boilerplate in title/phase/concept/instructions`);
        labErrors++;
      }
      const starterTrim = String(step.starterCode || '').trim();
      const solutionTrim = String(step.solutionCode || '').trim();
      if (!starterTrim || !solutionTrim) {
        reportError(`${stepLabel}: starterCode and solutionCode must be non-empty strings`);
        labErrors++;
      } else {
        if (starterTrim === solutionTrim) {
          reportError(`${stepLabel}: starterCode is identical to solutionCode`);
          labErrors++;
        } else {
          const starterBody = stripSqlCommentLines(starterTrim);
          const solutionBody = stripSqlCommentLines(solutionTrim);
          if (!starterBody) {
            reportError(`${stepLabel}: starterCode contains only SQL comments (must be runnable SQL)`);
            labErrors++;
          } else if (starterBody === solutionBody) {
            reportError(`${stepLabel}: starterCode equals solutionCode after stripping SQL comments`);
            labErrors++;
          }
        }
      }
    });
  }

  if (labErrors === 0) {
    reportSuccess(`Topic Guided SQL Labs: all ${allSlugs.size} units have 3 topic-specific steps (${allSlugs.size * 3} steps) with distinct starter/solution SQL and 0 generic boilerplate`);
  }
}

// Asset stamps
if (!process.argv.includes('--skip-stamp-check')) {
  try {
    require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'stamp-assets.js'), '--check'], { stdio: 'pipe' });
    reportSuccess('Asset stamps: all ?v= hashes up to date');
  } catch (e) {
    reportError('Asset stamps are stale — run `node tools/stamp-assets.js`');
  }
}


// 3. Static Pages & SEO Validation
const topicBaseDir = path.join(__dirname, '..', 'topic');
const buildBaseDir = path.join(__dirname, '..', 'build');
const sitemapFile = path.join(__dirname, '..', 'sitemap.xml');
let missingStaticCount = 0;
let invalidCanonicalCount = 0;
let emptyReaderCount = 0;
let lowWordCount = 0;

if (fs.existsSync(topicBaseDir)) {
  for (const slug of allSlugs) {
    const pagePath = path.join(topicBaseDir, slug, 'index.html');
    if (!fs.existsSync(pagePath)) {
      missingStaticCount++;
      reportError(`Missing static page: topic/${slug}/index.html`);
      continue;
    }
    const html = fs.readFileSync(pagePath, 'utf8');
    const expectedCanonical = `<link rel="canonical" href="https://sql-in-depth.vedgupta.in/topic/${slug}/">`;
    if (!html.includes(expectedCanonical)) {
      invalidCanonicalCount++;
      reportError(`Invalid or missing canonical URL in topic/${slug}/index.html`);
    }
    if (!html.includes(`data-prerendered="${slug}"`)) {
      emptyReaderCount++;
      reportError(`Empty or un-prerendered reader container in topic/${slug}/index.html`);
    }

    const readerMatch = html.match(/id="reader"[^>]*>([\s\S]*?)<\/div>\s*<\/main>/);
    if (!readerMatch) {
      emptyReaderCount++;
      reportError(`Missing #reader container in topic/${slug}/index.html`);
    } else {
      const readerText = readerMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const words = readerText ? readerText.split(/\s+/).length : 0;
      if (words < 300) {
        lowWordCount++;
        reportError(`Static page topic/${slug}/index.html body text has only ${words} words (< 300 required)`);
      }
    }

    const pMatches = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(t => t.length > 20);
    for (let i = 0; i < pMatches.length - 1; i++) {
      if (pMatches[i] === pMatches[i + 1] || (pMatches[i].length > 40 && pMatches[i + 1].length > 40 && pMatches[i].slice(0, 40) === pMatches[i + 1].slice(0, 40))) {
        reportError(`topic/${slug}/index.html: consecutive duplicate paragraph detected: "${pMatches[i].slice(0, 50)}..."`);
        break;
      }
    }

    const intuitionMatch = html.match(/class="intuition__body">([\s\S]*?)<\/div>/i);
    if (intuitionMatch && /\*\*[^*]+?\*\*/.test(intuitionMatch[1])) {
      reportError(`topic/${slug}/index.html: raw markdown bold (**...**) leaked into .intuition__body`);
    }
  }

  if (missingStaticCount === 0 && invalidCanonicalCount === 0 && emptyReaderCount === 0 && lowWordCount === 0) {
    reportSuccess(`Static topic pages: all ${allSlugs.size} topic pages prerendered with canonical URLs & >= 300 words`);
  }
} else {
  reportError('Static pages directory not found: topic/');
}

let missingBuildStaticCount = 0;
let invalidBuildCanonicalCount = 0;
let emptyBuildReaderCount = 0;
let lowBuildWordCount = 0;

if (fs.existsSync(buildBaseDir)) {
  for (const buildId of allBuildIds) {
    const pagePath = path.join(buildBaseDir, buildId, 'index.html');
    if (!fs.existsSync(pagePath)) {
      missingBuildStaticCount++;
      reportError(`Missing static build page: build/${buildId}/index.html`);
      continue;
    }
    const html = fs.readFileSync(pagePath, 'utf8');
    const expectedCanonical = `<link rel="canonical" href="https://sql-in-depth.vedgupta.in/build/${buildId}/">`;
    if (!html.includes(expectedCanonical)) {
      invalidBuildCanonicalCount++;
      reportError(`Invalid or missing canonical URL in build/${buildId}/index.html`);
    }
    if (!html.includes(`data-prerendered-build="${buildId}"`)) {
      emptyBuildReaderCount++;
      reportError(`Empty or un-prerendered reader container in build/${buildId}/index.html`);
    }

    const readerMatch = html.match(/id="reader"[^>]*>([\s\S]*?)<\/div>\s*<\/main>/);
    if (!readerMatch) {
      emptyBuildReaderCount++;
      reportError(`Missing #reader container in build/${buildId}/index.html`);
    } else {
      const readerText = readerMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const words = readerText ? readerText.split(/\s+/).length : 0;
      if (words < 300) {
        lowBuildWordCount++;
        reportError(`Static build page build/${buildId}/index.html body text has only ${words} words (< 300 required)`);
      }
    }
  }

  if (missingBuildStaticCount === 0 && invalidBuildCanonicalCount === 0 && emptyBuildReaderCount === 0 && lowBuildWordCount === 0) {
    reportSuccess(`Static build pages: all ${allBuildIds.size} interactive build lab pages prerendered with canonical URLs and >= 300 words`);
  }
} else {
  reportError('Static build pages directory not found: build/');
}

// 4. Sitemap Validation
if (fs.existsSync(sitemapFile)) {
  const sitemapContent = fs.readFileSync(sitemapFile, 'utf8');
  let missingSitemapUrls = 0;
  const hubPaths = ['/roadmap/', '/challenges/', '/sandbox/', '/dashboard/', '/projects/'];
  for (const hub of hubPaths) {
    const expectedLoc = `<loc>https://sql-in-depth.vedgupta.in${hub}</loc>`;
    if (!sitemapContent.includes(expectedLoc)) {
      missingSitemapUrls++;
      reportError(`Sitemap missing hub URL: ${hub}`);
    }
  }
  for (const challengeId of allChallengeIds) {
    const expectedLoc = `<loc>https://sql-in-depth.vedgupta.in/challenges/${challengeId}/</loc>`;
    if (!sitemapContent.includes(expectedLoc)) {
      missingSitemapUrls++;
      reportError(`Sitemap missing challenge URL: ${challengeId}`);
    }
  }
  for (const slug of allSlugs) {
    const expectedLoc = `<loc>https://sql-in-depth.vedgupta.in/topic/${slug}/</loc>`;
    if (!sitemapContent.includes(expectedLoc)) {
      missingSitemapUrls++;
      reportError(`Sitemap missing topic URL: ${slug}`);
    }
  }
  for (const buildId of allBuildIds) {
    const expectedLoc = `<loc>https://sql-in-depth.vedgupta.in/build/${buildId}/</loc>`;
    if (!sitemapContent.includes(expectedLoc)) {
      missingSitemapUrls++;
      reportError(`Sitemap missing build URL: ${buildId}`);
    }
  }
  if (missingSitemapUrls === 0) {
    reportSuccess(`Sitemap: contains all ${allSlugs.size} topic URLs, ${allBuildIds.size} build URLs, ${allChallengeIds.size} challenge URLs, and ${hubPaths.length} hub URLs with trailing slashes`);
  }
} else {
  reportError('sitemap.xml not found');
}

// 5. OpenGraph Image & Metadata / H1 Uniqueness Check
const ogImagePath = path.join(__dirname, '..', 'assets', 'og-image.png');
if (!fs.existsSync(ogImagePath)) {
  reportError('Missing OpenGraph image: assets/og-image.png');
} else {
  reportSuccess('OpenGraph image: assets/og-image.png exists');
}

const allHtmlFiles = [
  'index.html',
  '404.html',
  'projects/index.html',
  ...Array.from(allSlugs).map(s => `topic/${s}/index.html`),
  ...Array.from(allBuildIds).map(b => `build/${b}/index.html`)
];
const seenTitles = new Map();
const seenDescs = new Map();
let metaErrors = 0;

for (const relPath of allHtmlFiles) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) continue;
  const html = fs.readFileSync(fullPath, 'utf8');

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const ogImgMatch = html.match(/<meta\s+property="og:image"\s+content="https:\/\/sql-in-depth\.vedgupta\.in\/assets\/og-image\.png"/i);
  const twImgMatch = html.match(/<meta\s+name="twitter:image"\s+content="https:\/\/sql-in-depth\.vedgupta\.in\/assets\/og-image\.png"/i);
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;

  if (!titleMatch) {
    reportError(`${relPath}: missing <title>`);
    metaErrors++;
  } else if (seenTitles.has(titleMatch[1])) {
    reportError(`${relPath}: duplicate <title> with ${seenTitles.get(titleMatch[1])}`);
    metaErrors++;
  } else {
    seenTitles.set(titleMatch[1], relPath);
  }

  if (!descMatch) {
    reportError(`${relPath}: missing <meta name="description">`);
    metaErrors++;
  } else if (seenDescs.has(descMatch[1])) {
    reportError(`${relPath}: duplicate <meta name="description"> with ${seenDescs.get(descMatch[1])}`);
    metaErrors++;
  } else {
    seenDescs.set(descMatch[1], relPath);
  }

  if (!ogImgMatch || !twImgMatch) {
    reportError(`${relPath}: missing absolute og:image or twitter:image tag`);
    metaErrors++;
  }

  if (h1Count !== 1) {
    reportError(`${relPath}: expected exactly 1 <h1> tag, found ${h1Count}`);
    metaErrors++;
  }
}

if (metaErrors === 0) {
  reportSuccess(`Metadata & H1: all ${allHtmlFiles.length} pages have unique <title>, unique description, 1 <h1>, and og:image`);
}

console.log(`\n${errorCount} errors, ${warningCount} warnings`);
process.exit(errorCount > 0 ? 1 : 0);
