#!/usr/bin/env python3
"""
DSA In Depth - Neural Audio Narration Generator
Uses Microsoft Edge TTS to generate studio-quality spoken audio for all 180 DSA lessons.

Usage:
  python3 tools/generate_audio.py --dry-run
  python3 tools/generate_audio.py --slug ram-model-vs-modern-cpu
  python3 tools/generate_audio.py --module m01
  python3 tools/generate_audio.py --changed
  python3 tools/generate_audio.py --all --concurrency 8
"""

import os
import sys
import json
import re
import hashlib
import asyncio
import argparse
import subprocess
from pathlib import Path
import edge_tts

ROOT_DIR = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT_DIR / "audio"
MANIFEST_FILE = AUDIO_DIR / "manifest.json"

DEFAULT_VOICE = "en-US-GuyNeural"


def normalize_math_for_speech(text):
    """
    Converts LaTeX math and algorithmic notation into natural spoken English.
    """
    # Display math $$...$$ -> spoken
    text = re.sub(r'\$\$([\s\S]*?)\$\$', lambda m: ' ' + _spoken_math_expr(m.group(1)) + ' ', text)
    # Inline math $...$ -> spoken
    text = re.sub(r'\$([^$\n]+)\$', lambda m: ' ' + _spoken_math_expr(m.group(1)) + ' ', text)
    # Remaining common LaTeX / Unicode symbols outside $
    text = _spoken_math_expr(text)
    return text


def _spoken_math_expr(expr):
    s = expr
    # Common asymptotic patterns
    s = re.sub(r'\\mathcal\{O\}|O\s*\(', 'O of (', s)
    s = re.sub(r'\\Theta\s*\(', 'Theta of (', s)
    s = re.sub(r'\\Omega\s*\(', 'Omega of (', s)
    s = re.sub(r'\\omega\s*\(', 'little omega of (', s)
    s = re.sub(r'o\s*\(', 'little o of (', s)

    # Fractions & roots
    s = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'\1 over \2', s)
    s = re.sub(r'\\sqrt\{([^}]+)\}', r'square root of \1', s)
    s = re.sub(r'\\lfloor([^\\]+)\\rfloor', r'floor of \1', s)
    s = re.sub(r'\\lceil([^\\]+)\\rceil', r'ceiling of \1', s)

    # Logs and powers
    s = re.sub(r'\\log_2|\\lg\b', 'log base 2 ', s)
    s = re.sub(r'\\log_\{?([a-zA-Z0-9]+)\}?', r'log base \1 ', s)
    s = re.sub(r'\\log\b', 'log ', s)
    s = re.sub(r'\^2\b', ' squared', s)
    s = re.sub(r'\^3\b', ' cubed', s)
    s = re.sub(r'\^\{([^}]+)\}', r' to the power of \1', s)
    s = re.sub(r'\^([a-zA-Z0-9]+)', r' to the \1', s)
    s = re.sub(r'_\{([^}]+)\}', r' sub \1', s)
    s = re.sub(r'_([a-zA-Z0-9]+)', r' sub \1', s)

    # Greek & operators
    replacements = [
        (r'\\Theta', 'Theta'),
        (r'\\Omega', 'Omega'),
        (r'\\Phi', 'Phi'),
        (r'\\phi', 'phi'),
        (r'\\Delta', 'Delta'),
        (r'\\alpha', 'alpha'),
        (r'\\beta', 'beta'),
        (r'\\gamma', 'gamma'),
        (r'\\lambda', 'lambda'),
        (r'\\mu', 'mu'),
        (r'\\sigma', 'sigma'),
        (r'\\epsilon|\\varepsilon', 'epsilon'),
        (r'\\sum', 'sum '),
        (r'\\prod', 'product '),
        (r'\\le|\\leq|≤', ' less than or equal to '),
        (r'\\ge|\\geq|≥', ' greater than or equal to '),
        (r'\\neq|\\ne|≠', ' not equal to '),
        (r'\\approx|≈', ' approximately '),
        (r'\\equiv|≡', ' congruent to '),
        (r'\\times|\\cdot|×', ' times '),
        (r'\\to|\\rightarrow|→|->', ' to '),
        (r'\\leftarrow|←', ' from '),
        (r'\\leftrightarrow|⇄', ' swapped with '),
        (r'\\infty|∞', ' infinity '),
        (r'\\in\b', ' in '),
        (r'\\subseteq', ' subset of '),
        (r'\\cup', ' union '),
        (r'\\cap', ' intersection '),
        (r'\\oplus', ' XOR '),
        (r'\\land', ' and '),
        (r'\\lor', ' or '),
        (r'\\text\{([^}]+)\}', r'\1'),
        (r'\\mathrm\{([^}]+)\}', r'\1'),
        (r'\\mathbf\{([^}]+)\}', r'\1'),
        (r'\\[a-zA-Z]+', ' '),
        (r'[{}]', ' '),
    ]
    for pat, rep in replacements:
        s = re.sub(pat, rep, s)
    return s


def clean_text_for_tts(raw_text, title=None, takeaways=None):
    """
    Cleans raw markdown, HTML, and LaTeX into natural, fluent text suitable for spoken narration.
    """
    if not raw_text:
        raw_text = ""

    # Remove script, style, svg, pre, code blocks
    text = re.sub(r'<(script|style|svg|pre)[^>]*>[\s\S]*?</\1>', ' ', raw_text, flags=re.I)

    # Remove mermaid and fenced code blocks
    text = re.sub(r'```mermaid[\s\S]*?```', ' ', text)
    text = re.sub(r'```[\s\S]*?```', ' ', text)

    # Remove markdown images
    text = re.sub(r'!\[([^\]]*)\]\([^\)]+\)', ' ', text)

    # Convert markdown links [Text](url) -> Text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)

    # Convert wiki links [[slug|Text]] -> Text
    text = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]+)\]\]', r'\1', text)

    # Remove HTML tables (dense complexity tables are better summarized in prose)
    text = re.sub(r'<table[^>]*>[\s\S]*?</table>', ' ', text, flags=re.I)

    # Normalize LaTeX math into spoken English
    text = normalize_math_for_speech(text)

    # Remove HTML tags but retain sentence spacing
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'</?(h[1-6]|p|div|li|blockquote|section|article|aside)[^>]*>', '\n', text)
    text = re.sub(r'<[^>]+>', ' ', text)

    # Remove markdown table formatting (| col | col |)
    text = re.sub(r'\|[^\n]+\|', ' ', text)
    text = re.sub(r'^[ \t]*[-:]+[-| :]+$', '', text, flags=re.M)

    # Remove markdown headers (# Title)
    text = re.sub(r'^[ \t]*#+[ \t]*(.+)$', r'\1.', text, flags=re.M)

    # Remove bullet markers (- item, * item)
    text = re.sub(r'^[ \t]*[-*+][ \t]+', '', text, flags=re.M)
    text = re.sub(r'^[ \t]*\d+\.[ \t]+', '', text, flags=re.M)

    # Remove markdown formatting characters
    text = re.sub(r'[*_`~]', '', text)

    # Clean HTML entities
    text = (
        text.replace('&nbsp;', ' ')
        .replace('&amp;', ' and ')
        .replace('&lt;', ' less than ')
        .replace('&gt;', ' greater than ')
        .replace('&le;', ' less than or equal to ')
        .replace('&ge;', ' greater than or equal to ')
        .replace('&quot;', '"')
        .replace('&#039;', "'")
        .replace('&mdash;', ' — ')
        .replace('&ndash;', ' - ')
        .replace('&rarr;', ' to ')
    )

    # Normalize whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    cleaned_body = ' '.join(lines)

    parts = []
    if title:
        clean_t = normalize_math_for_speech(title)
        parts.append(f"Data Structures and Algorithms in Depth. Lesson: {clean_t}.")

    if title:
        clean_title = re.sub(r'[^a-zA-Z0-9 ]', '', title).strip().lower()
        while True:
            body_start = re.sub(r'[^a-zA-Z0-9 ]', '', cleaned_body[:len(title) + 15]).strip().lower()
            if clean_title and body_start.startswith(clean_title):
                dot_pos = cleaned_body.find('.')
                if 0 <= dot_pos < len(title) + 25:
                    cleaned_body = cleaned_body[dot_pos + 1:].strip()
                else:
                    break
            else:
                break

    parts.append(cleaned_body)

    if takeaways and len(takeaways) > 0:
        cleaned_takeaways = []
        for idx, t in enumerate(takeaways, 1):
            ct = re.sub(r'<[^>]+>', '', normalize_math_for_speech(t)).strip()
            if ct:
                cleaned_takeaways.append(f"Point {idx}: {ct}")
        if cleaned_takeaways:
            parts.append("Key Takeaways: " + " ".join(cleaned_takeaways))

    full_narration = " ".join(parts)

    # Collapse multiple spaces and clean punctuation
    full_narration = re.sub(r'\s+', ' ', full_narration)
    full_narration = re.sub(r'\.{2,}', '.', full_narration)
    full_narration = re.sub(r'\s+([.,!?;:])', r'\1', full_narration)

    # Optimal limit ~3200 chars for concise microlearning podcast-style audio
    if len(full_narration) > 3200:
        cutoff = full_narration.rfind('.', 2500, 3200)
        if cutoff != -1:
            full_narration = full_narration[:cutoff + 1]
        else:
            full_narration = full_narration[:3200].rsplit(' ', 1)[0] + '.'

    return full_narration.strip()


def load_curriculum_and_content():
    """
    Loads curriculum.js and all data/content/m*.js files via Node.
    """
    cmd = [
        "node", "-e",
        """
        global.window = {};
        const fs = require('fs');
        require('./data/curriculum.js');
        fs.readdirSync('data/content').forEach(f => {
          if (f.endsWith('.js')) require('./data/content/' + f);
        });
        const data = {
          curriculum: global.window.CURRICULUM_DATA,
          modules: global.window.MODULE_CONTENT || {},
          archive: global.window.ARCHIVE_CONTENT || {}
        };
        console.log(JSON.stringify(data));
        """
    ]
    res = subprocess.run(cmd, cwd=str(ROOT_DIR), capture_output=True, text=True, check=True)
    return json.loads(res.stdout)


def get_manifest():
    if MANIFEST_FILE.exists():
        try:
            with open(MANIFEST_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_manifest(manifest):
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_FILE, 'w') as f:
        json.dump(manifest, f, indent=2)


async def generate_single_audio(slug, text, voice, output_path):
    """
    Calls edge_tts to generate MP3 for the given text with retry.
    """
    last_err = None
    for attempt in range(3):
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(str(output_path))
            return
        except Exception as e:
            last_err = e
            await asyncio.sleep(1.0 * (attempt + 1))
    raise last_err


async def process_queue(tasks, concurrency=6):
    sem = asyncio.Semaphore(concurrency)

    async def worker(task):
        async with sem:
            slug, title, text, voice, out_path, manifest, h = task
            print(f"🎙️  [Generating] {slug} ({title[:35]}...)", flush=True)
            try:
                await generate_single_audio(slug, text, voice, out_path)
                manifest[slug] = {
                    "hash": h,
                    "voice": voice,
                    "size": out_path.stat().st_size if out_path.exists() else 0,
                    "chars": len(text)
                }
                save_manifest(manifest)
                print(f"✅ [Done] {slug} ({manifest[slug]['size']} bytes)", flush=True)
            except Exception as err:
                print(f"❌ [Error] {slug}: {err}", flush=True)

    await asyncio.gather(*(worker(t) for t in tasks))


def main():
    parser = argparse.ArgumentParser(description="Generate neural TTS audio narration for DSA lessons")
    parser.add_argument("--slug", help="Generate audio for a specific unit slug")
    parser.add_argument("--module", help="Generate audio for a specific module (e.g. m01, m14)")
    parser.add_argument("--part", help="Generate audio for specific curriculum part(s) (e.g. 2, 3, '2,3')")
    parser.add_argument("--all", action="store_true", help="Generate audio for all units")
    parser.add_argument("--changed", action="store_true", help="Generate audio for units with changed or missing content")
    parser.add_argument("--force", action="store_true", help="Force regeneration even if content hash matches")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated without making API calls")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"Edge TTS voice (default: {DEFAULT_VOICE})")
    parser.add_argument("--concurrency", type=int, default=6, help="Max concurrent TTS requests (default: 6)")
    args = parser.parse_args()

    if not (args.slug or args.module or args.part or args.all):
        args.changed = True

    print("📚 Loading DSA curriculum and content modules...")
    data = load_curriculum_and_content()
    curriculum = data["curriculum"]
    module_contents = data["modules"]
    archive_contents = data["archive"]

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

                raw = ""
                if slug in archive_contents and len(archive_contents[slug].strip()) > 100:
                    raw = archive_contents[slug]
                elif unit.get("archive", {}).get("content"):
                    raw = unit["archive"]["content"]

                mod_unit_data = module_contents.get(mod_id, {}).get(slug, {})
                intuition = mod_unit_data.get("intuition", "")
                mod_content = mod_unit_data.get("content", "")
                takeaways = mod_unit_data.get("keyTakeaways", [])

                combined = ""
                if intuition:
                    combined += intuition + "\n\n"
                if mod_content:
                    combined += mod_content + "\n\n"
                if raw and not combined:
                    combined = raw

                narration_text = clean_text_for_tts(combined, title=title, takeaways=takeaways)

                all_units.append({
                    "partNumber": part_idx,
                    "moduleId": mod_id,
                    "moduleNumber": mod_number,
                    "slug": slug,
                    "title": title,
                    "text": narration_text,
                    "takeaways": takeaways
                })

    print(f"🔍 Found {len(all_units)} total units across curriculum.")

    targets = []
    for u in all_units:
        slug = u["slug"]
        mod_id = u["moduleId"]
        mod_num = u.get("moduleNumber")
        part_num = u.get("partNumber")

        if args.slug and args.slug != slug:
            continue
        if args.part:
            requested_parts = [int(x.strip()) for x in str(args.part).split(',') if x.strip().isdigit()]
            if part_num not in requested_parts:
                continue
        if args.module:
            m_target = str(args.module).lower().strip()
            matched = (m_target == mod_id.lower())
            if not matched:
                num_part = re.sub(r'[^0-9]', '', m_target)
                if num_part and mod_num and str(num_part) == re.sub(r'[^0-9]', '', str(mod_num)):
                    matched = True
            if not matched:
                continue

        text_hash = hashlib.sha256(u["text"].encode("utf-8")).hexdigest()
        out_file = AUDIO_DIR / f"{slug}.mp3"

        has_file = out_file.exists() and out_file.stat().st_size > 5000
        recorded_hash = manifest.get(slug, {}).get("hash")
        is_changed = (not has_file) or (recorded_hash != text_hash)

        if args.all or args.force or (args.slug and slug == args.slug):
            targets.append((u, text_hash, is_changed))
        elif args.changed and is_changed:
            targets.append((u, text_hash, is_changed))
        elif args.module or args.part:
            if args.force or is_changed:
                targets.append((u, text_hash, is_changed))

    print(f"🎯 Selected {len(targets)} unit(s) for audio generation.")

    if args.dry_run:
        print("\n[Dry Run Summary]:")
        for u, h, ch in targets[:15]:
            status = "NEEDS_GENERATION" if ch else "UP_TO_DATE"
            print(f"  • {u['slug']} [{status}] ({len(u['text'])} chars)")
        if len(targets) > 15:
            print(f"  ... and {len(targets) - 15} more.")
        return

    if not targets:
        print("✨ All audio files are already up-to-date with current lesson content!")
        return

    tasks = []
    for u, h, _ in targets:
        out_path = AUDIO_DIR / f"{u['slug']}.mp3"
        tasks.append((u["slug"], u["title"], u["text"], args.voice, out_path, manifest, h))

    print(f"\n🚀 Launching generation for {len(tasks)} audio track(s) with voice '{args.voice}' (concurrency={args.concurrency})...")
    asyncio.run(process_queue(tasks, concurrency=args.concurrency))

    save_manifest(manifest)
    print("\n✨ Audio generation complete! Updated manifest saved to audio/manifest.json.")


if __name__ == "__main__":
    main()
