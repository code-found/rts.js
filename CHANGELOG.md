# rts.js

## 0.0.9

### Patch Changes

- 24bee34: correct exports configuration

  - Move `exports` from `publishConfig` to the package root so Node can resolve it
  - Prefix all subpath keys with "./"
  - Replace wildcard "_" with "./_"
  - Add explicit "./register" export
  - Keep "./package.json" export

## 0.0.8

### Patch Changes

- 5ec638c: correct exports configuration

## 0.0.7

### Patch Changes

- 22fc1d7: add exports filed

## 0.0.6

### Patch Changes

- 8ab5b8f: release verison 0.0.6

## 0.0.5

### Patch Changes

- 3bd7414: CI/CD
  Replace manual Changesets version/publish with changesets/action@v1
  Trigger release when a PR is merged into master; keep workflow\*dispatch
  Update permissions: contents: write, pull-requests: write, id-token: write
  Step order: Checkout → pnpm (v10) → Node 20 → Install → Test → Build → Changesets Action
  Tests
  Use system temporary directory via os.tmpdir() for all temp files (cross-platform)
  Unify cleanup with fs.rmSync(..., { recursive: true, force: true })
  Remove test/temp directory and related references
  Update ava.config.js (remove exclude for test/temp/\*\*/\_.ts)
  Docs
  Update test/README.md to document the new temp file strategy
  Config/Misc
  Set .changeset/config.json baseBranch to master and enable commit: true
  Allow committing Changeset entries by adjusting .gitignore
  Keep Node 20 and pnpm cache configuration for faster installs and builds

## 0.0.4

### Patch Changes

- 1ad20ab: Ci (release): Triggering release when PR is merged into master; Test temporary files to use system temporary directory instead
  -Ci: Modify. ithub/workflows/release. yml
  -The triggering condition is changed to pull*dequest.clost to master, and only executed when merged==true
  -Retain manual triggering of workflow_ispatch
  -Change the workflow name to release
  -Upgrade pnpm/action setup to v10 and adjust the installation order to match pnpm cache
  -Test: Migration of temporary files to system temporary directory
  -All use cases use the rts tests/* subdirectories under os. tpdir() uniformly, compatible with Windows/Linux
  -Adjust file creation and cleanup to fs.rmSync (..., {recursive: true, force: true})
  -Delete the test/temp directory and related dependency paths in the repository
  -Chore (ava): Remove the exclusion of test/temp/\_ _/_. ts in ava.cnfig.js
  -Docs (test): Update temporary file policy instructions in test/README.md

## 0.0.3

### Patch Changes

- 1. fix the bug of ModuleResolver.resolve context param null.
  2. update the info of docs

## 0.0.2

### Patch Changes

- add register module for node -r runtime support

## 0.0.1

### Patch Changes

- feat: first version of rts,with auto transform ts feature.

  - Complete the feature of customize the resolver and loader of Node.js.
  - Create Chinese README documentation (docs/zh/README.md)
  - Add Chinese version link to English README
  - Optimize package.json publish config with object format bin
  - Add files field to explicitly specify package contents
  - Add inline build functionality in release.ts
