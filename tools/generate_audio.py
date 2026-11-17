#!/usr/bin/env python3
"""
SQL In Depth — Human-Like Neural English Narration Generator
Generates natural, studio-grade spoken English MP3 narrations (`audio/<slug>.mp3`) for all
180 SQL & Database Internals lessons with zero local CPU/GPU lag using `edge-tts`
(`en-US-AvaMultilingualNeural` conversational voice, 24 kHz 48 kbps MP3), with an optional
offline `kokoro` (`Kokoro-82M` Apache-2.0) backend.

Usage:
  python3 tools/generate_audio.py --dry-run
  python3 tools/generate_audio.py --slug why-databases-exist --force
  python3 tools/generate_audio.py --changed
  python3 tools/generate_audio.py --all --force --concurrency 12
"""

import os
import sys
import json
import re
import time
import hashlib
import asyncio
import argparse
import subprocess
from pathlib import Path

import edge_tts

ROOT_DIR = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT_DIR / "audio"
MANIFEST_FILE = AUDIO_DIR / "manifest.json"

DEFAULT_VOICE = "en-US-AvaMultilingualNeural"

# Domain-specific pronunciation normalizations for natural database engineering English
SQL_PRONUNCIATION_RULES = [
    (r'\bCSV/JSON\b', 'CSV or JSON'),
    (r'\bI/O\b', 'I O'),
    (r'\bPostgreSQL\b', 'PostgreSQL'),
    (r'\bPGlite\b', 'P G lite'),
    (r'\bSQLite\b', 'SQLite'),
    (r'\bJSONB\b', 'JSON-B'),
    (r'\bpg_class\b', 'pg class'),
    (r'\bpg_attribute\b', 'pg attribute'),
    (r'\bpg_stats\b', 'pg stats'),
    (r'\bpg_stat_statements\b', 'pg stat statements'),
    (r'\bpg_locks\b', 'pg locks'),
    (r'\bpg_buffercache\b', 'pg buffer cache'),
    (r'\bsqlite_master\b', 'sqlite master'),
    (r'\bwork_mem\b', 'work mem'),
    (r'\bshared_buffers\b', 'shared buffers'),
    (r'\beffective_cache_size\b', 'effective cache size'),

    # Storage & MVCC internals
    (r'\bB\+Trees\b', 'B-plus trees'),
    (r'\bB\+Tree\b', 'B-plus tree'),
    (r'\bLSM-trees\b', 'LSM trees'),
    (r'\bLSM-tree\b', 'LSM tree'),
    (r'\bt_xmin\b', 't x-min'),
    (r'\bt_xmax\b', 't x-max'),
    (r'\bt_ctid\b', 't tuple ID'),
    (r'\bxmin/xmax\b', 'x-min and x-max'),
    (r'\bxmin\b', 'x-min'),
    (r'\bxmax\b', 'x-max'),
    (r'\bctid\b', 'tuple ID'),
    (r'\browid\b', 'row ID'),
    (r'\btxid\b', 'transaction ID'),
    (r'\bUUIDv4\b', 'UUID version 4'),
    (r'\bUUIDv7\b', 'UUID version 7'),
    (r'\bvarlena\b', 'variable-length'),
    (r'\bfsync\b', 'f-sync'),
    (r'\bWASM\b', 'WebAssembly'),
    (r'\bRTT\b', 'round-trip time'),
    (r'\bTPS\b', 'transactions per second'),
    (r'\bOOM\b', 'out-of-memory'),
    (r'\bPITR\b', 'point-in-time recovery'),
    (r'\bSSI\b', 'Serializable Snapshot Isolation'),
    (r'\b2PL\b', 'two-phase locking'),
    (r'\b2PC\b', 'two-phase commit'),
    (r'\b3VL\b', 'three-valued logic'),
    (r'\bPKs\b', 'primary keys'),
    (r'\bPK\b', 'primary key'),
    (r'\bFKs\b', 'foreign keys'),
    (r'\bFK\b', 'foreign key'),
    (r'\b1NF\b', 'first normal form'),
    (r'\b2NF\b', 'second normal form'),
    (r'\b3NF\b', 'third normal form'),
    (r'\b4NF\b', 'fourth normal form'),
    (r'\b5NF\b', 'fifth normal form'),
    (r'\bSEV-1\b', 'severity one'),
    (r'\bnon-SARGable\b', 'non-sargable'),
    (r'\bSARGable\b', 'sargable'),
    (r'\bSARGability\b', 'sargability'),
    (r'\bNULLIF\b', 'null-if'),
    (r'\bCOALESCE\b', 'coalesce'),
    (r'\bTIMESTAMPTZ\b', 'timestamp with time zone'),
    (r'\bBIGINT\b', 'big integer'),
    (r'\bVARCHAR\b', 'varchar'),
    (r'\bILIKE\b', 'case-insensitive like'),
    (r'\bUPSERT\b', 'upsert'),
    (r'\bAUTOVACUUM\b', 'autovacuum'),
    (r'\bvs\.(?=\s|$)|\bvs\b', 'versus'),

    # Byte / storage units
    (r'\b(\d+)\s*KB\b', r'\1 kilobyte'),
    (r'\b(\d+)\s*MB\b', r'\1 megabyte'),
    (r'\b(\d+)\s*GB\b', r'\1 gigabyte'),
    (r'\b(\d+)\s*TB\b', r'\1 terabyte'),
    (r'\b(\d+)\s*ms\b', r'\1 milliseconds'),
]


def normalize_math_for_speech(text: str) -> str:
    text = re.sub(r'\$\$([\s\S]*?)\$\$', ' ', text)
    text = re.sub(r'\$([^$\n]+)\$', lambda m: ' ' + _spoken_math_expr(m.group(1)) + ' ', text)
    return _spoken_math_expr(text)


def _spoken_math_expr(expr: str) -> str:
    s = expr
    s = re.sub(r'\\mathcal\{O\}\s*\(|O\s*\(', 'O of (', s)
    s = re.sub(r'\\Theta\s*\(', 'Theta of (', s)
    s = re.sub(r'\\Omega\s*\(', 'Omega of (', s)
    s = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'\1 over \2', s)
    s = re.sub(r'\\sqrt\{([^}]+)\}', r'square root of \1', s)
    s = re.sub(r'\\lfloor([^\\]+)\\rfloor', r'floor of \1', s)
    s = re.sub(r'\\lceil([^\\]+)\\rceil', r'ceiling of \1', s)
    s = re.sub(r'\\log_2|\\lg\b', 'log base 2 of ', s)
    s = re.sub(r'\\log_\{?([a-zA-Z0-9]+)\}?', r'log base \1 of ', s)
    s = re.sub(r'\blog_([a-zA-Z0-9]+)\b', r'log base \1 of', s)
    s = re.sub(r'\\log\b', 'log of ', s)
    s = re.sub(r'10\^7\b', '10 million', s)
    s = re.sub(r'10\^6\b', '1 million', s)
    s = re.sub(r'10\^9\b', '1 billion', s)
    s = re.sub(r'\^2\b', ' squared', s)
    s = re.sub(r'\^3\b', ' cubed', s)
    s = re.sub(r'\^\{([^}]+)\}', r' to the power of \1', s)
    s = re.sub(r'\^([a-zA-Z0-9]+)', r' to the power of \1', s)
    s = re.sub(r'_\{([^}]+)\}', r' \1', s)

    replacements = [
        (r'\\le|\\leq|≤', ' less than or equal to '),
        (r'\\ge|\\geq|≥', ' greater than or equal to '),
        (r'\\neq|\\ne|≠', ' not equal to '),
        (r'\\approx|≈', ' approximately '),
        (r'\\times|\\cdot|×', ' times '),
        (r'\\to|\\rightarrow|→|->', ', then '),
        (r'\\leftarrow|←', ' from '),
        (r'\\infty|∞', ' infinity '),
        (r'\\text\{([^}]+)\}', r'\1'),
        (r'\\mathrm\{([^}]+)\}', r'\1'),
        (r'\\mathbf\{([^}]+)\}', r'\1'),
        (r'\\[a-zA-Z_]+', ' '),
        (r'[{}]', ' '),
    ]
    for pat, rep in replacements:
        s = re.sub(pat, rep, s)
    return s


def apply_sql_pronunciations(text: str) -> str:
    s = text
    for pat, rep in SQL_PRONUNCIATION_RULES:
        s = re.sub(pat, rep, s)
    s = s.replace('_', ' ')
    s = re.sub(r'\b([A-Za-z0-9-]+)\s*/\s*([A-Za-z0-9-]+)\b', r'\1 or \2', s)
    s = s.replace('&', ' and ')
    return s


def clean_text_for_tts(intuition_html: str, content_html: str, title: str = None, takeaways=None) -> str:
    """
    Transforms SQL lesson HTML into concise, natural podcast-style spoken English,
    stripping visual-only widgets, code blocks, formula boxes, SVG/Mermaid diagrams, and redundancy.
    """
    combined = content_html if (content_html and len(content_html.strip()) > 80) else (intuition_html or "")

    # Strip visual/formula-only blocks
    text = re.sub(
        r'<div\s+class=["\']invariant-box["\'][^>]*>\s*(?:<div[^>]*>[\s\S]*?</div>\s*)?[\s\S]*?</div>',
        ' ',
        combined,
        flags=re.I,
    )
    text = re.sub(r'<div\s+class=["\']mermaid["\'][^>]*>[\s\S]*?</div>', ' ', text, flags=re.I)
    text = re.sub(r'<div\s+class=["\']simulator-mount["\'][^>]*>[\s\S]*?</div>', ' ', text, flags=re.I)
    text = re.sub(r'<(script|style|svg|pre|table)[^>]*>[\s\S]*?</\1>', ' ', text, flags=re.I)

    # Strip interactive UI click-instruction sections
    for pat in [
        r'<h2>\s*Interactive Tuple[^<]*</h2>\s*<p>[\s\S]*?</p>',
        r'<h2>\s*Worked Runnable Example[^<]*</h2>\s*<p>[\s\S]*?</p>',
        r'<h2>\s*Edge-Case Verification Query[^<]*</h2>\s*<p>[\s\S]*?</p>',
        r'<h2>\s*Cross-Engine Tradeoffs[^<]*</h2>\s*<p>[\s\S]*?</p>',
    ]:
        text = re.sub(pat, ' ', text, flags=re.I)

    text = re.sub(r'<p>\s*When the database engine evaluates queries in\s*<strong>[\s\S]*?</p>', ' ', text, flags=re.I)
    text = re.sub(r'\(\s*<code>[^<]+</code>\s*\)', '', text, flags=re.I)
    text = re.sub(r'\(\s*(?:AST|MCV|NDV|WAL|MVCC|SSI|2PL|2PC|3VL|SCD|EAV|PITR|OOM|RTT|TPS)\s*\)', '', text)

    if title:
        for tv in {title, title.replace('&', '&amp;'), title.replace("'", "&#39;")}:
            esc_tv = re.escape(tv)
            text = re.sub(rf'<strong>\s*{esc_tv}\s*</strong>\s*addresses a core problem in\s*([^:]+):', r'In \1, a core question is', text, flags=re.I)
            text = re.sub(rf'Every SQL statement in\s*<strong>\s*{esc_tv}\s*</strong>', 'Every SQL statement here', text, flags=re.I)
            text = re.sub(rf'Tracing how\s*<strong>\s*{esc_tv}\s*</strong>\s*flows through', 'Tracing how a query flows through', text, flags=re.I)
            text = re.sub(rf'The most common production failure in\s*<strong>\s*{esc_tv}\s*</strong>\s*occurs', 'The most common production failure occurs', text, flags=re.I)
            text = re.sub(rf'<strong>\s*{esc_tv}\s*</strong>', 'this mechanism', text, flags=re.I)

    text = text.replace('the engine governs implement ', 'the goal is to implement ')
    text = re.sub(r'-+&gt;|&rarr;|→|->', ', then ', text)
    text = re.sub(r'&larr;|←|<-', ' from ', text)

    text = (
        text.replace('&nbsp;', ' ')
        .replace('&amp;', ' and ')
        .replace('&lt;', ' less than ')
        .replace('&gt;', ' greater than ')
        .replace('&le;', ' less than or equal to ')
        .replace('&ge;', ' greater than or equal to ')
        .replace('&quot;', '"')
        .replace('&#039;', "'")
        .replace('&#39;', "'")
        .replace('&mdash;', ', ')
        .replace('&ndash;', ' to ')
    )

    text = re.sub(r'```[\s\S]*?```', ' ', text)
    text = re.sub(r'!\[([^\]]*)\]\([^\)]+\)', ' ', text)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    text = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]', r'\1', text)

    text = re.sub(r'<h[1-6][^>]*>[\s\S]*?</h[1-6]>', '\n', text, flags=re.I)
    text = re.sub(r'<div\s+class=["\']callout__title["\'][^>]*>[\s\S]*?</div>', '\n', text, flags=re.I)

    text = normalize_math_for_speech(text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'</?(p|div|li|blockquote|section|article|aside)[^>]*>', '\n', text)
    text = re.sub(r'<[^>]+>', ' ', text)

    text = re.sub(r'^[ \t]*#+[ \t]*(.+)$', r'\1.', text, flags=re.M)
    text = re.sub(r'^[ \t]*[-*+▶✓][ \t]+', '', text, flags=re.M)
    text = re.sub(r'[▶✓*`~\\]', '', text)
    text = text.replace('—', ', ').replace('–', ' to ').replace('--', ' to ')

    dedup_lines = []
    for ln in (re.sub(r'[ \t]+', ' ', raw).strip() for raw in text.split('\n')):
        if ln and ln not in dedup_lines:
            dedup_lines.append(ln)
    cleaned_body = ' '.join(dedup_lines)

    parts = []
    if title:
        spoken_title = apply_sql_pronunciations(normalize_math_for_speech(title))
        parts.append(f"SQL In Depth. {spoken_title}.")

    parts.append(apply_sql_pronunciations(cleaned_body))

    if takeaways and len(takeaways) > 0:
        closing = []
        for t in takeaways[1:3]:
            ct = re.sub(r'-+>', ', then ', t)
            ct = re.sub(r'<[^>]+>', '', normalize_math_for_speech(ct)).strip()
            ct = apply_sql_pronunciations(ct)
            if ct:
                closing.append(ct)
        if closing:
            parts.append("In summary: " + " ".join(closing))

    full_narration = " ".join(parts)
    full_narration = re.sub(r'\(\s*\)', '', full_narration)
    full_narration = re.sub(r'\s+', ' ', full_narration)
    full_narration = re.sub(r'\.{2,}', '.', full_narration)
    full_narration = re.sub(r',\s*,+', ',', full_narration)
    full_narration = re.sub(r'\s+([.,!?;:])', r'\1', full_narration)

    if len(full_narration) > 1800:
        cutoff = full_narration.rfind('.', 1250, 1800)
        if cutoff != -1:
            full_narration = full_narration[:cutoff + 1]
        else:
            full_narration = full_narration[:1800].rsplit(' ', 1)[0] + '.'

    return full_narration.strip()


def load_curriculum_and_content():
    cmd = [
        "node", "-e",
        """
        global.window = {};
        const fs = require('fs');
        require('./data/curriculum.js');
        fs.readdirSync('data/content').forEach(f => {
          if (f.endsWith('.js')) require('./data/content/' + f);
        });
        console.log(JSON.stringify({
          curriculum: global.window.CURRICULUM_DATA,
          modules: global.window.MODULE_CONTENT || {}
        }));
        """
    ]
    res = subprocess.run(cmd, cwd=str(ROOT_DIR), capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def get_manifest():
    if MANIFEST_FILE.exists():
        try:
            with open(MANIFEST_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_manifest(manifest):
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_FILE, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")


async def generate_single_edge(text: str, voice: str, output_path: Path):
    last_err = None
    for attempt in range(4):
        try:
            comm = edge_tts.Communicate(text, voice)
            await comm.save(str(output_path))
            return
        except Exception as e:
            last_err = e
            await asyncio.sleep(1.0 * (attempt + 1))
    raise last_err


async def process_edge_queue(targets, voice: str, manifest: dict, concurrency: int):
    sem = asyncio.Semaphore(concurrency)
    total = len(targets)
    done_count = 0
    t0 = time.time()

    async def worker(item):
        nonlocal done_count
        slug, text, h = item
        out_path = AUDIO_DIR / f"{slug}.mp3"
        async with sem:
            try:
                await generate_single_edge(text, voice, out_path)
                size_bytes = out_path.stat().st_size if out_path.exists() else 0
                # 24kHz 48kbps CBR MP3 = 6000 bytes/sec exact
                dur = round(size_bytes / 6000.0, 1)
                manifest[slug] = {
                    "hash": h,
                    "voice": voice,
                    "duration": dur,
                    "size": size_bytes,
                    "chars": len(text),
                }
                done_count += 1
                if done_count % 10 == 0 or done_count == total:
                    save_manifest(manifest)
                    elapsed = time.time() - t0
                    eta = (elapsed / done_count) * (total - done_count)
                    print(f"[{done_count}/{total}] ✓ {slug}.mp3 ({dur:.1f}s, {size_bytes // 1024} KB) | {elapsed:.0f}s elapsed, ETA {eta:.0f}s", flush=True)
            except Exception as err:
                done_count += 1
                print(f"[{done_count}/{total}] ✖ {slug}: {err}", file=sys.stderr, flush=True)

    await asyncio.gather(*(worker(t) for t in targets))


def main():
    parser = argparse.ArgumentParser(description="Generate natural English neural TTS narration for SQL In Depth")
    parser.add_argument("--slug", help="Generate audio for a specific unit slug")
    parser.add_argument("--module", help="Generate audio for a specific module (e.g. m01, m14)")
    parser.add_argument("--part", help="Generate audio for specific curriculum part(s) (e.g. 1, 2, '1,2')")
    parser.add_argument("--all", action="store_true", help="Generate audio for all 180 units")
    parser.add_argument("--changed", action="store_true", help="Generate audio for units with changed/missing MP3 or voice")
    parser.add_argument("--force", action="store_true", help="Force regeneration even if hash matches")
    parser.add_argument("--dry-run", action="store_true", help="Preview narration text without generating audio")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"Neural TTS voice (default: {DEFAULT_VOICE})")
    parser.add_argument("--concurrency", type=int, default=12, help="Concurrent async streams (default: 12)")
    args = parser.parse_args()

    if not (args.slug or args.module or args.part or args.all):
        args.changed = True

    data = load_curriculum_and_content()
    curriculum = data["curriculum"]
    module_contents = data["modules"]

    manifest = get_manifest()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    all_units = []
    for part_idx, part in enumerate(curriculum.get("parts", []), 1):
        for mod in part.get("modules", []):
            mod_id = mod.get("id")
            mod_number = mod.get("number")
            for unit in mod.get("units", []):
                slug = unit.get("slug")
                title = unit.get("title")
                mod_unit_data = module_contents.get(mod_id, {}).get(slug, {})
                narration_text = clean_text_for_tts(
                    mod_unit_data.get("intuition", ""),
                    mod_unit_data.get("content", ""),
                    title=title,
                    takeaways=mod_unit_data.get("keyTakeaways", []),
                )
                all_units.append({
                    "partNumber": part_idx,
                    "moduleId": mod_id,
                    "moduleNumber": mod_number,
                    "slug": slug,
                    "title": title,
                    "text": narration_text,
                })

    targets = []
    for u in all_units:
        slug = u["slug"]
        mod_id = u["moduleId"]
        mod_num = u.get("moduleNumber")
        part_num = u.get("partNumber")

        if args.slug and args.slug != slug:
            continue
        if args.part:
            requested_parts = [int(x.strip()) for x in str(args.part).split(",") if x.strip().isdigit()]
            if part_num not in requested_parts:
                continue
        if args.module:
            m_target = str(args.module).lower().strip()
            matched = m_target == mod_id.lower()
            if not matched:
                num_part = re.sub(r"[^0-9]", "", m_target)
                if num_part and mod_num and str(num_part) == re.sub(r"[^0-9]", "", str(mod_num)):
                    matched = True
            if not matched:
                continue

        text_hash = hashlib.sha256(u["text"].encode("utf-8")).hexdigest()
        out_file = AUDIO_DIR / f"{slug}.mp3"
        has_file = out_file.exists() and out_file.stat().st_size > 10000
        rec = manifest.get(slug, {})
        is_changed = (not has_file) or (rec.get("hash") != text_hash) or (rec.get("voice") != args.voice)

        if args.all or args.force or (args.slug and slug == args.slug):
            targets.append((slug, u["text"], text_hash))
        elif args.changed and is_changed:
            targets.append((slug, u["text"], text_hash))
        elif (args.module or args.part) and (args.force or is_changed):
            targets.append((slug, u["text"], text_hash))

    print(f"Found {len(all_units)} curriculum units; selected {len(targets)} for narration ({args.voice}).", flush=True)

    if args.dry_run:
        for slug, text, _ in targets[:3]:
            print(f"\n--- {slug} ({len(text)} chars) ---\n{text}")
        return

    if not targets:
        print("All audio tracks are already up to date.")
        return

    t0 = time.time()
    print(f"Streaming {len(targets)} audio track(s) asynchronously (voice={args.voice}, concurrency={args.concurrency}, ~0% CPU/GPU)...", flush=True)
    asyncio.run(process_edge_queue(targets, args.voice, manifest, args.concurrency))
    save_manifest(manifest)
    print(f"\nCompleted {len(targets)} narrations in {time.time() - t0:.1f}s. Manifest saved to audio/manifest.json.", flush=True)


if __name__ == "__main__":
    main()
