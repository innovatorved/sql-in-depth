# Security Policy

## Architecture & Threat Model

SQL In Depth is a pure static client-side web application (`https://sql-in-depth.vedgupta.in`) with zero backend execution servers, zero user authentication databases, and zero server-side query processing.

1. **Client-Side SQL Isolation (`js/sql-worker.js`, `js/sql-engine.js`)**:
   - User-authored SQL queries in `/sandbox/`, Guided SQL Labs, and Incident Challenges execute exclusively inside the visitor's own browser via WebAssembly (`sql.js` SQLite 3 and `@electric-sql/pglite` PostgreSQL 18) inside an isolated Web Worker.
   - Shareable `?q=` / `?sql=` query URLs populate the editor buffer and dataset state without executing arbitrary JavaScript; all query result cells, column headers, and error messages are HTML-escaped before DOM insertion.
2. **Reference Engine IDE (`@innovatorved/code-lab` `v0.4.0`)**:
   - Reference storage-engine labs under `/build/*` run inside `@innovatorved/code-lab`'s dedicated `Blob`-backed Web Worker with hard timeout preemption and iframe `sandbox` isolation (`allow-scripts allow-forms allow-modals`, opaque `null` origin).
3. **Static Hosting Headers (`_headers`)**:
   - Deployed with `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and strict immutable caching on content-stamped assets.

## Supported Versions

Security fixes are applied to the latest commit on the `main` branch.

## Reporting a Vulnerability

Please report security vulnerabilities (such as DOM XSS via URL parameters or sandbox escapes) privately via [GitHub Security Advisories](https://github.com/innovatorved/sql-in-depth/security/advisories/new) rather than opening a public issue. Include:

1. Affected route and component (`sandbox`, `table-visualizer`, `renderer`, `search`, or `code-lab`).
2. Minimal reproduction URL or payload.
3. Expected vs. actual security boundary behavior.

We aim to acknowledge reports within 48 hours and publish a fix once verified.
