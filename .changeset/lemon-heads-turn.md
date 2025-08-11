---
"rts.js": patch
---
 Fixed
- resolver: handle null resolve context to avoid crash on Node 18
  - Guard destructuring with `context || {}` to prevent runtime error when `context` is null.
  - Affects: `src/resolver/index.ts`
  - Environment: reproducible on macOS with Node 18; Windows with Node 23 unaffected.