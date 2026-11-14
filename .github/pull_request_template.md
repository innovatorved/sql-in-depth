## Summary
Briefly describe what this pull request changes and why.

## Verification Checklist
- [ ] Ran `npm run prerender && npm run stamp` (if HTML, CSS, JS, or `data/*` changed)
- [ ] `npm test` passes (`tools/validate.js` + `tools/check-rendered.js`)
- [ ] `npm run stamp:check` passes
- [ ] `npm run e2e` passes across SQLite 3 and PostgreSQL 18
- [ ] `npm run build` succeeds
