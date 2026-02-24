# Runtime Integration Test Design

## Goal

Build true runtime integration tests that execute real files via `node -r ./dist/cjs/register.js <entry.ts>`, validating transform, resolve, and execution behavior. Make these tests required in PR CI and keep them in release prechecks.

## Scope

- Build and execute real files in temporary fixture projects.
- Assert process-level runtime behavior (exit code, stdout, stderr).
- Cover TypeScript/TSX transforms, resolver behavior, module modes, custom transformers, and expected failures.
- Integrate the suite into CI as a required PR check.

## Test Architecture

- Build dist output before runtime integration tests.
- Create temporary fixture directories under the OS temp folder.
- Write fixture source files (`entry.ts`, dependencies, optional `rts.config.js`) to disk.
- Spawn:
  - `node -r <repo>/dist/cjs/register.js <entry-file>`
  - Optional script args (for example `--format=cjs`) appended after entry.
- Capture and assert:
  - exit code
  - stdout and stderr
  - expected runtime result or expected failure signal

## Scenario Matrix

1. TS multi-file runtime execution
2. TSX/JSX runtime execution
3. Alias resolution via `rts.config.js`
4. Directory `index` resolution
5. Custom transformer behavior via config
6. ESM and CJS mode behavior
7. Error-path assertions:
   - syntax error
   - module not found

## CI and Release Gate

- Add `test:integration:runtime` script.
- Ensure `pnpm test` includes runtime integration tests.
- Add PR workflow that installs dependencies, builds dist, and runs tests.
- Keep release script behavior unchanged except relying on `pnpm test` to include this runtime suite.

## Verification

- Local:
  - `pnpm run release:build`
  - `pnpm run test:integration:runtime`
  - `pnpm test`
- CI:
  - PR workflow must fail if any runtime integration case fails.
  - Release workflow continues to fail fast on test failures.
