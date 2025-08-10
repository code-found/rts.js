---
"rts.js": patch
---

correct exports configuration

- Move `exports` from `publishConfig` to the package root so Node can resolve it
- Prefix all subpath keys with "./"
- Replace wildcard "*" with "./*"
- Add explicit "./register" export
- Keep "./package.json" export